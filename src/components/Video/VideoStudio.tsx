import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Clock, 
  Crown,
  AlertCircle,
  Sparkles,
  Rocket,
  Star,
  Calendar,
  ExternalLink,
  Mail,
  Bell,
  Zap,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export function VideoStudio() {
  const { profile } = useAuth();
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [email, setEmail] = useState(profile?.email || '');
  const [notifying, setNotifying] = useState(false);
  
  const handleNotifyMe = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setNotifying(true);
    try {
      // Simulate API call to save notification preference
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Great! We\'ll notify you when AI Video Studio launches');
      setShowNotifyModal(false);
    } catch (error) {
      toast.error('Failed to save notification preference');
    } finally {
      setNotifying(false);
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI Avatar Videos',
      description: 'Create professional videos with realistic AI avatars that speak your script',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Star,
      title: 'Custom Backgrounds',
      description: 'Choose from a variety of professional settings or use your own background',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Automatic Subtitles',
      description: 'Add perfectly synchronized captions in multiple styles and languages',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Crown,
      title: 'Pro Editing Tools',
      description: 'Fine-tune your videos with professional editing tools and effects',
      color: 'from-orange-500 to-red-500'
    }
  ];

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
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
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
            className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Video className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Video Studio</h1>
            <p className="text-gray-600">Create professional videos with AI avatars powered by Tavus</p>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-200">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Coming Soon!</h2>
                <p className="text-gray-600">We're putting the finishing touches on our AI Video Studio</p>
              </div>
            </div>
            
            <motion.button
              onClick={() => setShowNotifyModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Notify Me When It's Ready
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Features Preview */}
      <motion.div 
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">What's Coming in AI Video Studio</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              whileHover={{ y: -5 }}
              variants={itemVariants}
            >
              <motion.div 
                className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </motion.div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div 
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Launch Timeline</h2>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-8">
            <div className="relative flex items-start">
              <div className="absolute left-8 top-0 -ml-3.5 h-7 w-7 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div className="ml-16">
                <h3 className="text-lg font-semibold text-gray-900">Development Started</h3>
                <p className="text-gray-600 mb-2">Our team began building the AI Video Studio</p>
                <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="absolute left-8 top-0 -ml-3.5 h-7 w-7 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div className="ml-16">
                <h3 className="text-lg font-semibold text-gray-900">Alpha Testing</h3>
                <p className="text-gray-600 mb-2">Internal testing and quality assurance</p>
                <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="absolute left-8 top-0 -ml-3.5 h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="ml-16">
                <h3 className="text-lg font-semibold text-gray-900">Beta Testing</h3>
                <p className="text-gray-600 mb-2">Limited access for select users</p>
                <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>In Progress</span>
                </div>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="absolute left-8 top-0 -ml-3.5 h-7 w-7 rounded-full bg-gray-300 flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="ml-16">
                <h3 className="text-lg font-semibold text-gray-900">Public Launch</h3>
                <p className="text-gray-600 mb-2">Available to all CreatorCopilot users</p>
                <div className="inline-flex items-center space-x-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Early Access */}
      <motion.div 
        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-8 border border-purple-200"
        variants={itemVariants}
      >
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Want Early Access?</h2>
            <p className="text-gray-700 max-w-xl">
              Pro members will get early access to the AI Video Studio before the public launch. 
              Upgrade today to be among the first to create amazing AI videos!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              onClick={() => setShowNotifyModal(true)}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Notify Me
            </motion.button>
            
            {!profile?.is_pro && (
              <Link to="/app/upgrade">
                <motion.button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Upgrade to Pro
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Notify Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Notified</h3>
              <p className="text-gray-600">
                We'll let you know as soon as the AI Video Studio is ready for you to use.
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="updates"
                  className="mt-1"
                  defaultChecked
                />
                <label htmlFor="updates" className="text-sm text-gray-600">
                  Also send me updates about new features and improvements to CreatorCopilot
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNotifyModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNotifyMe}
                disabled={notifying}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {notifying ? 'Saving...' : 'Notify Me'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}