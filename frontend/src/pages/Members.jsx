import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
  HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineRefresh,
} from 'react-icons/hi';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '', mobile: '', email: '', address: '', branch: '', plan_id: '',
    join_date: '', expiry_date: '', payment_status: 'pending', amount_paid: 0, notes: ''
  });

  const getExpiryDate = (joinDate, durationMonths) => {
    if (!joinDate || !durationMonths) return '';
    const date = new Date(joinDate);
    if (Number.isNaN(date.getTime())) return '';
    date.setMonth(date.getMonth() + Number(durationMonths));
    return date.toISOString().split('T')[0];
  };

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status_filter = statusFilter;
      if (paymentFilter) params.payment_status = paymentFilter;
      const res = await api.get('/members', { params });
      setMembers(res.data.members);
      setTotalPages(res.data.pages);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paymentFilter]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data.plans);
    } catch {
      console.error('Failed to load plans');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMembers();
    fetchPlans();
  }, [fetchMembers, fetchPlans]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchMembers(); };

  const openAddModal = () => {
    setEditMember(null);
    const today = new Date().toISOString().split('T')[0];
    const defaultPlan = plans[0];
    setFormData({
      full_name: '',
      mobile: '',
      email: '',
      address: '',
      branch: '',
      plan_id: defaultPlan?.id || '',
      join_date: today,
      expiry_date: getExpiryDate(today, defaultPlan?.duration_months),
      payment_status: 'pending',
      amount_paid: defaultPlan?.price || 0,
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (m) => {
    setEditMember(m);
    setFormData({ full_name: m.full_name, mobile: m.mobile, email: m.email || '', address: m.address || '', branch: m.branch || '', plan_id: m.plan_id, join_date: m.join_date.split('T')[0], expiry_date: m.expiry_date.split('T')[0], payment_status: m.payment_status, amount_paid: m.amount_paid, notes: m.notes || '' });
    setShowModal(true);
  };

  const handlePlanChange = (planId) => {
    setFormData((prev) => {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        return {
          ...prev,
          plan_id: planId,
          expiry_date: getExpiryDate(prev.join_date, plan.duration_months),
          amount_paid: plan.price,
        };
      }
      return { ...prev, plan_id: planId };
    });
  };

  const handleJoinDateChange = (joinDate) => {
    setFormData((prev) => {
      const plan = plans.find((p) => p.id === prev.plan_id);
      return {
        ...prev,
        join_date: joinDate,
        expiry_date: plan ? getExpiryDate(joinDate, plan.duration_months) : prev.expiry_date,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        join_date: new Date(formData.join_date).toISOString(),
        expiry_date: new Date(formData.expiry_date || formData.join_date).toISOString(),
        amount_paid: parseFloat(formData.amount_paid) || 0,
      };
      if (editMember) { await api.put(`/members/${editMember.id}`, data); toast.success('Member updated!'); }
      else { await api.post('/members', data); toast.success('Member added!'); }
      setShowModal(false); fetchMembers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/members/${id}`); toast.success('Member deleted!'); setShowDeleteConfirm(null); fetchMembers(); }
    catch { toast.error('Failed to delete member'); }
  };

  const handleRenew = async (memberId) => {
    try {
      const plan = plans[0]; if (!plan) return toast.error('No plans available');
      await api.post(`/members/${memberId}/renew?plan_id=${plan.id}`);
      toast.success('Membership renewed!'); fetchMembers();
    } catch { toast.error('Renewal failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Members</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your gym members</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" /> Add Member
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, mobile, or email..." className="input-field pl-10" />
            </div>
            <button type="submit" className="btn-primary px-4">Search</button>
          </form>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
              <option value="">All Status</option><option value="active">Active</option><option value="expired">Expired</option>
            </select>
            <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="input-field w-auto">
              <option value="">All Payments</option><option value="completed">Completed</option><option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><HiOutlineSearch className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="text-lg font-medium">No members found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Mobile</th><th>Branch</th><th>Plan</th><th>Expiry</th><th>Payment</th><th>Actions</th></tr></thead>
              <tbody>
                {members.map((m) => {
                  const isExpired = new Date(m.expiry_date) < new Date();
                  return (
                    <tr key={m.id}>
                      <td><div><p className="font-semibold">{m.full_name}</p>{m.email && <p className="text-xs text-gray-500">{m.email}</p>}</div></td>
                      <td><div><p>{m.mobile}</p>{m.address && <p className="text-xs text-gray-500">{m.address}</p>}</div></td>
                      <td>{m.branch ? <span className="badge badge-info">{m.branch}</span> : <span className="text-gray-400 text-sm">-</span>}</td>
                      <td><span className="badge badge-info">{m.plan_name}</span></td>
                      <td><span className={isExpired ? 'text-rose-500 font-medium' : ''}>{new Date(m.expiry_date).toLocaleDateString('en-IN')}</span></td>
                      <td>{m.payment_status === 'completed' ? <span className="badge badge-success">Completed</span> : <span className="badge badge-warning">Pending</span>}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(m)} className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 transition-colors" title="Edit"><HiOutlinePencil className="w-4 h-4" /></button>
                          <button onClick={() => setShowDeleteConfirm(m.id)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors" title="Delete"><HiOutlineTrash className="w-4 h-4" /></button>
                          {isExpired && <button onClick={() => handleRenew(m.id)} className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 transition-colors" title="Renew"><HiOutlineRefresh className="w-4 h-4" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary px-3 py-2 text-sm disabled:opacity-50"><HiOutlineChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="btn-secondary px-3 py-2 text-sm disabled:opacity-50"><HiOutlineChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMember ? 'Edit Member' : 'Add New Member'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Full Name *</label><input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="input-field" required /></div>
            <div><label className="block text-sm font-medium mb-1">Mobile *</label><input type="tel" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} className="input-field" required /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Address</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="input-field" rows={2} placeholder="Enter member address" /></div>
          <div><label className="block text-sm font-medium mb-1">Branch</label>
            <select value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})} className="input-field">
              <option value="">Select branch</option>
              <option value="Eru">Eru</option>
              <option value="Motobajr">Motobajr</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Plan *</label>
            <select value={formData.plan_id} onChange={(e) => handlePlanChange(e.target.value)} className="input-field" required>
              <option value="">Select a plan</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - ₹{p.price} ({p.duration_months}mo)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Join Date *</label><input type="date" value={formData.join_date} onChange={(e) => handleJoinDateChange(e.target.value)} className="input-field" required /></div>
            <div><label className="block text-sm font-medium mb-1">Expiry Date *</label><input type="date" value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} className="input-field" required /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Payment Status</label>
              <select value={formData.payment_status} onChange={(e) => setFormData({...formData, payment_status: e.target.value})} className="input-field">
                <option value="pending">Pending</option><option value="completed">Completed</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Amount (₹)</label><input type="number" value={formData.amount_paid} onChange={(e) => setFormData({...formData, amount_paid: e.target.value})} className="input-field" min="0" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input-field" rows={2} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editMember ? 'Update' : 'Add Member'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Confirm Delete">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => handleDelete(showDeleteConfirm)} className="btn-danger flex-1">Delete</button>
          <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
