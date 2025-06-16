import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Crown,
  X,
  Edit,
  Trash2,
  RefreshCw,
  DollarSign,
  FileText,
  Shield,
  ArrowRight,
  ArrowLeft,
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  Building
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { revenueCatService } from '../../lib/revenuecat';
import toast from 'react-hot-toast';

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export function BillingPage() {
  const { profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      // Load subscription info
      const subInfo = await revenueCatService.getSubscriptionStatus(profile?.id || '');
      setSubscriptionInfo(subInfo);

      // Mock billing history
      const mockHistory: BillingHistory[] = [
        {
          id: '1',
          date: new Date().toISOString(),
          amount: 29.00,
          status: 'paid',
          description: 'Creator Pro Monthly - January 2024',
          invoiceUrl: '#'
        },
        {
          id: '2',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 29.00,
          status: 'paid',
          description: 'Creator Pro Monthly - December 2023',
          invoiceUrl: '#'
        },
        {
          id: '3',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 29.00,
          status: 'paid',
          description: 'Creator Pro Monthly - November 2023',
          invoiceUrl: '#'
        }
      ];
      setBillingHistory(mockHistory);

      // Mock payment methods
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        }
      ];
      setPaymentMethods(mockPaymentMethods);

    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      await revenueCatService.cancelSubscription();
      
      // Update profile to reflect cancellation
      if (profile) {
        await updateProfile({ is_pro: false });
      }
      
      toast.success('Subscription cancelled successfully. You\'ll retain Pro features until the end of your billing period.');
      setShowCancelModal(false);
      loadBillingData();
    } catch (error) {
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradePlan = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would downgrade the plan
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (profile) {
        await updateProfile({ is_pro: false });
      }
      
      toast.success('Plan downgraded successfully. Changes will take effect at the next billing cycle.');
      setShowDowngradeModal(false);
      loadBillingData();
    } catch (error) {
      toast.error('Failed to downgrade plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setLoading(true);
    try {
      await revenueCatService.updatePaymentMethod();
      toast.success('Payment method updated successfully!');
      setShowPaymentMethodModal(false);
      loadBillingData();
    } catch (error) {
      toast.error('Failed to update payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (invoiceUrl: string) => {
    // In a real implementation, this would download the actual invoice
    toast.success('Invoice download started!');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: CreditCard },
    { id: 'billing', label: 'Billing History', icon: FileText },
    { id: 'payment', label: 'Payment Methods', icon: Settings },
  ];

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
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <div className="flex items-center space-x-3 mb-6">
          <motion.div 
            className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <CreditCard className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600">Manage your subscription, billing, and payment methods</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <motion.div 
            className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
              {profile?.is_pro && (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Pro Member</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-gray-900">
                  {profile?.is_pro ? 'Creator Pro' : 'Free Plan'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Billing Cycle</span>
                <span className="font-semibold text-gray-900">
                  {profile?.is_pro ? 'Monthly' : 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-gray-900">
                  {profile?.is_pro ? '$29.00/month' : 'Free'}
                </span>
              </div>
              
              {profile?.is_pro && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Next Billing Date</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-600">
                    {profile?.is_pro ? 'Active' : 'Free'}
                  </span>
                </div>
              </div>
            </div>

            {profile?.is_pro && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDowngradeModal(true)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Downgrade Plan
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg font-medium hover:bg-red-200 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="space-y-4"
            variants={itemVariants}
          >
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('payment')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Update Payment</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
                
                <button
                  onClick={() => setActiveTab('billing')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">View Invoices</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
                
                {!profile?.is_pro && (
                  <button
                    onClick={() => window.location.href = '/app/upgrade'}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors border border-purple-200"
                  >
                    <div className="flex items-center space-x-3">
                      <Crown className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Upgrade to Pro</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-purple-600" />
                  </button>
                )}
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Secure Billing</h4>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Your payment information is encrypted and secure. We use industry-standard security measures.
              </p>
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <span>SSL Encrypted</span>
                <span>•</span>
                <span>PCI Compliant</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Billing History Tab */}
      {activeTab === 'billing' && (
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
            <button className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium">
              <Download className="h-4 w-4" />
              <span>Export All</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((item) => (
                  <motion.tr 
                    key={item.id} 
                    className="border-b border-gray-100 hover:bg-gray-50"
                    whileHover={{ backgroundColor: '#f9fafb' }}
                  >
                    <td className="py-4 px-4 text-gray-900">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-gray-900">{item.description}</td>
                    <td className="py-4 px-4 text-gray-900 font-medium">
                      ${item.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'paid' 
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status === 'paid' && <CheckCircle className="h-3 w-3" />}
                        {item.status === 'pending' && <Clock className="h-3 w-3" />}
                        {item.status === 'failed' && <X className="h-3 w-3" />}
                        <span className="capitalize">{item.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {item.invoiceUrl && (
                        <button
                          onClick={() => downloadInvoice(item.invoiceUrl!)}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Download
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment' && (
        <motion.div 
          className="space-y-6"
          variants={itemVariants}
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
              <button
                onClick={() => setShowPaymentMethodModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Add Payment Method
              </button>
            </div>

            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <motion.div
                  key={method.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {method.brand} •••• {method.last4}
                        </span>
                        {method.isDefault && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll lose access to Pro features at the end of your current billing period.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Downgrade Plan Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Downgrade Plan</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Downgrading will limit your access to Pro features. Changes will take effect at your next billing cycle.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDowngradeModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Keep Pro
              </button>
              <button
                onClick={handleDowngradePlan}
                disabled={loading}
                className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : 'Downgrade to Free'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Payment Method</h3>
              <button
                onClick={() => setShowPaymentMethodModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              You'll be redirected to our secure payment processor to add a new payment method.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentMethodModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePaymentMethod}
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}