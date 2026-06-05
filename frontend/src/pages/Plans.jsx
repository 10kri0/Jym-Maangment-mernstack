import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineClock, HiOutlineCurrencyRupee, HiOutlineUserGroup } from 'react-icons/hi';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', duration_months: 1, price: 0, description: '', is_active: true });

  const fetchPlans = async () => {
    try { const res = await api.get('/plans'); setPlans(res.data.plans); }
    catch (err) {
      console.error(err);
      toast.error('Failed to load plans');
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await api.get('/plans');
        if (active) {
          setPlans(res.data.plans);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load plans');
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

  const openAdd = () => {
    setEditPlan(null);
    setFormData({ name: '', duration_months: 1, price: 0, description: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditPlan(p);
    setFormData({ name: p.name, duration_months: p.duration_months, price: p.price, description: p.description || '', is_active: p.is_active });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, price: parseFloat(formData.price), duration_months: parseInt(formData.duration_months) };
      if (editPlan) { await api.put(`/plans/${editPlan.id}`, data); toast.success('Plan updated!'); }
      else { await api.post('/plans', data); toast.success('Plan created!'); }
      setShowModal(false); fetchPlans();
    } catch (err) { toast.error(err.response?.data?.detail || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/plans/${id}`); toast.success('Plan deleted!'); setShowDelete(null); fetchPlans(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Cannot delete plan'); }
  };

  const gradients = ['from-primary-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-blue-600', 'from-purple-500 to-violet-600'];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Membership Plans</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage membership plans</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {plans.map((plan, idx) => (
          <div key={plan.id} className="glass-card overflow-hidden group">
            <div className={`h-2 bg-gradient-to-r ${gradients[idx % gradients.length]}`} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description || 'No description'}</p>
                </div>
                {!plan.is_active && <span className="badge badge-warning">Inactive</span>}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center`}>
                    <HiOutlineCurrencyRupee className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{plan.price.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">Price</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-600 flex items-center justify-center">
                    <HiOutlineClock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}</p>
                    <p className="text-xs text-gray-500">Duration</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-600 flex items-center justify-center">
                    <HiOutlineUserGroup className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{plan.member_count}</p>
                    <p className="text-xs text-gray-500">Active Members</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(plan)} className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-1">
                  <HiOutlinePencil className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => setShowDelete(plan.id)} className="btn-secondary py-2 px-3 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editPlan ? 'Edit Plan' : 'Create Plan'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Plan Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Duration (months) *</label><input type="number" value={formData.duration_months} onChange={(e) => setFormData({...formData, duration_months: e.target.value})} className="input-field" min="1" max="24" required /></div>
            <div><label className="block text-sm font-medium mb-1">Price (₹) *</label><input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="input-field" min="0" required /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field" rows={3} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
            <label htmlFor="is_active" className="text-sm font-medium">Active Plan</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editPlan ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Plan">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure? Plans with active members cannot be deleted.</p>
        <div className="flex gap-3">
          <button onClick={() => handleDelete(showDelete)} className="btn-danger flex-1">Delete</button>
          <button onClick={() => setShowDelete(null)} className="btn-secondary flex-1">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
