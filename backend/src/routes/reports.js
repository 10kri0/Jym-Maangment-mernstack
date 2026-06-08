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
  const query = { admin_id: req.admin.id };
  if (req.query.status_filter === 'active') query.expiry_date = { $gte: now };
  if (req.query.status_filter === 'expired') query.expiry_date = { $lt: now };
  return query;
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

async function planName(planId, adminId) {
  const plan = await Plan.findOne({ _id: planId, admin_id: adminId }).lean();
  return plan?.name || 'Unknown';
}

router.get('/revenue/excel', asyncHandler(async (req, res) => {
  const { start, end, now } = defaultRevenueRange(req);
  const payments = await Payment.find({ admin_id: req.admin.id, date: { $gte: start, $lte: end } }).sort({ date: -1 }).lean();

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
    const member = await Member.findOne({ _id: payment.member_id, admin_id: req.admin.id }).lean();
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
  sheet.addRow(['Index', 'First Name', 'Address', 'Plan', 'Start Date', 'Expiry Date', 'Status', 'Paid']);
  sheet.getRow(3).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  });

  let index = 1;
  for (const member of members) {
    const firstName = member.full_name ? member.full_name.trim().split(/\s+/)[0] : '';
    const status = member.expiry_date >= now ? 'Active' : 'Expired';
    sheet.addRow([
      index++,
      firstName,
      member.address || '',
      await planName(member.plan_id, req.admin.id),
      member.join_date ? member.join_date.toISOString().slice(0, 10) : '',
      member.expiry_date ? member.expiry_date.toISOString().slice(0, 10) : '',
      status,
      member.amount_paid || 0,
    ]);
  }
  sheet.columns.forEach((column) => { column.width = 22; });

  await sendWorkbook(res, workbook, `members_report_${now.toISOString().slice(0, 10)}.xlsx`);
}));

