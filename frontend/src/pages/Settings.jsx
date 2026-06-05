import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineKey, HiOutlineLockClosed } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { adminName, adminEmail, adminRole } = useAuth();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      return toast.error('New password and confirm password do not match');
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
      toast.success('Password updated successfully!');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account security and profile information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">Profile Information</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Name</span>
              <span className="col-span-2 font-semibold">{adminName}</span>
            </div>
            <div className="grid grid-cols-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="col-span-2 font-semibold">{adminEmail}</span>
            </div>
            <div className="grid grid-cols-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Role</span>
              <span className="col-span-2 font-semibold uppercase text-xs">
                <span className={`badge ${adminRole === 'superadmin' ? 'badge-primary' : 'badge-success'}`}>
                  {adminRole === 'superadmin' ? 'Super Admin' : 'Client Admin'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">Change Password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password *</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">New Password *</label>
              <div className="relative">
                <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Enter new password (min. 6 chars)"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password *</label>
              <div className="relative">
                <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full sm:w-auto"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
