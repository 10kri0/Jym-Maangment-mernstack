import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineKey,
  HiOutlineMail,
  HiOutlineUser,
} from 'react-icons/hi';

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ password: '' });

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admins');
      setAdmins(res.data.admins);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await api.get('/admins');
        if (active) {
          setAdmins(res.data.admins);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load clients');
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

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admins', addForm);
      toast.success('Client admin created successfully!');
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create client admin');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admins/${showPasswordModal.id}/password`, passwordForm);
      toast.success('Client password updated successfully!');
      setShowPasswordModal(null);
      setPasswordForm({ password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update password');
    }
  };

  const handleDeleteAdmin = async (id) => {
    try {
      await api.delete(`/admins/${id}`);
      toast.success('Client admin and all associated gym data deleted!');
      setShowDeleteModal(null);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete client admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Client Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage gym administrator accounts for your clients
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" /> New Client Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No client administrators found. Click "New Client Admin" to get started.
          </div>
        ) : (
          admins.map((admin) => (
            <div key={admin._id || admin.id} className="glass-card p-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white text-lg font-bold">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{admin.name}</h3>
                    <span className="badge badge-success text-[10px] uppercase tracking-wider">
                      Client
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <HiOutlineMail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{admin.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Created: {new Date(admin.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <button
                  onClick={() => setShowPasswordModal({ id: admin._id || admin.id, name: admin.name })}
                  className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-1"
                >
                  <HiOutlineKey className="w-4 h-4" /> Reset Pass
                </button>
                <button
                  onClick={() => setShowDeleteModal({ id: admin._id || admin.id, name: admin.name })}
                  className="btn-secondary py-2 px-3 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Client Admin Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Client Admin"
      >
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="input-field pl-10"
                placeholder="Client Name"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address *</label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="input-field pl-10"
                placeholder="client@gym.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <div className="relative">
              <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="input-field pl-10"
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Create Client
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={!!showPasswordModal}
        onClose={() => setShowPasswordModal(null)}
        title={`Change Password for ${showPasswordModal?.name || ''}`}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Password *</label>
            <div className="relative">
              <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                className="input-field pl-10"
                placeholder="New Password"
                minLength={6}
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Update Password
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title="Delete Client Admin"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete client admin <strong className="text-gray-800 dark:text-gray-200">{showDeleteModal?.name}</strong>?
          </p>
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4 text-rose-600 dark:text-rose-400 text-sm">
            <strong>Warning:</strong> This action will permanently delete this client admin account and <strong>ALL</strong> of their gym data (members, plans, and payments). This cannot be undone.
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleDeleteAdmin(showDeleteModal.id)}
              className="btn-danger flex-1"
            >
              Permanently Delete
            </button>
            <button
              onClick={() => setShowDeleteModal(null)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
