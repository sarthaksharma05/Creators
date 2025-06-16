import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Zap, Star, Check, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { stripeService } from '../../lib/stripe';
import toast from 'react-hot-toast';

const creatorCopilotPlans = [
  {
    name: "STARTER",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "5 AI content generations per month",
      "2 voiceover minutes per month",
      "Basic trend insights",
      "Community support",
      "Standard templates",
      "Basic analytics"
    ],
    description: "Perfect for creators just getting started",
    buttonText: "Current Plan",
    href: "/app/dashboard",
    isPopular: false,
  },
  {
    name: "CREATOR PRO",
    price: "29",
    yearlyPrice: "23",
    period: "per month",
    features: [
      "Unlimited AI content generation",
      "60 voiceover minutes per month",
      "AI video creation (10 videos/month)",
      "Advanced trend analysis",
      "Priority support",
      "Premium templates",
      "Brand partnership access",
      "Advanced analytics dashboard",
      "Custom voice training",
      "Export in multiple formats",
      "Team collaboration (up to 3 members)"
    ],
    description: "Ideal for serious creators ready to scale",
    buttonText: "Upgrade to Pro",
    href: "#upgrade-pro",
    isPopular: true,
  },
  {
    name: "CREATOR STUDIO",
    price: "99",
    yearlyPrice: "79",
    period: "per month",
    features: [
      "Everything in Creator Pro",
      "Unlimited AI video creation",
      "Unlimited voiceover minutes",
      "White-label solutions",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced team collaboration",
      "Priority feature requests",
      "Custom brand templates",
      "Advanced analytics & reporting",
      "1-on-1 strategy sessions"
    ],
    description: "For agencies and large creator teams",
    buttonText: "Contact Sales",
    href: "/contact",
    isPopular: false,
  },
];

const proFeatures = [
  {
    icon: Zap,
    title: 'Unlimited AI Content',
    description: 'Generate unlimited scripts, captions, and ideas with our advanced AI models',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Crown,
    title: 'Premium Voice Library',
    description: 'Access to 100+ premium voices and custom voice training capabilities',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Star,
    title: 'AI Video Creation',
    description: 'Create professional videos with AI avatars and custom backgrounds',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Sparkles,
    title: 'Advanced Analytics',
    description: 'Deep insights into content performance and audience engagement',
    gradient: 'from-green-500 to-emerald-500'
  }
];

