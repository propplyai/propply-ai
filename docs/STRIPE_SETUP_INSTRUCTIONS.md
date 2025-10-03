# Stripe Setup Instructions for Propply MVP

This guide will walk you through setting up Stripe payments for the Propply MVP project. Follow these steps carefully to ensure proper integration.

## 📋 Prerequisites

- A Stripe account ([sign up here](https://dashboard.stripe.com/register))
- Access to your Stripe Dashboard
- Admin access to the Propply project
- Environment variables access (for production deployment)

## 🚀 Step 1: Create Stripe Account & Get API Keys

### 1.1 Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and click "Start now"
2. Fill out the account information
3. Verify your email address
4. Complete the account setup process

### 1.2 Get Your API Keys
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Make sure you're in **Test mode** (toggle in top-right corner)
3. Navigate to **Developers** > **API keys**
4. Copy your **Publishable key** (starts with `pk_test_`)
5. Copy your **Secret key** (starts with `sk_test_`)

⚠️ **Important**: Keep your Secret key secure and never commit it to version control!

## 💳 Step 2: Create Products and Prices

You need to create 4 products in your Stripe dashboard for the different subscription tiers:

### 2.1 Product 1: Single Location - One Time Report
1. Go to **Products** > **Add product**
2. **Name**: `Single Location - 1 Time Report`
3. **Description**: `One-time compliance report for a single property location`
4. **Pricing**: 
   - Set price to `$49.99`
   - Select "One-time" (not recurring)
5. Click **Save product**
6. **Copy the Price ID** (starts with `price_`) - you'll need this later

### 2.2 Product 2: Single Location - Monthly Report
1. **Add product** again
2. **Name**: `Single Location - Monthly Report`
3. **Description**: `Monthly compliance reports for a single property location`
4. **Pricing**:
   - Set price to `$99.99`
   - Select "Recurring" > "Monthly"
   - Add 14-day free trial (optional but recommended)
5. Click **Save product**
6. **Copy the Price ID**

### 2.3 Product 3: Multiple Locations - Ongoing
1. **Add product** again
2. **Name**: `Multiple Locations - Ongoing`
3. **Description**: `Unlimited compliance reports for multiple property locations`
4. **Pricing**:
   - Set price to `$199.99`
   - Select "Recurring" > "Monthly"
   - Add 14-day free trial (optional but recommended)
5. Click **Save product**
6. **Copy the Price ID**

### 2.4 Product 4: Enterprise Yearly
1. **Add product** again
2. **Name**: `Enterprise Yearly`
3. **Description**: `Unlimited compliance reports with yearly billing (save 17%)`
4. **Pricing**:
   - Set price to `$1,999.99`
   - Select "Recurring" > "Yearly"
5. Click **Save product**
6. **Copy the Price ID**

## 🔗 Step 3: Set Up Webhooks

Webhooks allow Stripe to notify your backend when payments succeed or fail.

### 3.1 For Local Development (using Stripe CLI)

1. **Install Stripe CLI**:
   - Download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   - Or install via package manager:
     ```bash
     # macOS
     brew install stripe/stripe-cli/stripe
     
     # Windows (using Chocolatey)
     choco install stripe-cli
     ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to http://localhost:5002/api/stripe/webhook
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`) from the terminal output

### 3.2 For Production Setup

1. Go to **Developers** > **Webhooks** > **Add endpoint**
2. **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
3. **Select events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add endpoint**
5. **Copy the webhook signing secret** from the endpoint details

## ⚙️ Step 4: Configure Environment Variables

### 4.1 For Local Development

Create or update your `.env.local` file with the following variables:

```bash
# Stripe API Keys
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (replace with your actual Price IDs)
REACT_APP_STRIPE_PRICE_ID_SINGLE_ONE_TIME=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_SINGLE_MONTHLY=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_MULTIPLE_ONGOING=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_xxxxx

# App Configuration
APP_BASE_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5002
```

### 4.2 For Production Deployment

Update your production environment variables with:

```bash
# Use LIVE keys for production (not test keys)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key_here
STRIPE_SECRET_KEY=sk_live_your_actual_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Update URLs for production
APP_BASE_URL=https://your-domain.com
REACT_APP_API_URL=https://your-domain.com
```

## 🛠️ Step 5: Enable Customer Portal

The Customer Portal allows users to manage their subscriptions.

1. Go to **Settings** > **Billing** > **Customer portal**
2. **Configure settings**:
   - ✅ Allow customers to update payment method
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to view invoices
   - ✅ Allow customers to update billing information
3. **Customize branding** (optional):
   - Add your logo
   - Set brand colors
   - Customize messaging
4. Click **Save**

## 🧪 Step 6: Test the Integration

### 6.1 Test Cards

Use these test card numbers in test mode:

- **Success**: `4242 4242 4242 4242`
- **Requires authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`
- **Insufficient funds**: `4000 0000 0000 9995`

Use any future expiry date (e.g., 12/25) and any 3-digit CVC (e.g., 123).

### 6.2 Testing the Payment Flow

1. **Start your backend server**:
   ```bash
   python propply_app.py
   ```

2. **Start your frontend**:
   ```bash
   npm start
   ```

3. **Test each subscription tier**:
   - Free tier (no payment required)
   - One-time report purchase ($49.99)
   - Monthly subscription ($99.99/month)
   - Multiple locations ($199.99/month)
   - Enterprise yearly ($1,999.99/year)

4. **Verify webhook events**:
   - Check that webhook events are received
   - Verify user subscription is updated in database
   - Test subscription management in customer portal

## 🚀 Step 7: Go Live (Production)

When ready for production:

### 7.1 Switch to Live Mode

1. **Toggle to Live mode** in Stripe Dashboard (top-right corner)
2. **Get your Live API keys**:
   - Copy Live Publishable key (starts with `pk_live_`)
   - Copy Live Secret key (starts with `sk_live_`)
3. **Create Products in Live mode** (repeat Step 2 with live mode)
4. **Set up production webhooks** (repeat Step 3.2 with production URL)
5. **Update environment variables** with Live keys

### 7.2 Security Checklist

- [ ] Use HTTPS for all endpoints
- [ ] Verify webhook signatures in production
- [ ] Keep secret keys secure (use environment variables)
- [ ] Enable rate limiting on payment endpoints
- [ ] Log failed payments for review
- [ ] Set up monitoring for webhook failures

## 🔧 Step 8: Backend Integration

The Propply project already includes a `stripe_service.py` file with the following endpoints:

### Available API Endpoints:

- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/create-portal-session` - Customer portal access
- `GET /api/stripe/subscription/:id` - Get subscription details
- `POST /api/stripe/subscription/:id/cancel` - Cancel subscription
- `POST /api/stripe/subscription/:id/update` - Update subscription
- `POST /api/stripe/webhook` - Handle webhook events

### Webhook Events Handled:

- `checkout.session.completed` - Payment successful
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Payment received
- `invoice.payment_failed` - Payment failed

## 🆘 Troubleshooting

### Common Issues

1. **"No such price" error**:
   - Verify Price IDs in environment variables match your Stripe Dashboard
   - Ensure you're using the correct keys for your environment (test vs live)

2. **Webhook signature verification failed**:
   - Check that `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint is accessible
   - Verify you're using the right webhook secret for your environment

3. **CORS errors**:
   - Make sure `REACT_APP_API_URL` is set correctly
   - Check that your backend server is running

4. **Checkout session not creating**:
   - Verify `STRIPE_SECRET_KEY` is correct
   - Check backend logs for error messages
   - Ensure all required parameters are provided

### Debug Mode

Enable debug logging in `stripe_service.py`:

```python
import stripe
stripe.log = 'debug'
```

### Test Webhooks Locally

Use Stripe CLI to trigger test webhooks:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

## 📊 Monitoring & Analytics

### Stripe Dashboard

Monitor your payments in the Stripe Dashboard:
- **Payments** - View all transactions
- **Customers** - Manage customer data
- **Subscriptions** - Track recurring payments
- **Webhooks** - Monitor webhook delivery

### Key Metrics to Track

- Payment success rate
- Subscription conversion rate
- Churn rate
- Average revenue per user (ARPU)
- Monthly recurring revenue (MRR)

## 🔐 Security Best Practices

1. ✅ Never expose your Secret key in frontend code
2. ✅ Always verify webhook signatures
3. ✅ Use HTTPS in production
4. ✅ Keep Stripe libraries updated
5. ✅ Log failed payments for review
6. ✅ Implement rate limiting on payment endpoints
7. ✅ Validate all inputs on the backend
8. ✅ Use environment variables for sensitive data

## 📞 Support Resources

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: [support.stripe.com](https://support.stripe.com/)
- **Stripe Status**: [status.stripe.com](https://status.stripe.com/)
- **Propply Issues**: [GitHub Issues](https://github.com/your-repo/issues)

## ✅ Completion Checklist

- [ ] Stripe account created and verified
- [ ] API keys obtained (test and live)
- [ ] All 4 products created with correct pricing
- [ ] Price IDs copied and added to environment variables
- [ ] Webhooks configured for local development
- [ ] Webhooks configured for production
- [ ] Customer portal enabled
- [ ] Test payments completed successfully
- [ ] Production environment variables updated
- [ ] Security checklist completed
- [ ] Monitoring and analytics set up

## 🎯 Next Steps

After completing the Stripe setup:

1. **Test the complete payment flow** with test cards
2. **Verify webhook events** are being processed correctly
3. **Set up monitoring** for payment failures
4. **Create customer support documentation** for billing issues
5. **Plan for subscription analytics** and reporting
6. **Consider implementing** subscription renewal reminders
7. **Set up automated** email notifications for payment events

Your Propply MVP now has a complete payment system that supports both one-time payments and recurring subscriptions! 🎉
