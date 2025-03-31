import { loadStripe } from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  console.warn('Missing Stripe publishable key. Stripe payments will not work.');
}

// Load the Stripe instance with the publishable key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

/**
 * Helper function to create a payment intent for a one-time payment
 * @param amount The amount to charge in dollars
 * @param currency The currency to use (default: usd)
 * @returns The client secret needed to complete the payment
 */
export async function createPaymentIntent(amount: number, currency: string = 'usd') {
  try {
    const response = await fetch('/api/payment/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }
    
    const data = await response.json();
    return data.clientSecret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Helper function to create a subscription
 * @param customerId The Stripe customer ID
 * @param priceId The Stripe price ID for the subscription
 * @returns The client secret needed to complete the subscription
 */
export async function createSubscription(customerId: string, priceId: string) {
  try {
    const response = await fetch('/api/payment/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId, priceId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }
    
    const data = await response.json();
    return {
      subscriptionId: data.subscriptionId,
      clientSecret: data.clientSecret,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}