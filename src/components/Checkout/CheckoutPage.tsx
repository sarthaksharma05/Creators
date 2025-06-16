import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  CreditCard, 
  Lock, 
  ArrowLeft, 
  Check, 
  Crown, 
  Shield,
  AlertCircle,
  Loader,
  Star,
  Zap,
  Users,
  Building,
  MapPin,
  Mail,
  User
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { stripeService } from '../../lib/stripe';
import toast from 'react-hot-toast';

interface CheckoutFormData {
  email: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
}

const plans = [
  {
    id: 'creator_pro',
    name: 'Creator Pro',
    description: 'Perfect for serious content creators',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      'Unlimited AI content generation',
      '60 voiceover minutes per month',
      'AI video creation (10 videos/month)',
      'Advanced trend analysis',
      'Priority support',
      'Premium templates',
      'Brand partnership access',
      'Advanced analytics dashboard'
    ],
    popular: true
  },
  {
    id: 'creator_studio',
    name: 'Creator Studio',
    description: 'For agencies and large teams',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      'Everything in Creator Pro',
      'Unlimited AI video creation',
      'Unlimited voiceover minutes',
      'White-label solutions',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced team collaboration'
    ],
    popular: false
  }
];

export function CheckoutPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [redirectingToStripe, setRedirectingToStripe] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CheckoutFormData>({
    defaultValues: {
      email: profile?.email || '',
      planId: searchParams.get('plan') || 'creator_pro',
      billingCycle: (searchParams.get('cycle') as 'monthly' | 'yearly') || 'monthly',
    }
  });

  useEffect(() => {
    const planId = searchParams.get('plan') || 'creator_pro';
    const cycle = (searchParams.get('cycle') as 'monthly' | 'yearly') || 'monthly';
    
    const plan = plans.find(p => p.id === planId) || plans[0];
    setSelectedPlan(plan);
    setBillingCycle(cycle);
    setValue('planId', plan.id);
    setValue('billingCycle', cycle);
  }, [searchParams, setValue]);

  const getCurrentPrice = () => {
    return billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
  };

  const getSavings = () => {
    const monthlyTotal = selectedPlan.monthlyPrice * 12;
    const yearlyPrice = selectedPlan.yearlyPrice;
    return monthlyTotal - yearlyPrice;
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true);
    try {
      // Get the Stripe price ID based on the selected plan and billing cycle
      const priceId = `price_${data.planId}_${data.billingCycle}`;
      
      // Create a checkout session with Stripe
      setRedirectingToStripe(true);
      const checkoutUrl = await stripeService.createCheckoutSession(priceId);
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      setRedirectingToStripe(false);
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/app/upgrade" 
              className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Plans</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CreatorCopilot Checkout</span>
            </div>
          </div>
        </div>
      </header>

      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 h-fit"
            variants={itemVariants}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>
            
            {/* Selected Plan */}
            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedPlan.name}</h3>
                    <p className="text-purple-200 text-sm">{selectedPlan.description}</p>
                  </div>
                </div>
                {selectedPlan.popular && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                    POPULAR
                  </div>
                )}
              </div>
              
              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Save ${getSavings()}
                  </span>
                </button>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {selectedPlan.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-purple-200 text-sm">{feature}</span>
                  </div>
                ))}
                {selectedPlan.features.length > 4 && (
                  <p className="text-purple-300 text-sm">
                    +{selectedPlan.features.length - 4} more features
                  </p>
                )}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-purple-200">
                  {selectedPlan.name} ({billingCycle})
                </span>
                <span className="text-white font-semibold">
                  ${getCurrentPrice()}.00
                </span>
              </div>
              
              {billingCycle === 'yearly' && (
                <div className="flex justify-between text-green-400">
                  <span>Annual Savings</span>
                  <span>-${getSavings()}.00</span>
                </div>
              )}
              
              <div className="border-t border-white/20 pt-4">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>${getCurrentPrice()}.00</span>
                </div>
                <p className="text-purple-200 text-sm mt-1">
                  Billed {billingCycle}
                </p>
              </div>
            </div>

            {/* Security Badge */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-white font-medium text-sm">Secure Checkout</p>
                  <p className="text-purple-200 text-xs">
                    256-bit SSL encryption • PCI DSS compliant
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Checkout Form */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Complete Your Purchase</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                
                <div>
                  <label className="block text-white font-medium mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                    <input
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-200 text-sm">
                        You'll be redirected to our secure payment processor to complete your purchase. 
                        Your subscription will begin immediately after payment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Link
                    to="/app/upgrade"
                    className="flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Link>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {redirectingToStripe ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Redirecting to Secure Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Proceed to Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </form>

            {/* Security Footer */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex items-center justify-center space-x-6 text-purple-200 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>PCI Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Trusted by 100K+ creators</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}