import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Lightbulb, 
  Mic, 
  Video,
  Briefcase, 
  Crown,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  Zap,
  Play,
  Users,
  Star,
  Award,
  Target
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { tavusService } from '../../lib/tavus';

export function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    contentGenerated: 0,
    voiceoversCreated: 0,
    videosCreated: 0,
    campaignsApplied: 0,
    trendsViewed: 0,
  });

  useEffect(() => {
    loadDashboardStats();
    // Send weekly Tavus message (this would typically be done via a cron job)
    if (profile?.niche) {
      tavusService.sendWeeklyMessage(
        profile.id, 
        profile.niche, 
        profile.full_name
      );
    }
  }, [profile]);

  const loadDashboardStats = async () => {
    if (!profile) return;

    try {
      const [contentData, voiceoverData, applicationData] = await Promise.all([
        supabase
          .from('generated_content')
          .select('id')
          .eq('user_id', profile.id),
        supabase
          .from('voiceovers')
          .select('id')
          .eq('user_id', profile.id),
        supabase
          .from('campaign_applications')
          .select('id')
          .eq('creator_id', profile.id),
      ]);

      setStats({
        contentGenerated: contentData.data?.length || 0,
        voiceoversCreated: voiceoverData.data?.length || 0,
        videosCreated: 3, // Mock data for videos
        campaignsApplied: applicationData.data?.length || 0,
        trendsViewed: 12, // This would be tracked in analytics
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const handleUpgradeClick = () => {
    navigate('/app/upgrade');
  };

  const quickActions = [
    {
      title: 'AI Content Generator',
      description: 'Create scripts, captions, and ideas with GPT-4',
      icon: Lightbulb,
      href: '/app/content',
      color: 'from-primary-500 to-purple-600',
      features: ['YouTube Scripts', 'Instagram Captions', 'Hashtag Suggestions', 'Content Ideas']
    },
    {
      title: 'Voiceover Studio',
      description: 'Turn text into professional audio with ElevenLabs',
      icon: Mic,
      href: '/app/voiceovers',
      color: 'from-secondary-500 to-cyan-500',
      features: ['Multiple Voices', 'High Quality Audio', 'Download & Share', 'Custom Scripts']
    },
    {
      title: 'AI Video Creator',
      description: 'Generate videos with AI avatars using Tavus',
      icon: Video,
      href: '/app/videos',
      color: 'from-purple-500 to-pink-500',
      features: ['AI Avatars', 'Custom Backgrounds', 'Auto Subtitles', 'Professional Quality']
    },
    {
      title: 'TrendRadar',
      description: 'Discover trending topics with AI insights',
      icon: TrendingUp,
      href: '/app/trends',
      color: 'from-accent-500 to-orange-500',
      features: ['Trending Topics', 'Niche Analysis', 'Content Opportunities', 'Market Insights']
    },
    {
      title: 'Campaign Marketplace',
      description: 'Connect with brands and monetize content',
      icon: Briefcase,
      href: '/app/campaigns',
      color: 'from-success-500 to-emerald-500',
      features: ['Brand Partnerships', 'Campaign Applications', 'Revenue Opportunities', 'Creator Network']
    },
  ];

  const statCards = [
    {
      title: 'Content Generated',
      value: stats.contentGenerated,
      icon: Lightbulb,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      change: '+12%',
    },
    {
      title: 'Voiceovers Created',
      value: stats.voiceoversCreated,
      icon: Mic,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
      change: '+8%',
    },
    {
      title: 'AI Videos Made',
      value: stats.videosCreated,
      icon: Video,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+25%',
    },
    {
      title: 'Campaigns Applied',
      value: stats.campaignsApplied,
      icon: Briefcase,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
      change: '+15%',
    },
    {
      title: 'Trends Explored',
      value: stats.trendsViewed,
      icon: TrendingUp,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100',
      change: '+18%',
    },
  ];

  const recentActivity = [
    {
      type: 'content',
      title: 'Instagram Caption Ideas',
      description: 'Generated 5 engaging captions for fitness content',
      time: '2 hours ago',
      icon: Lightbulb,
      color: 'text-primary-600'
    },
    {
      type: 'voiceover',
      title: 'Workout Motivation Script',
      description: 'Created professional voiceover for YouTube intro',
      time: '1 day ago',
      icon: Mic,
      color: 'text-secondary-600'
    },
    {
      type: 'trend',
      title: 'Fitness Trends Analysis',
      description: 'Discovered 3 trending workout formats',
      time: '2 days ago',
      icon: TrendingUp,
      color: 'text-accent-600'
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
      {/* Welcome Header */}
      <motion.div 
        className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white relative overflow-hidden"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-secondary-600/20"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile?.full_name || 'Creator'}! 
            </h1>
            <p className="text-primary-100 text-lg">
              Ready to create amazing content? Let's get started with AI-powered tools.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">{profile?.follower_count?.toLocaleString() || '0'} followers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span className="text-sm capitalize">{profile?.niche || 'General'} Creator</span>
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="hidden sm:block"
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="h-20 w-20 text-primary-200" />
          </motion.div>
        </div>
        
        {!profile?.is_pro && (
          <motion.div 
            className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Crown className="h-5 w-5" />
                </motion.div>
                <span className="font-medium">Upgrade to Pro for unlimited access to all features</span>
              </div>
              <motion.button 
                onClick={handleUpgradeClick}
                className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Upgrade Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <motion.div 
            key={index} 
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative overflow-hidden"
            variants={itemVariants}
            whileHover={{ 
              y: -5,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <motion.p 
                  className="text-3xl font-bold text-gray-900 mt-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 300 }}
                >
                  {stat.value}
                </motion.p>
                <motion.p 
                  className="text-xs text-success-600 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  {stat.change} from last week
                </motion.p>
              </div>
              <motion.div 
                className={`p-3 rounded-lg ${stat.bgColor}`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">AI-Powered Creator Tools</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -8,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link
                to={action.href}
                className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 block relative overflow-hidden h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <motion.div 
                  className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-4 relative z-10`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </motion.div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 relative z-10">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 relative z-10">
                  {action.description}
                </p>
                
                <div className="space-y-2 mb-4 relative z-10">
                  {action.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                      {feature}
                    </div>
                  ))}
                </div>
                
                <motion.div 
                  className="flex items-center text-primary-600 group-hover:text-primary-700 relative z-10"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-sm font-medium">Get started</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity & Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          variants={itemVariants}
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Link 
              to="/app/content" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.map((item, index) => (
              <motion.div 
                key={index} 
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="flex-shrink-0"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          variants={itemVariants}
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Trending Now</h3>
            <Link 
              to="/app/trends" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Explore
            </Link>
          </div>
          <div className="space-y-4">
            {[
              'Short-form educational content',
              'Behind-the-scenes vlogs',
              'Quick productivity tips',
              'AI-generated thumbnails',
              'Interactive Q&A sessions'
            ].map((trend, index) => (
              <motion.div 
                key={index} 
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="flex-shrink-0"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                >
                  <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-accent-600" />
                  </div>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{trend}</p>
                  <p className="text-xs text-gray-500">Trending up 🔥</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Start Guide */}
      <motion.div 
        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200"
        variants={itemVariants}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              New to CreatorCopilot? Start here!
            </h3>
            <p className="text-gray-600 mb-4">
              Follow these steps to get the most out of your AI-powered creator toolkit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-sm text-gray-700">Complete your profile</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-sm text-gray-700">Generate your first content</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <span className="text-sm text-gray-700">Explore brand campaigns</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}