import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Crown, 
  Check, 
  X, 
  Calendar, 
  DollarSign,
  Download,
  Receipt,
  Shield,
  AlertCircle,
  Star,
  Zap,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Lock,
  Smartphone,
  Globe,
  Users,
  TrendingUp,
  Award,
  Gift,
  Plus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { revenueCatService } from '../../lib/revenuecat';
import toast from 'react-hot-toast';

interface BillingInfo {
  currentPlan: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  amount: number;
  paymentMethod: {
    type: 'card' | 'paypal' | 'apple' | 'google';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  invoices: Invoice[];
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl?: string;
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started',
    features: [
      '5 AI content generations/month',
      '2 voiceover minutes/month',
      'Basic trend insights',
      'Community support',
      'Standard templates'
    ],
    limitations: [
      'Limited generations',
      'Basic features only',
      'Community support only'
    ],
    popular: false,
    current: false
  },
  {
    id: 'creator_pro',
    name: 'Creator Pro',
    price: { monthly: 29, yearly: 290 },
    description: 'For serious content creators',
    features: [
      'Unlimited AI content generation',
      '60 voiceover minutes/month',
      'AI video creation (10 videos/month)',
      'Advanced trend analysis',
      'Priority support',
      'Premium templates',
      'Brand partnership access',
      'Advanced analytics',
      'Custom voice training',
      'Export in multiple formats',
      'Team collaboration (3 members)'
    ],
    limitations: [],
    popular: true,
    current: false
  },
  {
    id: 'creator_studio',
    name: 'Creator Studio',
    price: { monthly: 99, yearly: 990 },
    description: 'For agencies and teams',
    features: [
      'Everything in Creator Pro',
      'Unlimited AI video creation',
      'Unlimited voiceover minutes',
      'White-label solutions',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced team collaboration',
      'Priority feature requests',
      'Custom brand templates',
      'Advanced analytics & reporting',
      '1-on-1 strategy sessions',
      'Unlimited team members'
    ],
    limitations: [],
    popular: false,
    current: false
  }
];

