# Propply AI - Authentication & Payment Setup Guide

This guide will help you set up Supabase authentication and Stripe payments for your new subscription model.

## 🏗️ **New Subscription Tiers**

Your updated pricing structure now includes:

1. **Free** - $0 (0 reports/month)
2. **Single Location - 1 Time Report** - $49.99 (one-time payment, 1 report)
3. **Single Location - Monthly Report** - $99.99/month (1 report/month)
4. **Multiple Locations - Ongoing** - $199.99/month (unlimited reports) ⭐ *Most Popular*
5. **Enterprise Yearly** - $1999.99/year (unlimited reports, save 17%)

## 📋 **Prerequisites**

- Supabase account and project
- Stripe account (test mode for development)
- Node.js and npm installed

## 🚀 **Step 1: Database Setup**

### 1.1 Run the Database Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the query to create all tables, indexes, and policies

### 1.2 Verify Tables Created

Check that these tables were created:
- `user_profiles`
- `properties`
- `compliance_reports`
- `payments`
- `vendors`
- `vendor_quotes`

## 🔐 **Step 2: Supabase Authentication Setup**

### 2.1 Configure Authentication

1. In Supabase dashboard, go to **Authentication > Settings**
2. Enable **Email confirmations** (recommended)
3. Set **Site URL** to your domain (e.g., `http://localhost:3000` for development)
4. Configure **Redirect URLs** for password reset

### 2.2 Update Environment Variables

Copy `.env.example` to `.env` and update:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

## 💳 **Step 3: Stripe Setup**

### 3.1 Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Get your **Publishable Key** and **Secret Key** from the dashboard
3. Start in **Test Mode** for development

### 3.2 Create Products and Prices

Create these products in your Stripe dashboard:

#### Product 1: Single Location - 1 Time Report
- **Name**: Single Location - 1 Time Report
- **Price**: $49.99 USD (one-time)
- **Price ID**: Copy this for your env vars

#### Product 2: Single Location - Monthly Report
- **Name**: Single Location - Monthly Report
- **Price**: $99.99 USD (recurring monthly)
- **Price ID**: Copy this for your env vars

#### Product 3: Multiple Locations - Ongoing
- **Name**: Multiple Locations - Ongoing
- **Price**: $199.99 USD (recurring monthly)
- **Price ID**: Copy this for your env vars

#### Product 4: Enterprise Yearly
- **Name**: Enterprise Yearly
- **Price**: $1999.99 USD (recurring yearly)
- **Price ID**: Copy this for your env vars

### 3.3 Update Environment Variables

Add your Stripe keys to `.env`:

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Update with your actual Price IDs
REACT_APP_STRIPE_PRICE_ID_SINGLE_ONE_TIME=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_SINGLE_MONTHLY=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_MULTIPLE_ONGOING=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_xxxxx
```

### 3.4 Set Up Webhooks (Production)

For production, create a webhook endpoint:
1. In Stripe dashboard, go to **Developers > Webhooks**
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`
4. Copy the webhook secret to your env vars

## 🛠️ **Step 4: Install Dependencies**

Install required packages:

```bash
npm install @stripe/stripe-js
```

## 🎨 **Step 5: Update Your App Components**

### 5.1 Update Landing Page

Replace your existing pricing section with the new `PricingSection` component:

```jsx
import PricingSection from './components/PricingSection';

// In your landing page component
<PricingSection user={user} onUpgrade={handleUpgrade} />
```

### 5.2 Add Billing Dashboard

Add the billing dashboard to your user dashboard:

```jsx
import BillingDashboard from './components/BillingDashboard';

// In your dashboard component
<BillingDashboard user={user} onUpdate={handleUpdate} />
```

### 5.3 Update Authentication

Replace your existing auth logic with the new `authService`:

```jsx
import { authService } from './services/auth';

// Sign up
const handleSignUp = async (email, password, userData) => {
  const result = await authService.signUp(email, password, userData);
  if (result.success) {
    // Handle success
  }
};

// Sign in
const handleSignIn = async (email, password) => {
  const result = await authService.signIn(email, password);
  if (result.success) {
    // Handle success
  }
};
```

## 🧪 **Step 6: Testing**

### 6.1 Test Authentication

1. Create a new account
2. Verify email confirmation works
3. Test sign in/out functionality
4. Check that user profile is created in database

### 6.2 Test Payments (Test Mode)

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`

Test each subscription tier:
1. Free tier (no payment required)
2. One-time report purchase
3. Monthly subscription
4. Yearly subscription

### 6.3 Test Report Quotas

1. Check quota limits for each tier
2. Verify report generation consumes credits
3. Test upgrade/downgrade scenarios

## 🚀 **Step 7: Production Deployment**

### 7.1 Environment Variables

Update your production environment with:
- Live Stripe keys (not test keys)
- Production Supabase URL and keys
- Webhook endpoints

### 7.2 Security Checklist

- [ ] Enable RLS policies in Supabase
- [ ] Use HTTPS for all endpoints
- [ ] Verify webhook signatures
- [ ] Set up proper CORS policies
- [ ] Enable Stripe webhook endpoint verification

## 🔧 **Step 8: Backend Integration**

### 8.1 Update Flask Backend

Add Stripe webhook handling to your Flask app:

```python
import stripe
from flask import request, jsonify

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

@app.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
        
        # Handle the event
        if event['type'] == 'checkout.session.completed':
            # Handle successful payment
            pass
        elif event['type'] == 'customer.subscription.updated':
            # Handle subscription changes
            pass
            
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
```

## 📊 **Features Implemented**

✅ **Authentication System**
- User registration/login with Supabase
- Email verification
- Password reset functionality
- User profile management

✅ **Subscription Management**
- 4 pricing tiers with different report quotas
- One-time payments and recurring subscriptions
- Subscription upgrades/downgrades
- Report quota tracking

✅ **Payment Processing**
- Stripe integration for secure payments
- Webhook handling for payment events
- Customer portal for billing management
- Payment history tracking

✅ **User Dashboard**
- Subscription status display
- Report usage tracking
- Billing history
- Plan management

✅ **Database Schema**
- Complete user profiles table
- Properties and reports tracking
- Payment history
- Vendor marketplace integration

## 🆘 **Troubleshooting**

### Common Issues

1. **Stripe keys not working**: Ensure you're using the correct keys for your environment (test vs live)
2. **Database permissions**: Check RLS policies are properly configured
3. **CORS errors**: Update your Supabase CORS settings
4. **Webhook failures**: Verify webhook URL is accessible and signature verification is correct

### Support

- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Stripe docs: [stripe.com/docs](https://stripe.com/docs)
- React Stripe.js: [stripe.com/docs/stripe-js/react](https://stripe.com/docs/stripe-js/react)

## 🎯 **Next Steps**

1. Set up your Supabase project and run the schema
2. Create your Stripe products and get the price IDs
3. Update your environment variables
4. Test the authentication and payment flows
5. Deploy to production with live keys

Your Propply AI platform now has a complete authentication and subscription system that supports both pay-per-report and recurring subscription models!