router.get('/revenue/pdf', asyncHandler(async (req, res) => {
  const { start, end, now } = defaultRevenueRange(req);
  const payments = await Payment.find({ admin_id: req.admin.id, date: { $gte: start, $lte: end } }).sort({ date: -1 }).lean();

  const buffer = await buildPdf(async (doc) => {
    doc.fontSize(22).fillColor('#6366F1').font('Helvetica-Bold').text('Revenue Report', { align: 'center' });
    doc.moveDown(0.2).fontSize(10).fillColor('#4B5563').font('Helvetica')
      .text(`Period: ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`, { align: 'center' });
    doc.moveDown(1.5);

    let y = 110;
    const colWidths = [90, 140, 110, 80, 80];
    const colX = [40, 130, 270, 380, 460];
    const headers = ['Date', 'Member Name', 'Plan', 'Amount (Rs)', 'Method'];

    const drawHeader = (doc, currentY) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
      doc.rect(40, currentY - 4, 500, 20).fill('#6366F1');
      doc.fillColor('#FFFFFF');
      headers.forEach((text, i) => {
        doc.text(text, colX[i], currentY, {
          width: colWidths[i] - 10,
          align: i === 3 ? 'right' : 'left',
        });
      });
      return currentY + 22;
    };

    y = drawHeader(doc, y);
    let total = 0;

    for (const payment of payments) {
      const member = await Member.findOne({ _id: payment.member_id, admin_id: req.admin.id }).lean();
      total += payment.amount;

      const rowData = [
        payment.date.toISOString().slice(0, 10),
        member?.full_name || 'Deleted Member',
        payment.plan_name || '',
        payment.amount.toLocaleString('en-IN'),
        payment.payment_method || 'cash',
      ];

      doc.font('Helvetica').fontSize(9);
      let maxCellHeight = 0;
      rowData.forEach((text, i) => {
        const cellHeight = doc.heightOfString(String(text), {
          width: colWidths[i] - 10,
          align: i === 3 ? 'right' : 'left',
        });
        if (cellHeight > maxCellHeight) {
          maxCellHeight = cellHeight;
        }
      });
      const rowHeight = maxCellHeight + 8;

      if (y + rowHeight > 750) {
        doc.addPage();
        y = 50;
        y = drawHeader(doc, y);
      }

      doc.font('Helvetica').fontSize(9).fillColor('#1F2937');
      rowData.forEach((text, i) => {
        doc.text(String(text), colX[i], y + 4, {
          width: colWidths[i] - 10,
          align: i === 3 ? 'right' : 'left',
        });
      });

      doc.moveTo(40, y + rowHeight)
         .lineTo(540, y + rowHeight)
         .strokeColor('#E5E7EB')
         .lineWidth(0.5)
         .stroke();

      y += rowHeight;
    }

    if (y > 730) {
      doc.addPage();
      y = 50;
    }
    y += 10;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111');
    doc.text(`Total Revenue: Rs ${total.toLocaleString('en-IN')}`, 40, y, { align: 'right', width: 500 });
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${now.toISOString().slice(0, 10)}.pdf`);
  res.send(buffer);
}));

router.get('/members/pdf', asyncHandler(async (req, res) => {
  const now = new Date();
  const members = await Member.find(membersQuery(req)).sort({ full_name: 1 }).lean();

  const buffer = await buildPdf(async (doc) => {
    doc.fontSize(22).fillColor('#10B981').font('Helvetica-Bold').text('Members Report', { align: 'center' });
    doc.moveDown(0.2).fontSize(10).fillColor('#4B5563').font('Helvetica')
      .text(`Generated: ${now.toISOString().slice(0, 16).replace('T', ' ')}`, { align: 'center' });
    doc.moveDown(1.5);

    let y = 110;
    const colWidths = [30, 70, 95, 65, 60, 60, 50, 70];
    const colX = [40, 70, 140, 235, 300, 360, 420, 470];
    const headers = ['Index', 'First Name', 'Address', 'Plan', 'Start Date', 'Expiry Date', 'Status', 'Paid'];

    const drawHeader = (doc, currentY) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
      doc.rect(40, currentY - 4, 500, 20).fill('#10B981');
      doc.fillColor('#FFFFFF');
      headers.forEach((text, i) => {
        doc.text(text, colX[i], currentY, {
          width: colWidths[i] - 10,
          align: i === 7 ? 'right' : 'left',
        });
      });
      return currentY + 22;
    };

    y = drawHeader(doc, y);

    let index = 1;
    for (const member of members) {
      const status = member.expiry_date >= now ? 'Active' : 'Expired';
      const plan = await planName(member.plan_id, req.admin.id);

      const firstName = member.full_name ? member.full_name.trim().split(/\s+/)[0] : '';
      const rowData = [
        index++,
        firstName,
        member.address || '',
        plan,
        member.join_date ? member.join_date.toISOString().slice(0, 10) : '',
        member.expiry_date ? member.expiry_date.toISOString().slice(0, 10) : '',
        status,
        (member.amount_paid || 0).toLocaleString('en-IN'),
      ];

      doc.font('Helvetica').fontSize(9);
      let maxCellHeight = 0;
      rowData.forEach((text, i) => {
        const cellHeight = doc.heightOfString(String(text), {
          width: colWidths[i] - 10,
          align: i === 7 ? 'right' : 'left',
        });
        if (cellHeight > maxCellHeight) {
          maxCellHeight = cellHeight;
        }
      });
      const rowHeight = maxCellHeight + 8;

      if (y + rowHeight > 750) {
        doc.addPage();
        y = 50;
        y = drawHeader(doc, y);
      }

      doc.font('Helvetica').fontSize(9).fillColor('#1F2937');
      rowData.forEach((text, i) => {
        doc.text(String(text), colX[i], y + 4, {
          width: colWidths[i] - 10,
          align: i === 7 ? 'right' : 'left',
        });
      });

      doc.moveTo(40, y + rowHeight)
         .lineTo(540, y + rowHeight)
         .strokeColor('#E5E7EB')
         .lineWidth(0.5)
         .stroke();

      y += rowHeight;
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=members_report_${now.toISOString().slice(0, 10)}.pdf`);
  res.send(buffer);
}));

module.exports = router;
