# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe payments for Propply AI.

## Prerequisites

- A Stripe account ([sign up here](https://dashboard.stripe.com/register))
- Access to your Stripe Dashboard

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** > **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)
4. Copy your **Secret key** (starts with `sk_test_` for test mode)
5. Add these to your `.env.local` file:

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
```

⚠️ **Important**: Never commit your Secret key to Git!

## Step 2: Create Products and Prices

### 1. Single Location - One Time Report

1. Go to **Products** > **Add product**
2. Name: `Single Location - 1 Time Report`
3. Price: `$49.99` (one-time)
4. Copy the Price ID (starts with `price_`)
5. Add to `.env.local`: `REACT_APP_STRIPE_PRICE_ID_SINGLE_ONE_TIME=price_...`

### 2. Single Location - Monthly Report

1. Create product: `Single Location - Monthly Report`
2. Price: `$99.99` (recurring monthly)
3. Add 14-day free trial (optional)
4. Copy Price ID
5. Add to `.env.local`: `REACT_APP_STRIPE_PRICE_ID_SINGLE_MONTHLY=price_...`

### 3. Multiple Locations - Ongoing

1. Create product: `Multiple Locations - Ongoing`
2. Price: `$199.99` (recurring monthly)
3. Add 14-day free trial (optional)
4. Copy Price ID
5. Add to `.env.local`: `REACT_APP_STRIPE_PRICE_ID_MULTIPLE_ONGOING=price_...`

### 4. Enterprise Yearly

1. Create product: `Enterprise Yearly`
2. Price: `$1,999.99` (recurring yearly)
3. Copy Price ID
4. Add to `.env.local`: `REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...`

## Step 3: Set Up Webhooks

Webhooks allow Stripe to notify your backend when payments succeed or fail.

### Local Development (using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to http://localhost:5002/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Production Setup

1. Go to **Developers** > **Webhooks** > **Add endpoint**
2. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Add to your production environment variables

## Step 4: Configure Success/Cancel URLs

The checkout session redirects are configured in the backend (`stripe_service.py`):

```python
success_url = f"{os.getenv('APP_BASE_URL')}/?session_id={{CHECKOUT_SESSION_ID}}&payment_status=success"
cancel_url = f"{os.getenv('APP_BASE_URL')}/?payment_status=cancelled"
```

Make sure `APP_BASE_URL` is set in your `.env.local`:

```bash
APP_BASE_URL=http://localhost:3000  # For local development
# APP_BASE_URL=https://your-domain.com  # For production
```

## Step 5: Enable Customer Portal

The Customer Portal allows users to manage their subscriptions.

1. Go to **Settings** > **Billing** > **Customer portal**
2. Configure settings:
   - Allow customers to update payment method
   - Allow customers to cancel subscriptions
   - Allow customers to view invoices
3. Customize branding (optional)

## Step 6: Test the Integration

### Test Cards

Use these test card numbers in test mode:

- **Success**: `4242 4242 4242 4242`
- **Requires authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`

Use any future expiry date and any 3-digit CVC.

### Testing the Flow

1. Start your backend server:
   ```bash
   python propply_app.py
   ```

2. Start your frontend:
   ```bash
   npm start
   ```

3. Test the payment flow:
   - Click "Upgrade Plan" on a pricing card
   - Enter test card details
   - Complete checkout
   - Verify webhook receives the event
   - Check that user subscription is updated

## Step 7: Go Live

When ready for production:

1. Switch to Live mode in Stripe Dashboard (toggle in top-right)
2. Get your Live API keys
3. Create Products and Prices in Live mode
4. Set up production webhooks
5. Update environment variables with Live keys
6. Test with real card (recommend small amount first)

## API Endpoints

The following endpoints are available:

### Create Checkout Session
```
POST /api/stripe/create-checkout-session
Body: {
  tier_id, user_id, user_email, price_id, mode, property_data
}
```

### Create Customer Portal Session
```
POST /api/stripe/create-portal-session
Body: { customer_id, return_url }
```

### Get Subscription
```
GET /api/stripe/subscription/:subscription_id
```

### Cancel Subscription
```
POST /api/stripe/subscription/:subscription_id/cancel
Body: { cancel_immediately }
```

### Update Subscription
```
POST /api/stripe/subscription/:subscription_id/update
Body: { new_price_id }
```

### Webhook Handler
```
POST /api/stripe/webhook
Headers: { Stripe-Signature }
```

## Troubleshooting

### Common Issues

1. **"No such price"**: Make sure Price IDs in `.env.local` match your Stripe Dashboard
2. **Webhook signature verification failed**: Ensure `STRIPE_WEBHOOK_SECRET` is correct
3. **CORS errors**: Make sure `REACT_APP_API_URL` is set correctly
4. **Checkout session not creating**: Check `STRIPE_SECRET_KEY` and backend logs

### Debug Mode

Enable debug logging:

```bash
# In stripe_service.py
import stripe
stripe.log = 'debug'
```

### Test Webhooks Locally

Use Stripe CLI to trigger test webhooks:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

## Security Best Practices

1. ✅ Never expose your Secret key in frontend code
2. ✅ Always verify webhook signatures
3. ✅ Use HTTPS in production
4. ✅ Keep Stripe libraries updated
5. ✅ Log failed payments for review
6. ✅ Implement rate limiting on payment endpoints
7. ✅ Validate all inputs on the backend

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com/
- Propply Issues: [GitHub Issues](https://github.com/your-repo/issues)

## Next Steps

After completing setup:

1. Update subscription tiers in database when payment succeeds
2. Send confirmation emails to customers
3. Add usage tracking for report quotas
4. Implement subscription renewal reminders
5. Set up revenue analytics dashboard