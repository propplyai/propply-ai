import React, { useState, useEffect } from 'react';
import { supabase, APP_CONFIG } from '../config/supabase';
import { authService } from '../services/auth';
import {
  User, Mail, Phone, Building, Calendar, Award, CreditCard,
  Save, Edit2, CheckCircle, AlertCircle, Briefcase, MapPin
} from 'lucide-react';

const UserProfile = ({ user, onProfileUpdate }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    address: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, [user.id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const result = await authService.getUserProfile(user.id);
      
      if (result.success && result.data) {
        setUserProfile(result.data);
        setFormData({
          full_name: result.data.full_name || '',
          email: result.data.email || user.email || '',
          phone: result.data.phone || '',
          company: result.data.company || '',
          job_title: result.data.job_title || '',
          address: result.data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await authService.updateUserProfile(user.id, formData);
      
      if (result.success) {
        setUserProfile(result.data[0]);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Notify parent component if callback provided
        if (onProfileUpdate) {
          onProfileUpdate(result.data[0]);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: userProfile?.full_name || '',
      email: userProfile?.email || user.email || '',
      phone: userProfile?.phone || '',
      company: userProfile?.company || '',
      job_title: userProfile?.job_title || '',
      address: userProfile?.address || ''
    });
    setMessage({ type: '', text: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const subscriptionTier = userProfile?.subscription_tier || 'free';
  const tierInfo = APP_CONFIG.subscriptionTiers[subscriptionTier] || APP_CONFIG.subscriptionTiers.free;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-6 lg:mb-0">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
              My Profile
            </h2>
            <p className="text-gray-600 text-lg">Manage your account information and preferences</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <Edit2 className="h-5 w-5" />
              <span className="font-medium">Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-2xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Quick Stats */}
        <div className="space-y-6">
          {/* Avatar Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
                <div className="relative h-32 w-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt="Profile" 
                      className="h-28 w-28 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-white" />
                  )}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {userProfile?.full_name || 'User'}
              </h3>
              <p className="text-gray-600 mb-4">{userProfile?.email || user.email}</p>
              <div className="w-full pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(userProfile?.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <div className="relative">
              <div className="flex items-center space-x-2 mb-4">
                <Award className="h-5 w-5" />
                <span className="text-sm font-semibold">Current Plan</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">{tierInfo.name}</h3>
              <p className="text-gray-300 text-sm mb-4">
                {tierInfo.price === 0 ? 'Free Plan' : `$${tierInfo.price}/${tierInfo.interval}`}
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Reports Used</span>
                  <span className="font-semibold">
                    {userProfile?.reports_used || 0}
                    {userProfile?.reports_limit === -1 ? ' / ∞' : ` / ${userProfile?.reports_limit || 0}`}
                  </span>
                </div>
                {userProfile?.reports_limit > 0 && userProfile?.reports_limit !== -1 && (
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((userProfile.reports_used / userProfile.reports_limit) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Upgrade Plan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h3>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-2xl border transition-all duration-300 ${
                        isEditing 
                          ? 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={true}
                      className="w-full px-4 py-3 rounded-2xl border bg-gray-50 border-gray-200 cursor-not-allowed transition-all duration-300"
                      placeholder="john@example.com"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed here</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Phone</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-2xl border transition-all duration-300 ${
                        isEditing 
                          ? 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Company */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Company</span>
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-2xl border transition-all duration-300 ${
                        isEditing 
                          ? 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                      placeholder="ABC Property Management"
                    />
                  </div>

                  {/* Job Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Briefcase className="h-4 w-4" />
                      <span>Job Title</span>
                    </label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-2xl border transition-all duration-300 ${
                        isEditing 
                          ? 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      }`}
                      placeholder="Property Manager"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Address</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 rounded-2xl border transition-all duration-300 ${
                      isEditing 
                        ? 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                        : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                    }`}
                    placeholder="123 Main St, New York, NY 10001"
                  />
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Account Details Section */}
            <div className="p-8 border-t border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Account Created</p>
                    <p className="font-medium text-gray-900">{formatDate(userProfile?.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Last Login</p>
                    <p className="font-medium text-gray-900">{formatDate(userProfile?.last_login)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Subscription Status</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {userProfile?.subscription_status || 'Active'}
                    </p>
                  </div>
                </div>
                {userProfile?.current_period_end && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Renewal Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(userProfile.current_period_end)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
