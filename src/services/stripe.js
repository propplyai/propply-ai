// Stripe integration for Propply AI MVP
import { loadStripe } from '@stripe/stripe-js';
import { APP_CONFIG } from '../config/supabase';

// Initialize Stripe
let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(APP_CONFIG.stripe.publishableKey);
  }
  return stripePromise;
};

export const STRIPE_CONFIG = {
  publishableKey: APP_CONFIG.stripe.publishableKey,
  
  // Price IDs for different subscription tiers - these should match your Stripe dashboard
  priceIds: {
    single_location_one_time: process.env.REACT_APP_STRIPE_PRICE_ID_SINGLE_ONE_TIME || 'price_single_one_time',
    single_location_monthly: process.env.REACT_APP_STRIPE_PRICE_ID_SINGLE_MONTHLY || 'price_single_monthly',
    multiple_locations_ongoing: process.env.REACT_APP_STRIPE_PRICE_ID_MULTIPLE_ONGOING || 'price_multiple_ongoing',
    enterprise_yearly: process.env.REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY || 'price_enterprise_yearly'
  },
  
  // Product IDs
  productIds: {
    single_location_one_time: 'prod_single_one_time',
    single_location_monthly: 'prod_single_monthly', 
    multiple_locations_ongoing: 'prod_multiple_ongoing',
    enterprise_yearly: 'prod_enterprise_yearly'
  }
};

