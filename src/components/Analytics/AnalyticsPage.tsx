import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Share, 
  Eye,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Facebook,
  Plus,
  Settings,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { socialMediaService } from '../../lib/socialMedia';
import toast from 'react-hot-toast';

interface ConnectedAccount {
  id: string;
  platform: 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok';
  username: string;
  profileImage: string;
  isConnected: boolean;
  lastSync: string;
  followers: number;
}

interface AnalyticsData {
  platform: string;
  metrics: {
    followers: { current: number; change: number; changePercent: number };
    engagement: { current: number; change: number; changePercent: number };
    reach: { current: number; change: number; changePercent: number };
    impressions: { current: number; change: number; changePercent: number };
  };
  posts: Array<{
    id: string;
    content: string;
    date: string;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    engagement: number;
  }>;
  chartData: Array<{
    date: string;
    followers: number;
    engagement: number;
    reach: number;
  }>;
}

const platforms = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'from-pink-500 to-purple-600',
    description: 'Connect your Instagram Business account'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'from-red-500 to-red-600',
    description: 'Connect your YouTube channel'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'from-blue-400 to-blue-500',
    description: 'Connect your Twitter account'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'from-blue-600 to-blue-700',
    description: 'Connect your LinkedIn profile'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'from-blue-500 to-blue-600',
    description: 'Connect your Facebook page'
  }
];

export function AnalyticsPage() {
  const { profile } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatformToConnect, setSelectedPlatformToConnect] = useState<string>('');

  useEffect(() => {
    loadConnectedAccounts();
    loadAnalyticsData();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const accounts = await socialMediaService.getConnectedAccounts(profile?.id || '');
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error loading connected accounts:', error);
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const data = await socialMediaService.getAnalyticsData(
        profile?.id || '',
        selectedPlatform,
        dateRange
      );
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectPlatform = async (platformId: string) => {
    try {
      const authUrl = await socialMediaService.getAuthUrl(platformId);
      
      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'social-auth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // Refresh connected accounts
          loadConnectedAccounts();
          toast.success(`${platformId} connected successfully!`);
          setShowConnectModal(false);
        }
      }, 1000);

    } catch (error) {
      toast.error(`Failed to connect ${platformId}`);
    }
  };

  const disconnectPlatform = async (accountId: string) => {
    try {
      await socialMediaService.disconnectAccount(accountId);
      loadConnectedAccounts();
      toast.success('Account disconnected successfully');
    } catch (error) {
      toast.error('Failed to disconnect account');
    }
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      await socialMediaService.syncAllAccounts(profile?.id || '');
      await loadAnalyticsData();
      toast.success('Data synced successfully!');
    } catch (error) {
      toast.error('Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'followers': return Users;
      case 'engagement': return Heart;
      case 'reach': return Eye;
      case 'impressions': return BarChart3;
      default: return TrendingUp;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return ArrowUp;
    if (change < 0) return ArrowDown;
    return Minus;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div 
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <BarChart3 className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Social Media Analytics</h1>
              <p className="text-gray-600">Track your performance across all platforms</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={syncData}
              disabled={syncing}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync Data</span>
            </button>
            
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Connect Account</span>
            </button>
          </div>
        </div>

        {/* Connected Accounts Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {platforms.map((platform) => {
            const account = connectedAccounts.find(acc => acc.platform === platform.id);
            const isConnected = !!account;
            
            return (
              <motion.div
                key={platform.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isConnected 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${platform.color}`}>
                    <platform.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{platform.name}</p>
                    {isConnected ? (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Connected</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Not connected</span>
                    )}
                  </div>
                </div>
                
                {isConnected && account && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-sm font-medium text-gray-900">@{account.username}</p>
                    <p className="text-xs text-gray-600">{formatNumber(account.followers)} followers</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Platforms</option>
              {connectedAccounts.map((account) => (
                <option key={account.id} value={account.platform}>
                  {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadAnalyticsData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Analytics Overview */}
      {analyticsData.length > 0 ? (
        <div className="space-y-6">
          {analyticsData.map((platformData, index) => (
            <motion.div
              key={platformData.platform}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${
                    platforms.find(p => p.id === platformData.platform)?.color || 'from-gray-500 to-gray-600'
                  }`}>
                    {React.createElement(
                      platforms.find(p => p.id === platformData.platform)?.icon || BarChart3,
                      { className: "h-5 w-5 text-white" }
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {platformData.platform} Analytics
                  </h3>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Object.entries(platformData.metrics).map(([key, metric]) => {
                  const Icon = getMetricIcon(key);
                  const ChangeIcon = getChangeIcon(metric.change);
                  
                  return (
                    <motion.div
                      key={key}
                      className="bg-gray-50 rounded-lg p-4"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div className={`flex items-center space-x-1 ${getChangeColor(metric.change)}`}>
                          <ChangeIcon className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {Math.abs(metric.changePercent).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(metric.current)}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">{key}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Chart Placeholder */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Performance Trends</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Followers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Engagement</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Reach</span>
                    </div>
                  </div>
                </div>
                
                {/* Simulated Chart */}
                <div className="h-64 flex items-end justify-between space-x-2">
                  {platformData.chartData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                      <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '200px' }}>
                        <div 
                          className="absolute bottom-0 w-full bg-blue-500 rounded-t"
                          style={{ height: `${(data.followers / Math.max(...platformData.chartData.map(d => d.followers))) * 100}%` }}
                        ></div>
                        <div 
                          className="absolute bottom-0 w-full bg-green-500 opacity-70 rounded-t"
                          style={{ height: `${(data.engagement / Math.max(...platformData.chartData.map(d => d.engagement))) * 80}%` }}
                        ></div>
                        <div 
                          className="absolute bottom-0 w-full bg-purple-500 opacity-50 rounded-t"
                          style={{ height: `${(data.reach / Math.max(...platformData.chartData.map(d => d.reach))) * 60}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Posts */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Recent Posts Performance</h4>
                <div className="space-y-3">
                  {platformData.posts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(post.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{formatNumber(post.likes)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{formatNumber(post.comments)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share className="h-4 w-4" />
                          <span>{formatNumber(post.shares)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{formatNumber(post.reach)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center"
          variants={itemVariants}
        >
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-6">
            Connect your social media accounts to start tracking your performance analytics.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Connect Your First Account
          </button>
        </motion.div>
      )}

      {/* Connect Account Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Connect Social Media Account</h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => {
                const isConnected = connectedAccounts.some(acc => acc.platform === platform.id);
                
                return (
                  <motion.button
                    key={platform.id}
                    onClick={() => !isConnected && connectPlatform(platform.id)}
                    disabled={isConnected}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      isConnected
                        ? 'border-green-200 bg-green-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    whileHover={!isConnected ? { scale: 1.02 } : {}}
                    whileTap={!isConnected ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${platform.color}`}>
                        <platform.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                        <p className="text-sm text-gray-600">{platform.description}</p>
                        {isConnected && (
                          <div className="flex items-center space-x-1 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">Already connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Secure Connection</p>
                  <p className="text-sm text-blue-700">
                    We use OAuth 2.0 for secure authentication. We only access analytics data and never post on your behalf.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}