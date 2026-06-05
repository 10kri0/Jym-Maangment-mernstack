import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import KPICard from '../components/KPICard';
import {
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineExclamationCircle,
  HiOutlineCash,
  HiOutlineCalendar,
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineChartBar,
} from 'react-icons/hi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3 !rounded-xl">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-primary-500">₹{payload[0].value?.toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dailyRevenue, setDailyRevenue] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [statsRes, revenueRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/revenue/daily', { params: { days: 30 } }),
        ]);

        if (active) {
          setStats(statsRes.data);
          setDailyRevenue(revenueRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data.</p>
        <button onClick={fetchStats} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening at your gym.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <KPICard
          title="Total Members"
          value={stats.total_members}
          icon={HiOutlineUsers}
          gradient="primary"
          delay={50}
        />
        <KPICard
          title="Active Members"
          value={stats.active_members}
          icon={HiOutlineUserGroup}
          gradient="emerald"
          delay={100}
        />
        <KPICard
          title="Expired Members"
          value={stats.expired_members}
          icon={HiOutlineExclamationCircle}
          gradient="rose"
          delay={150}
        />
        <KPICard
          title="Pending Payments"
          value={stats.pending_payments}
          icon={HiOutlineClock}
          gradient="amber"
          delay={200}
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <KPICard
          title="Today's Revenue"
          value={stats.today_revenue}
          icon={HiOutlineCash}
          gradient="cyan"
          prefix="₹"
          delay={250}
        />
        <KPICard
          title="Monthly Revenue"
          value={stats.monthly_revenue}
          icon={HiOutlineTrendingUp}
          gradient="indigo"
          prefix="₹"
          delay={300}
        />
        <KPICard
          title="Annual Revenue"
          value={stats.annual_revenue}
          icon={HiOutlineCalendar}
          gradient="purple"
          prefix="₹"
          delay={350}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold mb-4">Revenue Trend (Last 30 Days)</h3>
          <div className="h-72" style={{ minWidth: 0, minHeight: 0 }}>
            {dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <AreaChart data={dailyRevenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => v?.slice(5)}
                    stroke="#94a3b8"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <HiOutlineChartBar className="w-12 h-12 mb-2 opacity-50" />
                <p className="font-medium">No revenue data yet</p>
                <p className="text-sm">Revenue will appear as payments are recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">Plan Distribution</h3>
          <div className="h-72" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <PieChart>
                <Pie
                  data={stats.plan_distribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.plan_distribution.map((entry, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
                <Tooltip
                  formatter={(value, name) => [`${value} members`, name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Members Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
          <h3 className="text-lg font-bold">Recent Members</h3>
          <Link to="/members" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Plan</th>
                <th>Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_members.map((member) => {
                const isExpired = new Date(member.expiry_date) < new Date();
                return (
                  <tr key={member.id}>
                    <td className="font-medium">{member.full_name}</td>
                    <td>{member.mobile}</td>
                    <td><span className="badge badge-info">{member.plan_name}</span></td>
                    <td className="text-sm">{new Date(member.expiry_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      {isExpired ? (
                        <span className="badge badge-danger">Expired</span>
                      ) : member.payment_status === 'completed' ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-warning">{member.payment_status}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
