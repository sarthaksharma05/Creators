import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Crown, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for new creators getting started',
      price: { monthly: 0, annual: 0 },
      features: [
        '5 AI content generations per month',
        '2 voiceover minutes per month',
        'Basic trend insights',
        'Community support',
        'Standard templates'
      ],
      cta: 'Get Started Free',
      popular: false,
      gradient: 'from-gray-500 to-gray-600'
    },
    {
      name: 'Creator',
      description: 'For serious creators ready to scale',
      price: { monthly: 29, annual: 290 },
      features: [
        'Unlimited AI content generation',
        '60 voiceover minutes per month',
        'Advanced trend analysis',
        'Priority support',
        'Premium templates',
        'Brand partnership access',
        'Analytics dashboard',
        'Custom voice training'
      ],
      cta: 'Start Free Trial',
      popular: true,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Pro',
      description: 'For teams and agencies',
      price: { monthly: 99, annual: 990 },
      features: [
        'Everything in Creator',
        'Unlimited voiceover minutes',
        'White-label solutions',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced analytics',
        'Team collaboration tools',
        'Priority feature requests'
      ],
      cta: 'Contact Sales',
      popular: false,
      gradient: 'from-blue-500 to-cyan-500'
    }
  ];

  const faqs = [
    {
      question: 'Can I change my plan at any time?',
      answer: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the next billing cycle.'
    },
    {
      question: 'What happens if I exceed my usage limits?',
      answer: 'We\'ll notify you when you\'re approaching your limits. You can upgrade your plan or purchase additional credits as needed.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, we\'ll provide a full refund.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.'
    },
    {
      question: 'Can I use CreatorCopilot for commercial purposes?',
      answer: 'Absolutely! All content generated with CreatorCopilot can be used for commercial purposes without any additional licensing fees.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors w-fit"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Simple,
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {' '}Transparent Pricing
              </span>
            </h1>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto leading-relaxed mb-8">
              Choose the perfect plan for your creative journey. Start free and scale as you grow.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <span className={`text-lg ${!isAnnual ? 'text-white' : 'text-purple-300'}`}>Monthly</span>
              <motion.button
                className="relative w-16 h-8 bg-white/20 rounded-full border border-white/30"
                onClick={() => setIsAnnual(!isAnnual)}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  animate={{ x: isAnnual ? 32 : 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </motion.button>
              <span className={`text-lg ${isAnnual ? 'text-white' : 'text-purple-300'}`}>
                Annual
                <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">Save 20%</span>
              </span>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                className={`relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 ${
                  plan.popular ? 'ring-2 ring-purple-400 scale-105' : ''
                }`}
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

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-purple-200 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-white">
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-purple-200 ml-2">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    )}
                  </div>

                  <motion.button
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg`
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.cta}
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
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Why Choose CreatorCopilot?</h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              We're not just another AI tool. We're your creative partner, designed specifically for content creators.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Premium Quality</h3>
              <p className="text-purple-200">
                Our AI models are specifically trained on high-performing content, ensuring professional results every time.
              </p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Zap className="h-12 w-12 text-blue-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
              <p className="text-purple-200">
                Generate content in seconds, not hours. Our optimized infrastructure ensures rapid response times.
              </p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Star className="h-12 w-12 text-purple-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Creator-Focused</h3>
              <p className="text-purple-200">
                Built by creators, for creators. Every feature is designed to solve real content creation challenges.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-purple-200">
              Got questions? We've got answers.
            </p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-purple-200 leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-3xl p-12 border border-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Content?
            </h2>
            <p className="text-xl text-purple-200 mb-8">
              Join thousands of creators who are already using CreatorCopilot to scale their content and grow their audience.
            </p>
            <Link
              to="/"
              className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial
            </Link>
            <p className="text-purple-300 text-sm mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}