import React, { useState } from 'react';
import { APP_CONFIG } from '../config/supabase';
import { stripeService, formatPrice } from '../services/stripe';
import { authService } from '../services/auth';

const PricingSection = ({ user, onUpgrade }) => {
  const [loading, setLoading] = useState({});
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleSubscribe = async (tierId) => {
    if (!user) {
      // Redirect to sign up
      window.location.href = '/signup';
      return;
    }

    setLoading(prev => ({ ...prev, [tierId]: true }));

    try {
      const tier = APP_CONFIG.subscriptionTiers[tierId];
      
      if (tier.type === 'one_time') {
        // Handle one-time payment
        const result = await stripeService.createCheckoutSession(
          tierId,
          user.id,
          user.email
        );
        
        if (result.success) {
          // In production, redirect to Stripe Checkout
          console.log('Redirecting to checkout:', result.url);
          alert(`Mock: Redirecting to Stripe Checkout for ${tier.name} - $${tier.price}`);
          
          // Simulate successful payment
          setTimeout(async () => {
            await authService.updateSubscription(user.id, {
              tierId,
              status: 'active',
              reportsLimit: tier.reportsPerMonth
            });
            onUpgrade && onUpgrade(tier);
          }, 2000);
        }
      } else if (tier.type === 'subscription') {
        // Handle subscription
        const result = await stripeService.createSubscription(
          tierId,
          user.id,
          user.email
        );
        
        if (result.success) {
          await authService.updateSubscription(user.id, {
            tierId,
            status: 'active',
            subscriptionId: result.subscriptionId,
            customerId: result.customerId,
            currentPeriodStart: result.currentPeriodStart,
            currentPeriodEnd: result.currentPeriodEnd,
            reportsLimit: tier.reportsPerMonth
          });
          
          onUpgrade && onUpgrade(tier);
          alert(`Successfully subscribed to ${tier.name}!`);
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error processing subscription. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [tierId]: false }));
    }
  };

  const PricingCard = ({ tier, isPopular = false }) => {
    const isCurrentPlan = user?.profile?.subscription_tier === tier.id;
    const isLoading = loading[tier.id];

    return (
      <div className={`relative bg-white rounded-2xl border-2 p-8 ${
        isPopular 
          ? 'border-blue-500 transform scale-105 shadow-2xl' 
          : 'border-gray-200 shadow-lg'
      } transition-all duration-300 hover:shadow-xl hover:border-blue-300`}>
        
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </span>
          </div>
        )}

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
          <div className="flex items-center justify-center mb-2">
            <span className="text-4xl font-bold text-gray-900">
              {formatPrice(tier.price)}
            </span>
            {tier.type === 'subscription' && (
              <span className="text-gray-500 ml-2">
                /{tier.interval === 'year' ? 'year' : 'month'}
              </span>
            )}
            {tier.type === 'one_time' && (
              <span className="text-gray-500 ml-2">one-time</span>
            )}
          </div>
          
          {tier.id === 'enterprise_yearly' && (
            <div className="text-green-600 font-semibold text-sm">
              Save 17% annually
            </div>
          )}
          
          <p className="text-gray-600 text-sm mt-2">
            {tier.type === 'free' && 'Forever free'}
            {tier.type === 'one_time' && 'Single report purchase'}
            {tier.type === 'subscription' && tier.interval === 'month' && 'Billed monthly'}
            {tier.type === 'subscription' && tier.interval === 'year' && 'Billed annually'}
          </p>
        </div>

        <div className="mb-8">
          <div className="text-center mb-4">
            <span className="text-2xl font-bold text-blue-600">
              {tier.reportsPerMonth === -1 ? 'Unlimited' : tier.reportsPerMonth}
            </span>
            <span className="text-gray-500 ml-1">
              {tier.reportsPerMonth === 0 ? 'reports' : 'reports/month'}
            </span>
          </div>
          
          <ul className="space-y-3">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => handleSubscribe(tier.id)}
          disabled={isLoading || isCurrentPlan || tier.id === 'free'}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
            isCurrentPlan
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : tier.id === 'free'
              ? 'bg-gray-100 text-gray-700 cursor-default'
              : isPopular
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
              Processing...
            </div>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : tier.id === 'free' ? (
            'Get Started Free'
          ) : tier.type === 'one_time' ? (
            'Order Report'
          ) : (
            'Start Free Trial'
          )}
        </button>

        {tier.type === 'subscription' && !isCurrentPlan && tier.id !== 'free' && (
          <p className="text-xs text-gray-500 text-center mt-2">
            14-day free trial • Cancel anytime
          </p>
        )}
      </div>
    );
  };

  const tiers = Object.values(APP_CONFIG.subscriptionTiers);

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From single reports to comprehensive compliance management, 
            we have a plan that fits your needs.
          </p>
          
          {user?.profile && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg inline-block">
              <p className="text-blue-800">
                Current Plan: <span className="font-semibold">
                  {APP_CONFIG.subscriptionTiers[user.profile.subscription_tier]?.name || 'Free'}
                </span>
              </p>
              {user.profile.reports_used !== undefined && (
                <p className="text-blue-600 text-sm">
                  Reports Used: {user.profile.reports_used} / {
                    user.profile.reports_limit === -1 ? 'Unlimited' : user.profile.reports_limit
                  }
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              isPopular={tier.popular}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Need a custom solution? We're here to help.
          </p>
          <button className="bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
            Contact Sales
          </button>
        </div>

        <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What's included in a compliance report?
              </h4>
              <p className="text-gray-600">
                Each report includes AI-powered analysis of violations, cost estimates, 
                vendor recommendations, and actionable compliance steps.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I upgrade or downgrade anytime?
              </h4>
              <p className="text-gray-600">
                Yes! You can change your plan at any time. Upgrades take effect immediately, 
                and downgrades take effect at the next billing cycle.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h4>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee for subscription plans. 
                One-time reports are non-refundable once generated.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What cities do you support?
              </h4>
              <p className="text-gray-600">
                Currently we support NYC and Philadelphia, with more cities 
                coming soon based on customer demand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