export function BillingPage() {
  const { profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'payment' | 'invoices'>('overview');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState<'plan' | 'payment' | 'processing' | 'success'>('plan');
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });

  useEffect(() => {
    loadBillingInfo();
  }, []);

  const loadBillingInfo = async () => {
    try {
      // Mock billing data - in production this would come from RevenueCat
      const mockBillingInfo: BillingInfo = {
        currentPlan: profile?.is_pro ? 'creator_pro' : 'starter',
        billingCycle: 'monthly',
        nextBillingDate: '2024-02-15',
        amount: profile?.is_pro ? 29 : 0,
        paymentMethod: {
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025
        },
        invoices: [
          {
            id: 'inv_001',
            date: '2024-01-15',
            amount: 29,
            status: 'paid',
            downloadUrl: '#'
          },
          {
            id: 'inv_002',
            date: '2023-12-15',
            amount: 29,
            status: 'paid',
            downloadUrl: '#'
          }
        ]
      };
      setBillingInfo(mockBillingInfo);
    } catch (error) {
      console.error('Error loading billing info:', error);
    }
  };

  const handlePlanSelection = (planId: string) => {
    if (planId === billingInfo?.currentPlan) {
      toast.info('This is your current plan');
      return;
    }

    setSelectedPlan(planId);
    setPaymentStep('plan');
    setShowPaymentModal(true);
  };

  const proceedToPayment = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan || plan.price.monthly === 0) {
      // Free plan - no payment needed
      handlePlanUpgrade();
      return;
    }
    setPaymentStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate payment form
    if (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv || !paymentForm.cardholderName) {
      toast.error('Please fill in all payment details');
      return;
    }

    setPaymentStep('processing');
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Process the upgrade
      await handlePlanUpgrade();
      
      setPaymentStep('success');
      
      // Auto-close after success
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentStep('plan');
      }, 2000);
      
    } catch (error) {
      setPaymentStep('payment');
      toast.error('Payment failed. Please try again.');
    }
  };

  const handlePlanUpgrade = async () => {
    setLoading(true);
    try {
      // Process with RevenueCat
      const success = await revenueCatService.purchasePlan(selectedPlan, billingCycle);
      
      if (success) {
        // Update user profile
        await updateProfile({ is_pro: selectedPlan !== 'starter' });
        
        toast.success('🎉 Plan upgraded successfully!');
        loadBillingInfo();
      }
    } catch (error) {
      toast.error('Failed to upgrade plan. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      await revenueCatService.cancelSubscription();
      toast.success('Subscription cancelled. You\'ll retain access until the end of your billing period.');
      setShowCancelModal(false);
      loadBillingInfo();
    } catch (error) {
      toast.error('Failed to cancel subscription. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      await revenueCatService.updatePaymentMethod();
      toast.success('Payment method updated successfully!');
      loadBillingInfo();
    } catch (error) {
      toast.error('Failed to update payment method.');
    }
  };

  const downloadInvoice = (invoice: Invoice) => {
    // In production, this would download the actual invoice
    toast.success('Invoice download started');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const currentPlan = plans.find(p => p.id === billingInfo?.currentPlan);
  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const savings = billingCycle === 'yearly' ? 20 : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4 mb-6">
            <motion.div 
              className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <CreditCard className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Billing & Subscription</h1>
              <p className="text-gray-600 text-lg">Manage your subscription, payment methods, and billing history</p>
            </div>
          </div>

          {/* Current Plan Status */}
          <motion.div 
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${
                  profile?.is_pro 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-600'
                }`}>
                  {profile?.is_pro ? (
                    <Crown className="h-6 w-6 text-white" />
                  ) : (
                    <Star className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {currentPlan?.name || 'Starter'} Plan
                  </h3>
                  <p className="text-gray-600">{currentPlan?.description}</p>
                  {billingInfo && billingInfo.amount > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Next billing: {new Date(billingInfo.nextBillingDate).toLocaleDateString()} 
                      • ${billingInfo.amount}/{billingInfo.billingCycle === 'yearly' ? 'year' : 'month'}
                    </p>
                  )}
                </div>
              </div>
              
              {!profile?.is_pro && (
                <motion.button
                  onClick={() => handlePlanSelection('creator_pro')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Crown className="h-5 w-5" />
                  <span>Upgrade Now</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: DollarSign },
                { id: 'plans', label: 'Plans & Pricing', icon: Crown },
                { id: 'payment', label: 'Payment Methods', icon: CreditCard },
                { id: 'invoices', label: 'Billing History', icon: Receipt }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div variants={itemVariants}>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Usage Stats */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Current Usage</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">AI Content Generation</span>
                          <span className="text-sm text-gray-500">
                            {profile?.is_pro ? 'Unlimited' : '3/5 used'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            style={{ width: profile?.is_pro ? '100%' : '60%' }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Voiceover Minutes</span>
                          <span className="text-sm text-gray-500">
                            {profile?.is_pro ? 'Unlimited' : '1.2/2 used'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                            style={{ width: profile?.is_pro ? '100%' : '60%' }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">AI Videos</span>
                          <span className="text-sm text-gray-500">
                            {profile?.is_pro ? '7/10 used' : 'Pro only'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                            style={{ width: profile?.is_pro ? '70%' : '0%' }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Team Members</span>
                          <span className="text-sm text-gray-500">
                            {profile?.is_pro ? '1/3 used' : 'Pro only'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                            style={{ width: profile?.is_pro ? '33%' : '0%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                  
                  <div className="space-y-4">
                    {[
                      { action: 'Generated AI content', time: '2 hours ago', type: 'content' },
                      { action: 'Created voiceover', time: '1 day ago', type: 'voice' },
                      { action: 'Upgraded to Pro', time: '3 days ago', type: 'billing' },
                      { action: 'Generated AI video', time: '5 days ago', type: 'video' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'content' ? 'bg-purple-100 text-purple-600' :
                          activity.type === 'voice' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'billing' ? 'bg-green-100 text-green-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {activity.type === 'content' && <Zap className="h-5 w-5" />}
                          {activity.type === 'voice' && <Smartphone className="h-5 w-5" />}
                          {activity.type === 'billing' && <Crown className="h-5 w-5" />}
                          {activity.type === 'video' && <Globe className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                  
                  <div className="space-y-4">
                    {!profile?.is_pro && (
                      <motion.button
                        onClick={() => handlePlanSelection('creator_pro')}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-between"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <Crown className="h-6 w-6" />
                          <span>Upgrade to Pro</span>
                        </div>
                        <ArrowRight className="h-5 w-5" />
                      </motion.button>
                    )}

                    <button
                      onClick={handleUpdatePaymentMethod}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-xl font-semibold transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-6 w-6" />
                        <span>Update Payment</span>
                      </div>
                      <ArrowRight className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => setActiveTab('invoices')}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-xl font-semibold transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Receipt className="h-6 w-6" />
                        <span>View Invoices</span>
                      </div>
                      <ArrowRight className="h-5 w-5" />
                    </button>

                    {profile?.is_pro && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 p-4 rounded-xl font-semibold transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <X className="h-6 w-6" />
                          <span>Cancel Subscription</span>
                        </div>
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Support */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h3>
                  <p className="text-gray-600 mb-4">
                    Our support team is here to help with any billing questions.
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5" />
                    <span>Contact Support</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div>
              {/* Billing Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <span className={`font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                      Monthly
                    </span>
                    <motion.button
                      onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                      className="relative w-16 h-8 bg-gray-200 rounded-full"
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="absolute top-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg"
                        animate={{ x: billingCycle === 'yearly' ? 32 : 4 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </motion.button>
                    <span className={`font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                      Yearly
                      <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Save {savings}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all ${
                      plan.popular 
                        ? 'border-purple-500 ring-4 ring-purple-100' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${billingInfo?.currentPlan === plan.id ? 'ring-4 ring-green-100 border-green-500' : ''}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span>Most Popular</span>
                        </div>
                      </div>
                    )}

                    {billingInfo?.currentPlan === plan.id && (
                      <div className="absolute -top-4 right-4">
                        <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                          <Check className="h-4 w-4" />
                          <span>Current</span>
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-6">{plan.description}</p>
                      
                      <div className="mb-6">
                        <span className="text-5xl font-bold text-gray-900">
                          ${billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly}
                        </span>
                        {plan.price.monthly > 0 && (
                          <span className="text-gray-500 ml-2">
                            /{billingCycle === 'yearly' ? 'year' : 'month'}
                          </span>
                        )}
                      </div>

                      {billingCycle === 'yearly' && plan.price.monthly > 0 && (
                        <p className="text-sm text-green-600 font-medium mb-4">
                          Save ${(plan.price.monthly * 12) - plan.price.yearly} per year
                        </p>
                      )}

                      <motion.button
                        onClick={() => handlePlanSelection(plan.id)}
                        disabled={billingInfo?.currentPlan === plan.id}
                        className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                          billingInfo?.currentPlan === plan.id
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : plan.popular
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                        whileHover={billingInfo?.currentPlan !== plan.id ? { scale: 1.02 } : {}}
                        whileTap={billingInfo?.currentPlan !== plan.id ? { scale: 0.98 } : {}}
                      >
                        {billingInfo?.currentPlan === plan.id 
                          ? 'Current Plan' 
                          : plan.price.monthly === 0 
                          ? 'Downgrade' 
                          : 'Select Plan'
                        }
                      </motion.button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Features included:</h4>
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                      
                      {plan.limitations.length > 0 && (
                        <>
                          <h4 className="font-semibold text-gray-900 mt-6">Limitations:</h4>
                          {plan.limitations.map((limitation, limitIndex) => (
                            <div key={limitIndex} className="flex items-center space-x-3">
                              <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                              <span className="text-gray-700">{limitation}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Current Payment Method */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Methods</h3>
                
                {billingInfo?.paymentMethod && (
                  <div className="border border-gray-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {billingInfo.paymentMethod.brand} •••• {billingInfo.paymentMethod.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires {billingInfo.paymentMethod.expiryMonth}/{billingInfo.paymentMethod.expiryYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Primary
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpdatePaymentMethod}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Payment Method</span>
                </button>
              </div>

              {/* Security & Trust */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Security & Trust</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">SSL Encrypted</p>
                      <p className="text-sm text-green-700">Your payment data is secure</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Lock className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">PCI Compliant</p>
                      <p className="text-sm text-blue-700">Industry standard security</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Award className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">RevenueCat Powered</p>
                      <p className="text-sm text-purple-700">Trusted by thousands of apps</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Accepted Payment Methods</h4>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div className="w-10 h-6 bg-red-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MC</span>
                    </div>
                    <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AMEX</span>
                    </div>
                    <div className="w-10 h-6 bg-yellow-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Billing History</h3>
                <button className="text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Download All</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingInfo?.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-900">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          Creator Pro Subscription
                        </td>
                        <td className="py-4 px-4 text-gray-900 font-semibold">
                          ${invoice.amount}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => downloadInvoice(invoice)}
                            className="text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {paymentStep === 'plan' && (
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Confirm Your Plan</h3>
                
                {selectedPlanData && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-900">{selectedPlanData.name}</h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ${billingCycle === 'yearly' ? selectedPlanData.price.yearly : selectedPlanData.price.monthly}
                        </div>
                        <div className="text-sm text-gray-600">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{selectedPlanData.description}</p>
                    
                    {billingCycle === 'yearly' && selectedPlanData.price.monthly > 0 && (
                      <div className="bg-green-100 text-green-800 p-3 rounded-lg text-sm">
                        💰 You'll save ${(selectedPlanData.price.monthly * 12) - selectedPlanData.price.yearly} per year with annual billing!
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-100 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={proceedToPayment}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    {selectedPlanData?.price.monthly === 0 ? 'Confirm Downgrade' : 'Continue to Payment'}
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'payment' && (
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h3>
                
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  {/* Card Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Card Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm({
                          ...paymentForm,
                          cardNumber: formatCardNumber(e.target.value)
                        })}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={paymentForm.expiryDate}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            expiryDate: formatExpiryDate(e.target.value)
                          })}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={paymentForm.cvv}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                          })}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={paymentForm.cardholderName}
                        onChange={(e) => setPaymentForm({
                          ...paymentForm,
                          cardholderName: e.target.value
                        })}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Billing Address</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={paymentForm.billingAddress.street}
                        onChange={(e) => setPaymentForm({
                          ...paymentForm,
                          billingAddress: { ...paymentForm.billingAddress, street: e.target.value }
                        })}
                        placeholder="123 Main St"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={paymentForm.billingAddress.city}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            billingAddress: { ...paymentForm.billingAddress, city: e.target.value }
                          })}
                          placeholder="New York"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={paymentForm.billingAddress.state}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            billingAddress: { ...paymentForm.billingAddress, state: e.target.value }
                          })}
                          placeholder="NY"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={paymentForm.billingAddress.zipCode}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            billingAddress: { ...paymentForm.billingAddress, zipCode: e.target.value }
                          })}
                          placeholder="10001"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          value={paymentForm.billingAddress.country}
                          onChange={(e) => setPaymentForm({
                            ...paymentForm,
                            billingAddress: { ...paymentForm.billingAddress, country: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AU">Australia</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">{selectedPlanData?.name} ({billingCycle})</span>
                      <span className="font-semibold">
                        ${billingCycle === 'yearly' ? selectedPlanData?.price.yearly : selectedPlanData?.price.monthly}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && selectedPlanData && selectedPlanData.price.monthly > 0 && (
                      <div className="flex justify-between items-center mb-2 text-green-600">
                        <span>Annual Discount</span>
                        <span>-${(selectedPlanData.price.monthly * 12) - selectedPlanData.price.yearly}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>Total</span>
                        <span>
                          ${billingCycle === 'yearly' ? selectedPlanData?.price.yearly : selectedPlanData?.price.monthly}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setPaymentStep('plan')}
                      className="flex-1 bg-gray-100 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      Complete Purchase
                    </button>
                  </div>
                </form>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h3>
                  <p className="text-gray-600">Please wait while we process your payment securely...</p>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm font-medium">Secured by RevenueCat & Stripe</span>
                  </div>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600">Welcome to {selectedPlanData?.name}! Your new features are now active.</p>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-green-800 font-medium">🎉 You now have access to all Pro features!</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold text-gray-900">Cancel Subscription</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll lose access to Pro features 
              at the end of your current billing period.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}