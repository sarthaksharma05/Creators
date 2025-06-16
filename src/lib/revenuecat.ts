// RevenueCat integration for subscription management
export class RevenueCatService {
  private apiKey: string;
  private isConfigured: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_REVENUECAT_API_KEY || '';
    this.isConfigured = !!this.apiKey && this.apiKey !== 'your_revenuecat_api_key_here';
    
    if (!this.isConfigured) {
      console.warn('RevenueCat API key not found. Subscription features will be simulated.');
    }
  }

  // Initialize RevenueCat SDK
  async initialize(userId: string) {
    if (!this.isConfigured) {
      console.log('Simulating RevenueCat initialization');
      return true;
    }

    try {
      // In a real implementation, you would initialize the RevenueCat SDK here
      // This would typically be done with their JavaScript SDK or REST API
      console.log('Initializing RevenueCat for user:', userId);
      return true;
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
      return false;
    }
  }

  // Purchase a subscription plan with proper payment flow
  async purchasePlan(planId: string, billingCycle: 'monthly' | 'yearly'): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('Simulating plan purchase with payment processing:', planId, billingCycle);
      
      // Simulate realistic payment processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate occasional payment failures for realism
      if (Math.random() < 0.1) { // 10% chance of failure
        throw new Error('Payment declined. Please check your payment details and try again.');
      }
      
      return true;
    }

    try {
      // In production, this would integrate with RevenueCat's purchase flow
      const response = await this.makeRevenueCatRequest('/purchases', {
        method: 'POST',
        body: JSON.stringify({
          product_id: `${planId}_${billingCycle}`,
          platform: 'web',
          currency: 'USD'
        })
      });

      return response.success;
    } catch (error) {
      console.error('Purchase error:', error);
      throw new Error('Failed to process purchase');
    }
  }

  // Process payment with payment details (simulated for demo)
  async processPayment(paymentDetails: any, amount: number): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('Simulating payment processing for amount:', amount);
      
      // Validate payment details format
      if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
        throw new Error('Invalid payment details');
      }
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment validation
      if (paymentDetails.cardNumber.replace(/\s/g, '').length < 13) {
        throw new Error('Invalid card number');
      }
      
      if (paymentDetails.cvv.length < 3) {
        throw new Error('Invalid CVV');
      }
      
      // Simulate occasional payment failures
      if (Math.random() < 0.05) { // 5% chance of failure
        throw new Error('Payment declined by bank. Please try a different payment method.');
      }
      
      return true;
    }

    try {
      // In production, this would integrate with Stripe or other payment processor
      const response = await this.makeRevenueCatRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          payment_details: paymentDetails,
          amount: amount,
          currency: 'USD'
        })
      });

      return response.success;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw new Error('Payment processing failed');
    }
  }

  // Get current subscription status
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
      const response = await this.makeRevenueCatRequest(`/subscribers/${userId}`);
      return response.subscriber;
    } catch (error) {
      console.error('Subscription status error:', error);
      return null;
    }
  }

  // Update payment method
  async updatePaymentMethod(): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('Simulating payment method update');
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
    }

    try {
      // In production, this would redirect to RevenueCat's payment method update flow
      // or integrate with Stripe/other payment processors
      window.open('https://billing.revenuecat.com/payment-methods', '_blank');
      return true;
    } catch (error) {
      console.error('Payment method update error:', error);
      throw new Error('Failed to update payment method');
    }
  }

  // Cancel subscription
  async cancelSubscription(): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('Simulating subscription cancellation');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }

    try {
      const response = await this.makeRevenueCatRequest('/subscriptions/cancel', {
        method: 'POST'
      });

      return response.success;
    } catch (error) {
      console.error('Cancellation error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  // Restore purchases (for mobile apps)
  async restorePurchases(userId: string) {
    if (!this.isConfigured) {
      console.log('Simulating purchase restoration');
      return {
        restored: true,
        activeSubscriptions: ['creator_pro_monthly']
      };
    }

    try {
      const response = await this.makeRevenueCatRequest(`/subscribers/${userId}/restore`);
      return response;
    } catch (error) {
      console.error('Restore purchases error:', error);
      return { restored: false, activeSubscriptions: [] };
    }
  }

  // Get available products/plans
  async getAvailableProducts() {
    if (!this.isConfigured) {
      return [
        {
          id: 'creator_pro_monthly',
          price: 29,
          currency: 'USD',
          period: 'monthly',
          title: 'Creator Pro Monthly'
        },
        {
          id: 'creator_pro_yearly',
          price: 290,
          currency: 'USD',
          period: 'yearly',
          title: 'Creator Pro Yearly'
        },
        {
          id: 'creator_studio_monthly',
          price: 99,
          currency: 'USD',
          period: 'monthly',
          title: 'Creator Studio Monthly'
        },
        {
          id: 'creator_studio_yearly',
          price: 990,
          currency: 'USD',
          period: 'yearly',
          title: 'Creator Studio Yearly'
        }
      ];
    }

    try {
      const response = await this.makeRevenueCatRequest('/products');
      return response.products;
    } catch (error) {
      console.error('Products fetch error:', error);
      return [];
    }
  }

  // Get customer info including purchase history
  async getCustomerInfo(userId: string) {
    if (!this.isConfigured) {
      return {
        userId,
        subscriptions: {
          creator_pro_monthly: {
            isActive: true,
            willRenew: true,
            periodType: 'normal',
            latestPurchaseDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        nonSubscriptionTransactions: [],
        firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    try {
      const response = await this.makeRevenueCatRequest(`/subscribers/${userId}`);
      return response.subscriber;
    } catch (error) {
      console.error('Customer info error:', error);
      return null;
    }
  }

  // Validate payment details
  validatePaymentDetails(paymentDetails: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Card number validation
    const cardNumber = paymentDetails.cardNumber?.replace(/\s/g, '') || '';
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      errors.push('Invalid card number');
    }
    
    // Expiry date validation
    const expiryDate = paymentDetails.expiryDate || '';
    if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
      errors.push('Invalid expiry date format (MM/YY)');
    } else {
      const [month, year] = expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        errors.push('Invalid expiry month');
      }
      
      if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        errors.push('Card has expired');
      }
    }
    
    // CVV validation
    const cvv = paymentDetails.cvv || '';
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      errors.push('Invalid CVV');
    }
    
    // Cardholder name validation
    if (!paymentDetails.cardholderName?.trim()) {
      errors.push('Cardholder name is required');
    }
    
    // Billing address validation
    const address = paymentDetails.billingAddress || {};
    if (!address.street?.trim()) errors.push('Street address is required');
    if (!address.city?.trim()) errors.push('City is required');
    if (!address.state?.trim()) errors.push('State is required');
    if (!address.zipCode?.trim()) errors.push('ZIP code is required');
    if (!address.country?.trim()) errors.push('Country is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Handle webhook events from RevenueCat
  async handleWebhook(event: any) {
    console.log('RevenueCat webhook received:', event.type);
    
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        console.log('New subscription started:', event.product_id);
        break;
      case 'RENEWAL':
        console.log('Subscription renewed:', event.product_id);
        break;
      case 'CANCELLATION':
        console.log('Subscription cancelled:', event.product_id);
        break;
      case 'EXPIRATION':
        console.log('Subscription expired:', event.product_id);
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }
  }

  // Private helper method for making API requests
  private async makeRevenueCatRequest(endpoint: string, options: RequestInit = {}) {
    const baseUrl = 'https://api.revenuecat.com/v1';
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`RevenueCat API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Check if RevenueCat is properly configured
  isReady(): boolean {
    return this.isConfigured;
  }

  // Get configuration status for debugging
  getConfigStatus() {
    return {
      configured: this.isConfigured,
      hasApiKey: !!this.apiKey,
      keyLength: this.apiKey.length
    };
  }
}

export const revenueCatService = new RevenueCatService();