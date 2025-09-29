import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/supabase';
import { stripeService, formatPrice } from '../services/stripe';
import { authService } from '../services/auth';

const BillingDashboard = ({ user, onUpdate }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (user?.profile) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      if (user.profile.subscription_id) {
        const result = await stripeService.getSubscriptionDetails(user.profile.subscription_id);
        if (result.success) {
          setSubscription(result.subscription);
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.id) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You\'ll continue to have access until the end of your current billing period.'
    );
    
    if (!confirmed) return;

    setActionLoading(prev => ({ ...prev, cancel: true }));

    try {
      const result = await stripeService.cancelSubscription(subscription.id);
      
      if (result.success) {
        await authService.updateSubscription(user.id, {
          ...user.profile,
          subscription_status: 'cancelled'
        });
        
        alert('Subscription cancelled successfully. You\'ll continue to have access until the end of your billing period.');
        onUpdate && onUpdate();
        loadSubscriptionData();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Error cancelling subscription. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, cancel: false }));
    }
  };

  const handleManageBilling = async () => {
    if (!user.profile.customer_id) return;

    setActionLoading(prev => ({ ...prev, portal: true }));

    try {
      const result = await stripeService.getCustomerPortalUrl(
        user.profile.customer_id,
        window.location.href
      );
      
      if (result.success) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Error opening billing portal. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, portal: false }));
    }
  };

  const currentTier = APP_CONFIG.subscriptionTiers[user?.profile?.subscription_tier] || APP_CONFIG.subscriptionTiers.free;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xl font-bold text-gray-900">{currentTier.name}</h4>
            <p className="text-gray-600">
              {formatPrice(currentTier.price)}
              {currentTier.type === 'subscription' && (
                <span>/{currentTier.interval === 'year' ? 'year' : 'month'}</span>
              )}
              {currentTier.type === 'one_time' && <span> per report</span>}
            </p>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              user?.profile?.subscription_status === 'active' 
                ? 'bg-green-100 text-green-800'
                : user?.profile?.subscription_status === 'cancelled'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user?.profile?.subscription_status || 'Free'}
            </div>
          </div>
        </div>

        {/* Report Usage */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Report Usage</span>
            <span className="text-sm text-gray-500">
              {user?.profile?.reports_used || 0} / {
                currentTier.reportsPerMonth === -1 ? 'Unlimited' : (user?.profile?.reports_limit || 0)
              }
            </span>
          </div>
          
          {currentTier.reportsPerMonth !== -1 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((user?.profile?.reports_used || 0) / Math.max(1, user?.profile?.reports_limit || 1)) * 100)}%`
                }}
              ></div>
            </div>
          )}
        </div>

        {/* Subscription Details */}
        {subscription && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-3">Subscription Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current Period:</span>
                <p className="font-medium">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Next Billing:</span>
                <p className="font-medium">
                  {subscription.cancelAtPeriodEnd 
                    ? 'Cancelled (access until period end)'
                    : new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={() => window.location.href = '/pricing'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {currentTier.id === 'free' ? 'Upgrade Plan' : 'Change Plan'}
          </button>
          
          {user?.profile?.customer_id && (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading.portal}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {actionLoading.portal ? 'Loading...' : 'Manage Billing'}
            </button>
          )}
          
          {subscription && !subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleCancelSubscription}
              disabled={actionLoading.cancel}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              {actionLoading.cancel ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {user?.profile?.reports_used || 0}
            </div>
            <div className="text-sm text-gray-500">Reports Generated</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {currentTier.reportsPerMonth === -1 
                ? '∞' 
                : Math.max(0, (user?.profile?.reports_limit || 0) - (user?.profile?.reports_used || 0))
              }
            </div>
            <div className="text-sm text-gray-500">Reports Remaining</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {user?.profile?.properties_count || 0}
            </div>
            <div className="text-sm text-gray-500">Properties Tracked</div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        <div className="space-y-3">
          {/* Mock billing history - replace with real data */}
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Subscription Renewal</p>
              <p className="text-sm text-gray-500">
                {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{formatPrice(currentTier.price)}</p>
              <p className="text-sm text-green-600">Paid</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Report Generated</p>
              <p className="text-sm text-gray-500">
                {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">1 Credit Used</p>
              <p className="text-sm text-blue-600">Completed</p>
            </div>
          </div>
          
          <div className="text-center py-4">
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
