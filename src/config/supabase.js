import { createClient } from '@supabase/supabase-js';

// Supabase configuration for MVP
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://squmtocfnsgqadkqpbxl.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdW10b2NmbnNncWFka3FwYnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Njc0MDYsImV4cCI6MjA3MzE0MzQwNn0.95Z8JVu40tjXwVFL8kitCmG6ZG0RTi-b2qYbq5-XFGk';

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase environment variables not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file.');
  console.warn('📖 See AUTHENTICATION_SETUP.md for setup instructions.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'propply-auth',
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'X-Client-Info': 'propply-ai-web'
    }
  }
});

// Debug logging
console.log('Supabase initialized with:', {
  url: supabaseUrl,
  keyPrefix: supabaseKey?.substring(0, 20) + '...'
});

// App configuration
export const APP_CONFIG = {
  name: 'Propply AI',
  version: '1.0.0',
  supportedCities: ['NYC', 'Philadelphia'],
  apiUrl: process.env.REACT_APP_API_URL || 'https://propply-ai-backend.onrender.com',
  subscriptionTiers: {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      type: 'free',
      reportsPerMonth: 0,
      features: [
        'Up to 3 properties',
        'Basic compliance tracking',
        'Email reminders',
        'Community support'
      ],
      stripeProductId: null,
      stripePriceId: null
    },
    single_location_one_time: {
      id: 'single_location_one_time',
      name: 'Single Location - 1 Time Report',
      price: 49.99,
      type: 'one_time',
      reportsPerMonth: 1,
      features: [
        'Full AI compliance analysis',
        'Detailed violation reports',
        'Cost estimates',
        'Priority support',
        'Single property focus'
      ],
      stripeProductId: 'prod_single_report',
      stripePriceId: 'price_single_report'
    },
    single_location_monthly: {
      id: 'single_location_monthly',
      name: 'Single Location - Monthly Report',
      price: 99.99,
      type: 'subscription',
      interval: 'month',
      reportsPerMonth: 1,
      features: [
        'Monthly compliance reports',
        'Single property tracking',
        'AI-powered analytics',
        'Automated scheduling',
        'Email & SMS alerts',
        'Basic vendor marketplace'
      ],
      stripeProductId: 'prod_single_monthly',
      stripePriceId: 'price_single_monthly'
    },
    multiple_locations_ongoing: {
      id: 'multiple_locations_ongoing',
      name: 'Multiple Locations - Ongoing',
      price: 199.99,
      type: 'subscription',
      interval: 'month',
      reportsPerMonth: -1, // Unlimited
      features: [
        'Unlimited properties',
        'Unlimited reports',
        'AI-powered analytics',
        'Vendor marketplace access',
        'Automated scheduling',
        'Priority support',
        'Custom integrations',
        'Advanced reporting suite'
      ],
      stripeProductId: 'prod_multiple_ongoing',
      stripePriceId: 'price_multiple_ongoing',
      popular: true
    },
    enterprise_yearly: {
      id: 'enterprise_yearly',
      name: 'Enterprise Yearly',
      price: 1999.99,
      type: 'subscription',
      interval: 'year',
      reportsPerMonth: -1, // Unlimited
      features: [
        'Everything in Multiple Locations',
        'Advanced reporting suite',
        'Custom integrations',
        'Dedicated account manager',
        'White-label options',
        'API access',
        'Save 17% annually'
      ],
      stripeProductId: 'prod_enterprise_yearly',
      stripePriceId: 'price_enterprise_yearly'
    }
  },
  
  // Stripe configuration
  stripe: {
    publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...'
  }
};

export default supabase;

