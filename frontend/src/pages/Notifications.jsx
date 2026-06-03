import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineBell, HiOutlineClock, HiOutlineExclamationCircle, HiOutlineCash, HiOutlinePhone, HiOutlineRefresh } from 'react-icons/hi';

export default function Notifications() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expiring');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try { const res = await api.get('/notifications'); setData(res.data); }
    catch (err) { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center py-12 text-gray-500">Failed to load notifications</div>;

  const tabs = [
    { key: 'expiring', label: 'Expiring Soon', count: data.expiring.length, icon: HiOutlineClock, color: 'amber' },
    { key: 'expired', label: 'Expired', count: data.expired.length, icon: HiOutlineExclamationCircle, color: 'rose' },
    { key: 'payments', label: 'Pending Payments', count: data.pending_payments.length, icon: HiOutlineCash, color: 'primary' },
  ];

  const currentList = activeTab === 'expiring' ? data.expiring : activeTab === 'expired' ? data.expired : data.pending_payments;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{data.total_alerts} total alerts</p>
        </div>
        <button onClick={() => { setLoading(true); fetchNotifications(); }} className="btn-secondary flex items-center gap-2">
          <HiOutlineRefresh className="w-5 h-5" /> Refresh
        </button>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`glass-card p-5 text-left transition-all duration-200 ${activeTab === tab.key ? `ring-2 ring-${tab.color === 'primary' ? 'primary' : tab.color}-500` : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tab.color === 'amber' ? 'from-amber-400 to-amber-600' : tab.color === 'rose' ? 'from-rose-400 to-rose-600' : 'from-primary-400 to-primary-600'} flex items-center justify-center`}>
                <tab.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tab.count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{tab.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-bold">{tabs.find(t => t.key === activeTab)?.label}</h3>
        </div>

        {currentList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <HiOutlineBell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No alerts</p>
            <p className="text-sm">Everything looks good!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {currentList.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      item.type === 'expiring' ? 'bg-amber-500' : item.type === 'expired' ? 'bg-rose-500' : 'bg-primary-500'
                    }`}>
                      {item.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{item.full_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.plan_name}
                        {item.days_left !== undefined && ` • ${item.days_left} days left`}
                        {item.days_expired !== undefined && ` • Expired ${item.days_expired} days ago`}
                        {item.payment_status && ` • ${item.payment_status}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${item.mobile}`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-500 transition-colors" title="Call">
                      <HiOutlinePhone className="w-5 h-5" />
                    </a>
                    {(item.type === 'expiring' || item.type === 'expired') && (
                      <span className={`badge ${item.type === 'expiring' ? 'badge-warning' : 'badge-danger'}`}>
                        {item.type === 'expiring' ? `${item.days_left}d left` : 'Expired'}
                      </span>
                    )}
                    {item.type === 'payment' && (
                      <span className="badge badge-warning">{item.payment_status}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