// Comprehensive Stripe payment service
export const stripeService = {
  // Create checkout session for one-time payments
  createCheckoutSession: async (tierId, userId, userEmail, propertyData = null) => {
    try {
      const tier = APP_CONFIG.subscriptionTiers[tierId];
      if (!tier) {
        throw new Error('Invalid subscription tier');
      }

      // For demo purposes, we'll simulate the checkout process
      // const stripe = await getStripe(); // Uncomment when implementing real Stripe
      // In production, you'd call your backend API to create the session
      const sessionData = {
        mode: tier.type === 'one_time' ? 'payment' : 'subscription',
        price_id: STRIPE_CONFIG.priceIds[tierId],
        customer_email: userEmail,
        success_url: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/pricing`,
        metadata: {
          user_id: userId,
          tier_id: tierId,
          property_data: propertyData ? JSON.stringify(propertyData) : null
        }
      };

      console.log('Creating checkout session:', sessionData);
      
      // Mock successful session creation
      return {
        success: true,
        sessionId: `cs_mock_${Date.now()}`,
        url: `https://checkout.stripe.com/mock/${tierId}`,
        tierId,
        amount: tier.price
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { success: false, error: error.message };
    }
  },

  // Create subscription for recurring plans
  createSubscription: async (tierId, userId, userEmail, paymentMethodId = null) => {
    try {
      const tier = APP_CONFIG.subscriptionTiers[tierId];
      if (!tier || tier.type !== 'subscription') {
        throw new Error('Invalid subscription tier');
      }

      console.log('Creating subscription:', { tierId, userId, userEmail });
      
      // Mock subscription creation
      const subscriptionId = `sub_mock_${Date.now()}`;
      const customerId = `cus_mock_${userId}`;
      
      return {
        success: true,
        subscriptionId,
        customerId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + (tier.interval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        tier: tier
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }
  },

  // Process one-time payment
  processOneTimePayment: async (tierId, userId, userEmail, propertyData) => {
    try {
      const tier = APP_CONFIG.subscriptionTiers[tierId];
      if (!tier || tier.type !== 'one_time') {
        throw new Error('Invalid one-time payment tier');
      }

      console.log('Processing one-time payment:', { tierId, userId, propertyData });
      
      // Mock payment processing
      const paymentId = `pi_mock_${Date.now()}`;
      
      return {
        success: true,
        paymentId,
        amount: tier.price,
        status: 'succeeded',
        reportsRemaining: tier.reportsPerMonth,
        tier: tier,
        propertyData
      };
    } catch (error) {
      console.error('Error processing one-time payment:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId, reason = 'user_requested') => {
    try {
      console.log('Cancelling subscription:', { subscriptionId, reason });
      
      return {
        success: true,
        subscriptionId,
        cancelledAt: new Date().toISOString(),
        status: 'cancelled',
        reason
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  },

  // Update subscription
  updateSubscription: async (subscriptionId, newTierId) => {
    try {
      const newTier = APP_CONFIG.subscriptionTiers[newTierId];
      if (!newTier) {
        throw new Error('Invalid subscription tier');
      }

      console.log('Updating subscription:', { subscriptionId, newTierId });
      
      return {
        success: true,
        subscriptionId,
        newTier,
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: error.message };
    }
  },

  // Get subscription details
  getSubscriptionDetails: async (subscriptionId) => {
    try {
      console.log('Getting subscription details:', subscriptionId);
      
      // Mock subscription details
      return {
        success: true,
        subscription: {
          id: subscriptionId,
          status: 'active',
          currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
          tier: APP_CONFIG.subscriptionTiers.multiple_locations_ongoing
        }
      };
    } catch (error) {
      console.error('Error getting subscription details:', error);
      return { success: false, error: error.message };
    }
  },

  // Get customer portal URL
  getCustomerPortalUrl: async (customerId, returnUrl) => {
    try {
      console.log('Getting customer portal URL:', { customerId, returnUrl });
      
      // Mock portal URL
      return {
        success: true,
        url: `https://billing.stripe.com/p/session/mock_${customerId}`
      };
    } catch (error) {
      console.error('Error getting customer portal URL:', error);
      return { success: false, error: error.message };
    }
  }
};

// Payment component helpers
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getSubscriptionTier = (tierId) => {
  return APP_CONFIG.subscriptionTiers[tierId] || APP_CONFIG.subscriptionTiers.free;
};

// Report quota management
export const reportQuotaService = {
  // Check if user can generate a report
  canGenerateReport: async (userId, tierId) => {
    try {
      const tier = APP_CONFIG.subscriptionTiers[tierId];
      if (!tier) return { canGenerate: false, reason: 'Invalid tier' };
      
      // Free tier can't generate reports
      if (tier.id === 'free') {
        return { canGenerate: false, reason: 'Upgrade required' };
      }
      
      // Unlimited tiers
      if (tier.reportsPerMonth === -1) {
        return { canGenerate: true, remaining: -1 };
      }
      
      // Mock quota check - in production, check against database
      const mockUsage = Math.floor(Math.random() * tier.reportsPerMonth);
      const remaining = tier.reportsPerMonth - mockUsage;
      
      return {
        canGenerate: remaining > 0,
        remaining,
        used: mockUsage,
        limit: tier.reportsPerMonth,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error checking report quota:', error);
      return { canGenerate: false, reason: 'System error' };
    }
  },
  
  // Consume a report credit
  consumeReportCredit: async (userId, tierId) => {
    try {
      console.log('Consuming report credit:', { userId, tierId });
      
      // Mock credit consumption
      return {
        success: true,
        creditsRemaining: Math.floor(Math.random() * 10),
        consumedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error consuming report credit:', error);
      return { success: false, error: error.message };
    }
  }
};

// Webhook handling for Stripe events
export const webhookService = {
  // Handle successful payment
  handlePaymentSuccess: async (sessionId, paymentData) => {
    try {
      console.log('Handling payment success:', { sessionId, paymentData });
      
      // In production, you would:
      // 1. Verify the webhook signature
      // 2. Update user subscription in database
      // 3. Send confirmation email
      // 4. Update report quotas
      
      return { success: true, processed: true };
    } catch (error) {
      console.error('Error handling payment success:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Handle subscription updates
  handleSubscriptionUpdate: async (subscriptionData) => {
    try {
      console.log('Handling subscription update:', subscriptionData);
      
      return { success: true, processed: true };
    } catch (error) {
      console.error('Error handling subscription update:', error);
      return { success: false, error: error.message };
    }
  }
};

export { getStripe };
export default stripeService;

