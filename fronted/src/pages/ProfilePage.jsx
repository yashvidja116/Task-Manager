import React, { useState } from 'react';
import { userAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserIcon, LockIcon, SaveIcon, EyeIcon, EyeOffIcon } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await userAPI.update(user._id, profileForm);
      updateUser(res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleShow = (field) => setShowPasswords((p) => ({ ...p, [field]: !p[field] }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account details</p>
      </div>

      {/* Avatar / identity */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl flex items-center justify-center font-bold flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className={`badge mt-1 capitalize ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Profile info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <UserIcon className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input bg-gray-50" value={user?.email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label">Avatar URL</label>
            <input
              className="input"
              value={profileForm.avatar}
              onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              type="url"
            />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            <SaveIcon className="w-4 h-4" />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <LockIcon className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {[
            { key: 'current', label: 'Current Password', field: 'currentPassword' },
            { key: 'new', label: 'New Password', field: 'newPassword' },
            { key: 'confirm', label: 'Confirm New Password', field: 'confirmPassword' },
          ].map(({ key, label, field }) => (
            <div key={field}>
              <label className="label">{label}</label>
              <div className="relative">
                <input
                  type={showPasswords[key] ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={passwordForm[field]}
                  onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                  required
                />
                <button type="button" onClick={() => toggleShow(key)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPasswords[key] ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
            <p className="text-xs text-yellow-700">Password must be at least 6 characters. After changing, you&apos;ll remain logged in.</p>
          </div>

          <button type="submit" disabled={savingPassword} className="btn-primary">
            <LockIcon className="w-4 h-4" />
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Account ID</span>
            <span className="font-mono text-xs text-gray-400">{user?._id}</span>
          </div>
          <div className="flex justify-between">
            <span>Role</span>
            <span className="capitalize font-medium">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
