#!/usr/bin/env python3
"""
Stripe Service for Propply AI
Handles payments, subscriptions, and webhook processing
"""

import os
import stripe
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Initialize Stripe with your secret key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

class StripeService:
    """Service for handling Stripe payments and subscriptions"""

    def __init__(self):
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

    def create_checkout_session(
        self,
        price_id: str,
        customer_email: str,
        user_id: str,
        tier_id: str,
        mode: str = 'subscription',
        success_url: str = None,
        cancel_url: str = None,
        property_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout session for subscription or one-time payment

        Args:
            price_id: Stripe Price ID
            customer_email: Customer email
            user_id: Your internal user ID
            tier_id: Subscription tier ID
            mode: 'subscription' or 'payment'
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if user cancels
            property_data: Optional property data to attach as metadata

        Returns:
            Dictionary with session_id and checkout URL
        """
        try:
            # Default URLs if not provided
            if not success_url:
                success_url = f"{os.getenv('APP_BASE_URL', 'http://localhost:3000')}/?session_id={{CHECKOUT_SESSION_ID}}&payment_status=success"
            if not cancel_url:
                cancel_url = f"{os.getenv('APP_BASE_URL', 'http://localhost:3000')}/?payment_status=cancelled"

            # Build metadata
            metadata = {
                'user_id': user_id,
                'tier_id': tier_id,
            }
            if property_data:
                metadata['property_data'] = str(property_data)[:500]  # Stripe has 500 char limit

            # Create checkout session
            session_params = {
                'payment_method_types': ['card'],
                'line_items': [{
                    'price': price_id,
                    'quantity': 1,
                }],
                'mode': mode,
                'success_url': success_url,
                'cancel_url': cancel_url,
                'customer_email': customer_email,
                'metadata': metadata,
                'allow_promotion_codes': True,
            }

            # Add subscription-specific options
            if mode == 'subscription':
                session_params['subscription_data'] = {
                    'metadata': metadata,
                    'trial_period_days': 14,  # 14-day free trial
                }

            session = stripe.checkout.Session.create(**session_params)

            return {
                'success': True,
                'session_id': session.id,
                'url': session.url
            }

        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }

    def create_customer_portal_session(
        self,
        customer_id: str,
        return_url: str = None
    ) -> Dict[str, Any]:
        """
        Create a customer portal session for managing subscriptions

        Args:
            customer_id: Stripe Customer ID
            return_url: URL to return to after portal session

        Returns:
            Dictionary with portal URL
        """
        try:
            if not return_url:
                return_url = f"{os.getenv('APP_BASE_URL', 'http://localhost:3000')}/"

            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )

            return {
                'success': True,
                'url': session.url
            }

        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Get subscription details

        Args:
            subscription_id: Stripe Subscription ID

        Returns:
            Dictionary with subscription details
        """
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)

            return {
                'success': True,
                'subscription': {
                    'id': subscription.id,
                    'status': subscription.status,
                    'current_period_start': datetime.fromtimestamp(subscription.current_period_start).isoformat(),
                    'current_period_end': datetime.fromtimestamp(subscription.current_period_end).isoformat(),
                    'cancel_at_period_end': subscription.cancel_at_period_end,
                    'customer': subscription.customer,
                }
            }

        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }

    def cancel_subscription(
        self,
        subscription_id: str,
        cancel_immediately: bool = False
    ) -> Dict[str, Any]:
        """
        Cancel a subscription

        Args:
            subscription_id: Stripe Subscription ID
            cancel_immediately: If True, cancel now. If False, cancel at period end

        Returns:
            Dictionary with cancellation result
        """
        try:
            if cancel_immediately:
                subscription = stripe.Subscription.delete(subscription_id)
            else:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )

            return {
                'success': True,
                'subscription_id': subscription.id,
                'status': subscription.status,
                'cancelled_at': datetime.now().isoformat()
            }

        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }

    def update_subscription(
        self,
        subscription_id: str,
        new_price_id: str
    ) -> Dict[str, Any]:
        """
        Update subscription to a new plan

        Args:
            subscription_id: Stripe Subscription ID
            new_price_id: New Stripe Price ID

        Returns:
            Dictionary with update result
        """
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)

            # Update the subscription
            updated_subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': new_price_id,
                }],
                proration_behavior='always_invoice',  # Charge prorated amount immediately
            )

            return {
                'success': True,
                'subscription_id': updated_subscription.id,
                'status': updated_subscription.status,
                'updated_at': datetime.now().isoformat()
            }

        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }

    def verify_webhook_signature(
        self,
        payload: bytes,
        sig_header: str
    ) -> Optional[stripe.Event]:
        """
        Verify webhook signature and construct event

        Args:
            payload: Raw request body
            sig_header: Stripe-Signature header value

        Returns:
            Stripe Event object if valid, None otherwise
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return event
        except ValueError as e:
            # Invalid payload
            print(f"Invalid webhook payload: {e}")
            return None
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            print(f"Invalid webhook signature: {e}")
            return None

    def handle_webhook_event(self, event: stripe.Event) -> Dict[str, Any]:
        """
        Process webhook events from Stripe

        Args:
            event: Stripe Event object

        Returns:
            Dictionary with processing result and data to update in database
        """
        event_type = event['type']
        data = event['data']['object']

        result = {
            'event_type': event_type,
            'processed': True,
            'updates': {}
        }

        # Handle different event types
        if event_type == 'checkout.session.completed':
            # Payment successful
            result['updates'] = {
                'user_id': data.get('metadata', {}).get('user_id'),
                'tier_id': data.get('metadata', {}).get('tier_id'),
                'customer_id': data.get('customer'),
                'subscription_id': data.get('subscription'),
                'status': 'active',
            }

        elif event_type == 'customer.subscription.created':
            result['updates'] = {
                'subscription_id': data['id'],
                'customer_id': data['customer'],
                'status': data['status'],
                'current_period_start': datetime.fromtimestamp(data['current_period_start']).isoformat(),
                'current_period_end': datetime.fromtimestamp(data['current_period_end']).isoformat(),
            }

        elif event_type == 'customer.subscription.updated':
            result['updates'] = {
                'subscription_id': data['id'],
                'status': data['status'],
                'current_period_start': datetime.fromtimestamp(data['current_period_start']).isoformat(),
                'current_period_end': datetime.fromtimestamp(data['current_period_end']).isoformat(),
                'cancel_at_period_end': data.get('cancel_at_period_end', False),
            }

        elif event_type == 'customer.subscription.deleted':
            result['updates'] = {
                'subscription_id': data['id'],
                'status': 'cancelled',
                'cancelled_at': datetime.now().isoformat(),
            }

        elif event_type == 'invoice.payment_succeeded':
            result['updates'] = {
                'customer_id': data['customer'],
                'subscription_id': data.get('subscription'),
                'invoice_id': data['id'],
                'amount_paid': data['amount_paid'] / 100,  # Convert cents to dollars
                'payment_date': datetime.fromtimestamp(data['created']).isoformat(),
            }

        elif event_type == 'invoice.payment_failed':
            result['updates'] = {
                'customer_id': data['customer'],
                'subscription_id': data.get('subscription'),
                'status': 'payment_failed',
                'payment_failed_at': datetime.now().isoformat(),
            }

        return result


# Create a singleton instance
stripe_service = StripeService()