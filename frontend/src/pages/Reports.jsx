import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineDocumentDownload, HiOutlineDocumentText, HiOutlineTable, HiOutlineCalendar } from 'react-icons/hi';

export default function Reports() {
  const [loading, setLoading] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const downloadReport = async (type, format) => {
    const key = `${type}_${format}`;
    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const params = {};
      if (type === 'revenue') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      } else {
        if (statusFilter) params.status_filter = statusFilter;
      }
      const res = await api.get(`/reports/${type}/${format}`, { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} ${format.toUpperCase()} report downloaded!`);
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const reportCards = [
    {
      title: 'Revenue Report',
      description: 'Generate detailed revenue reports with payment breakdown',
      icon: HiOutlineDocumentText,
      gradient: 'from-primary-500 to-indigo-600',
      type: 'revenue',
    },
    {
      title: 'Members Report',
      description: 'Generate membership reports with status and plan details',
      icon: HiOutlineTable,
      gradient: 'from-emerald-500 to-teal-600',
      type: 'members',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Generate and download reports</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <HiOutlineCalendar className="w-5 h-5 text-primary-500" /> Report Filters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Member Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
              <option value="">All Members</option>
              <option value="active">Active Only</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportCards.map((card) => (
          <div key={card.type} className="glass-card overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{card.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => downloadReport(card.type, 'pdf')}
                  disabled={loading[`${card.type}_pdf`]}
                  className="btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {loading[`${card.type}_pdf`] ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><HiOutlineDocumentDownload className="w-5 h-5" /> PDF</>
                  )}
                </button>
                <button
                  onClick={() => downloadReport(card.type, 'excel')}
                  disabled={loading[`${card.type}_excel`]}
                  className="btn-success flex items-center justify-center gap-2 py-3"
                >
                  {loading[`${card.type}_excel`] ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><HiOutlineDocumentDownload className="w-5 h-5" /> Excel</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