export function UpgradePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);

  const handleUpgrade = async (planName: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    try {
      setRedirectingToCheckout(true);
      
      // Get the Stripe price ID based on the plan and billing cycle
      let priceId;
      if (planName === 'CREATOR PRO') {
        priceId = `price_creator_pro_${billingCycle}`;
      } else if (planName === 'CREATOR STUDIO') {
        priceId = `price_creator_studio_${billingCycle}`;
      } else {
        throw new Error('Invalid plan selected');
      }
      
      // Create a checkout session with Stripe
      const checkoutUrl = await stripeService.createCheckoutSession(priceId);
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to start checkout process');
      setRedirectingToCheckout(false);
    }
  };

  // Handle clicks on pricing plan buttons
  const handlePlanClick = (e: React.MouseEvent, plan: any) => {
    e.preventDefault();
    
    if (plan.href === '#upgrade-pro') {
      handleUpgrade('CREATOR PRO');
    } else if (plan.href === '/contact') {
      navigate('/contact');
    } else if (plan.href === '/app/dashboard') {
      navigate('/app/dashboard');
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/app/dashboard" 
            className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors w-fit"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              variants={itemVariants}
            >
              <motion.div
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                <Crown className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-medium">Upgrade Your Creative Power</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Unlock Your
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {' '}Full Potential
                </span>
              </h1>
              <p className="text-xl text-purple-200 max-w-3xl mx-auto leading-relaxed">
                Take your content creation to the next level with unlimited AI generations, 
                premium features, and priority support.
              </p>
            </motion.div>

            {/* Current Plan Status */}
            {profile && (
              <motion.div
                className="max-w-2xl mx-auto mb-16"
                variants={itemVariants}
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      {profile.subscription_tier !== 'free' ? (
                        <Crown className="h-6 w-6 text-white" />
                      ) : (
                        <Star className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {profile.full_name || 'Creator'}
                      </h3>
                      <p className="text-purple-200">
                        {profile.subscription_tier === 'free' ? 'Free Plan' : 
                         profile.subscription_tier === 'pro' ? 'Pro Member' : 'Studio Member'}
                      </p>
                    </div>
                  </div>
                  {profile.subscription_tier === 'free' ? (
                    <p className="text-purple-200 mb-4">
                      You're currently on the free plan. Upgrade to unlock unlimited features!
                    </p>
                  ) : (
                    <div>
                      <p className="text-green-300 mb-4">
                        🎉 You're a {profile.subscription_tier === 'pro' ? 'Pro' : 'Studio'} member! Enjoy unlimited access to all features.
                      </p>
                      <Link
                        to="/app/billing"
                        className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors text-white"
                      >
                        <span>Manage Billing</span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Pro Features Showcase */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              variants={itemVariants}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Why Upgrade to Pro?
              </h2>
              <p className="text-xl text-purple-200 max-w-3xl mx-auto">
                Unlock powerful features designed to accelerate your content creation and grow your audience.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {proFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-purple-200 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={itemVariants}>
              {/* Custom Pricing Component with Click Handlers */}
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-white">
                  Choose Your Plan
                </h2>
                <p className="text-purple-200 text-lg">
                  Start free and upgrade when you're ready to scale your content creation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {creatorCopilotPlans.map((plan, index) => (
                  <motion.div
                    key={index}
                    className={`relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 ${
                      plan.isPopular ? 'ring-2 ring-purple-400 scale-105' : ''
                    }`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span>Most Popular</span>
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-purple-200 mb-6">{plan.description}</p>
                      
                      <div className="mb-6">
                        <span className="text-5xl font-bold text-white">${plan.price}</span>
                        {plan.price !== '0' && (
                          <span className="text-purple-200 ml-2">/{plan.period}</span>
                        )}
                      </div>

                      <motion.button
                        onClick={(e) => handlePlanClick(e, plan)}
                        className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                          plan.isPopular
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        } ${profile?.subscription_tier !== 'free' && plan.name === 'CREATOR PRO' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={profile?.subscription_tier !== 'free' && plan.name === 'CREATOR PRO' || redirectingToCheckout}
                      >
                        {redirectingToCheckout && plan.name === 'CREATOR PRO' ? 'Redirecting...' : 
                         profile?.subscription_tier !== 'free' && plan.name === 'CREATOR PRO' ? 'Current Plan' : plan.buttonText}
                      </motion.button>
                    </div>

                    <div className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="text-purple-200">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              variants={itemVariants}
            >
              <h2 className="text-4xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  question: 'Can I cancel my subscription at any time?',
                  answer: 'Yes! You can cancel your subscription at any time. Your Pro features will remain active until the end of your billing period.'
                },
                {
                  question: 'What happens to my content if I downgrade?',
                  answer: 'All your existing content remains accessible. You\'ll just be limited to the free plan\'s monthly generation limits going forward.'
                },
                {
                  question: 'Do you offer refunds?',
                  answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, we\'ll provide a full refund.'
                },
                {
                  question: 'Can I upgrade or downgrade my plan?',
                  answer: 'Absolutely! You can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle.'
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                  <p className="text-purple-200 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {profile?.subscription_tier === 'free' && (
          <section className="py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-3xl p-12 border border-white/20"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <h2 className="text-4xl font-bold text-white mb-6">
                  Ready to Transform Your Content?
                </h2>
                <p className="text-xl text-purple-200 mb-8">
                  Join thousands of creators who have already upgraded to Pro and are creating amazing content.
                </p>
                <motion.button
                  onClick={() => handleUpgrade('CREATOR PRO')}
                  disabled={redirectingToCheckout}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2 disabled:opacity-70"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Crown className="h-5 w-5" />
                  <span>{redirectingToCheckout ? 'Redirecting...' : 'Upgrade to Pro Now'}</span>
                </motion.button>
                <p className="text-purple-300 text-sm mt-4">
                  30-day money-back guarantee • Cancel anytime
                </p>
              </motion.div>
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
}