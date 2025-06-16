// Stripe integration for payment processing
export class StripeService {
  private publicKey: string;
  private isConfigured: boolean;
  private baseUrl: string;

  constructor() {
    this.publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
    this.isConfigured = !!this.publicKey && this.publicKey !== 'your_stripe_public_key_here';
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    
    if (!this.isConfigured) {
      console.warn('Stripe public key not found. Payment features will be simulated.');
    }
  }

  // Initialize Stripe
  async loadStripe() {
    if (!this.isConfigured) {
      console.log('Simulating Stripe initialization');
      return null;
    }

    try {
      // In a real implementation, this would load the Stripe.js library
      const stripe = (window as any).Stripe?.(this.publicKey);
      if (!stripe) {
        throw new Error('Stripe.js not loaded');
      }
      return stripe;
    } catch (error) {
      console.error('Stripe initialization error:', error);
      return null;
    }
  }

  // Create a checkout session
  async createCheckoutSession(priceId: string, successUrl?: string, cancelUrl?: string): Promise<string> {
    if (!this.isConfigured) {
      console.log('Simulating checkout session creation:', priceId);
      
      // Simulate checkout session creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a mock checkout URL
      return `${window.location.origin}/checkout?session_id=mock_session_${Date.now()}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          priceId,
          successUrl,
          cancelUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Checkout session error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  // Get customer portal URL
  async getCustomerPortalUrl(returnUrl?: string): Promise<string> {
    if (!this.isConfigured) {
      console.log('Simulating customer portal URL generation');
      
      // Return a mock portal URL
      return `${window.location.origin}/app/billing?portal=mock_${Date.now()}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          returnUrl: returnUrl || `${window.location.origin}/app/billing`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create portal session');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Customer portal error:', error);
      throw new Error('Failed to access customer portal');
    }
  }

  // Get subscription status
  async getSubscriptionStatus(userId: string) {
    if (!this.isConfigured) {
      return {
        isActive: true,
        productId: 'creator_pro_monthly',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        willRenew: true
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/functions/v1/subscription-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get subscription status');
      }

      return await response.json();
    } catch (error) {
      console.error('Subscription status error:', error);
      return null;
    }
  }

  // Get configuration status for debugging
  getConfigStatus() {
    return {
      configured: this.isConfigured,
      hasPublicKey: !!this.publicKey,
      keyLength: this.publicKey ? this.publicKey.length : 0
    };
  }
}

export const stripeService = new StripeService();