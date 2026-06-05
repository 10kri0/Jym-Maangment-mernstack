import { useState, useEffect } from 'react';
import api from '../utils/api';
import KPICard from '../components/KPICard';
import { HiOutlineTrendingUp, HiOutlineCash, HiOutlineChartBar, HiOutlineStar, HiOutlineCalendar } from 'react-icons/hi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-3 !rounded-xl">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-primary-500">₹{payload[0].value?.toLocaleString('en-IN')}</p>
        {payload[0].payload.transactions && <p className="text-xs text-gray-500">{payload[0].payload.transactions} transactions</p>}
      </div>
    );
  }
  return null;
};

export default function Revenue() {
  const [activeTab, setActiveTab] = useState('daily');
  const [chartData, setChartData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);

      try {
        const params = activeTab === 'monthly' ? { year } : {};
        const res = await api.get(`/revenue/${activeTab}`, { params });
        if (active) {
          setChartData(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [activeTab, year]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await api.get('/revenue/metrics');
        if (active) {
          setMetrics(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const tabs = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
  ];

  const getDataKey = () => {
    if (activeTab === 'daily') return 'date';
    if (activeTab === 'weekly') return 'week';
    if (activeTab === 'monthly') return 'month';
    return 'year';
  };

  const formatXAxis = (v) => {
    if (activeTab === 'daily') return v?.slice(5);
    if (activeTab === 'monthly') return v?.slice(5);
    return v;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Revenue Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track and analyze your gym revenue</p>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <KPICard title="Total Revenue" value={metrics.total_revenue} icon={HiOutlineCash} gradient="primary" prefix="₹" delay={50} />
          <KPICard title="Profit Estimation" value={metrics.profit_estimation} icon={HiOutlineTrendingUp} gradient="emerald" prefix="₹" delay={100} />
          <KPICard title="This Month" value={metrics.current_month_revenue} icon={HiOutlineCalendar} gradient="cyan" prefix="₹" trend={metrics.growth_percentage} trendLabel="vs last month" delay={150} />
          <KPICard title="Growth" value={Math.abs(metrics.growth_percentage)} icon={HiOutlineChartBar} gradient={metrics.growth_percentage >= 0 ? 'emerald' : 'rose'} suffix="%" delay={200} />
        </div>
      )}

      {/* Best Plan & Month */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"><HiOutlineStar className="w-7 h-7 text-white" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Best Performing Plan</p>
              <p className="text-lg font-bold">{metrics.best_plan.name}</p>
              <p className="text-sm text-emerald-500">₹{metrics.best_plan.revenue?.toLocaleString('en-IN')} • {metrics.best_plan.subscriptions} subs</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"><HiOutlineCalendar className="w-7 h-7 text-white" /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Most Profitable Month</p>
              <p className="text-lg font-bold">{metrics.best_month.month}</p>
              <p className="text-sm text-emerald-500">₹{metrics.best_month.revenue?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-xl p-1">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.key ? 'bg-white dark:bg-dark-500 shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>{tab.label}</button>
            ))}
          </div>
          {activeTab === 'monthly' && (
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input-field w-auto">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>

        <div className="h-80" style={{ minWidth: 0, minHeight: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
          ) : activeTab === 'yearly' ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey={getDataKey()} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs><linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <AreaChart data={chartData}>
                <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey={getDataKey()} tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={formatXAxis} />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Plan Revenue Breakdown */}
      {metrics?.plan_revenues?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">Revenue by Plan</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64" style={{ minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <PieChart>
                  <Pie data={metrics.plan_revenues} dataKey="revenue" nameKey="plan_name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                    {metrics.plan_revenues.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {metrics.plan_revenues.map((p, i) => (
                <div key={p.plan_name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="flex-1"><p className="font-medium">{p.plan_name}</p><p className="text-xs text-gray-500">{p.subscriptions} subscriptions</p></div>
                  <p className="font-bold">₹{p.revenue.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
