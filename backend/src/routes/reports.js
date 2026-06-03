const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { parseDate } = require('../utils/dates');

const router = express.Router();
router.use(requireAdmin);

function defaultRevenueRange(req) {
  const now = new Date();
  const start = parseDate(req.query.start_date) || new Date(now.getFullYear(), 0, 1);
  const end = parseDate(req.query.end_date) || now;
  return { start, end, now };
}

function membersQuery(req) {
  const now = new Date();
  if (req.query.status_filter === 'active') return { expiry_date: { $gte: now } };
  if (req.query.status_filter === 'expired') return { expiry_date: { $lt: now } };
  return {};
}

function sendWorkbook(res, workbook, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  return workbook.xlsx.write(res).then(() => res.end());
}

function buildPdf(callback) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    Promise.resolve(callback(doc)).then(() => doc.end());
  });
}

async function planName(planId) {
  const plan = await Plan.findById(planId).lean();
  return plan?.name || 'Unknown';
}

router.get('/revenue/excel', asyncHandler(async (req, res) => {
  const { start, end, now } = defaultRevenueRange(req);
  const payments = await Payment.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 }).lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Revenue Report');
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `Revenue Report (${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)})`;
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: '6366F1' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.addRow([]);
  sheet.addRow(['Date', 'Member ID', 'Member Name', 'Plan', 'Amount', 'Payment Method']);
  sheet.getRow(3).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
  });

  let total = 0;
  for (const payment of payments) {
    const member = await Member.findById(payment.member_id).lean();
    sheet.addRow([
      payment.date.toISOString().slice(0, 16).replace('T', ' '),
      String(payment.member_id || ''),
      member?.full_name || 'Deleted Member',
      payment.plan_name || '',
      payment.amount,
      payment.payment_method || 'cash',
    ]);
    total += payment.amount;
  }
  sheet.addRow([]);
  sheet.addRow(['', '', '', 'TOTAL', total, '']);
  sheet.columns.forEach((column) => { column.width = 22; });

  await sendWorkbook(res, workbook, `revenue_report_${now.toISOString().slice(0, 10)}.xlsx`);
}));

router.get('/members/excel', asyncHandler(async (req, res) => {
  const now = new Date();
  const members = await Member.find(membersQuery(req)).sort({ full_name: 1 }).lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Members Report');
  sheet.mergeCells('A1:H1');
  sheet.getCell('A1').value = `Members Report - Generated ${now.toISOString().slice(0, 10)}`;
  sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: '10B981' } };
  sheet.addRow([]);
  sheet.addRow(['Name', 'Mobile', 'Email', 'Address', 'Plan', 'Join Date', 'Expiry Date', 'Payment Status']);
  sheet.getRow(3).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  });

  for (const member of members) {
    sheet.addRow([
      member.full_name,
      member.mobile,
      member.email || '',
      member.address || '',
      await planName(member.plan_id),
      member.join_date.toISOString().slice(0, 10),
      member.expiry_date.toISOString().slice(0, 10),
      member.payment_status,
    ]);
  }
  sheet.columns.forEach((column) => { column.width = 22; });

  await sendWorkbook(res, workbook, `members_report_${now.toISOString().slice(0, 10)}.xlsx`);
}));

router.get('/revenue/pdf', asyncHandler(async (req, res) => {
  const { start, end, now } = defaultRevenueRange(req);
  const payments = await Payment.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 }).lean();

  const buffer = await buildPdf(async (doc) => {
    doc.fontSize(20).fillColor('#6366F1').text('Revenue Report', { align: 'center' });
    doc.moveDown(0.5).fontSize(10).fillColor('#111111')
      .text(`Period: ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Date        Member                  Plan              Amount   Method');
    doc.font('Helvetica');
    let total = 0;
    for (const payment of payments.slice(0, 45)) {
      const member = await Member.findById(payment.member_id).lean();
      total += payment.amount;
      doc.text([
        payment.date.toISOString().slice(0, 10).padEnd(12),
        (member?.full_name || 'Deleted').slice(0, 20).padEnd(22),
        (payment.plan_name || '').slice(0, 16).padEnd(18),
        String(payment.amount).padEnd(8),
        payment.payment_method || 'cash',
      ].join(' '));
    }
    doc.moveDown().font('Helvetica-Bold').text(`TOTAL: Rs ${total.toLocaleString('en-IN')}`);
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${now.toISOString().slice(0, 10)}.pdf`);
  res.send(buffer);
}));

router.get('/members/pdf', asyncHandler(async (req, res) => {
  const now = new Date();
  const members = await Member.find(membersQuery(req)).sort({ full_name: 1 }).lean();

  const buffer = await buildPdf(async (doc) => {
    doc.fontSize(20).fillColor('#10B981').text('Members Report', { align: 'center' });
    doc.moveDown(0.5).fontSize(10).fillColor('#111111')
      .text(`Generated: ${now.toISOString().slice(0, 16).replace('T', ' ')}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Name                  Mobile       Plan              Expiry      Status');
    doc.font('Helvetica');
    for (const member of members.slice(0, 55)) {
      const status = member.expiry_date >= now ? 'Active' : 'Expired';
      doc.text([
        member.full_name.slice(0, 20).padEnd(22),
        member.mobile.padEnd(12),
        (await planName(member.plan_id)).slice(0, 16).padEnd(18),
        member.expiry_date.toISOString().slice(0, 10).padEnd(12),
        status,
      ].join(' '));
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=members_report_${now.toISOString().slice(0, 10)}.pdf`);
  res.send(buffer);
}));

module.exports = router;
