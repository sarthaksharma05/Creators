import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download,
  Trash2,
  Save,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Key,
  CreditCard,
  Database
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface SettingsFormData {
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
    trends: boolean;
    campaigns: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showFollowerCount: boolean;
    allowMessages: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    autoSave: boolean;
    soundEffects: boolean;
  };
}

export function SettingsPage() {
  const { profile, updateProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { register, handleSubmit, watch, setValue } = useForm<SettingsFormData>({
    defaultValues: {
      notifications: {
        email: true,
        push: true,
        marketing: false,
        trends: true,
        campaigns: true,
      },
      privacy: {
        profileVisible: true,
        showFollowerCount: true,
        allowMessages: true,
      },
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        autoSave: true,
        soundEffects: true,
      },
    }
  });

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'account', label: 'Account', icon: Settings },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
  ];

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true);
    try {
      // In a real app, you'd save these settings to the database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Simulate data export
    const data = {
      profile,
      settings: watch(),
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creator-copilot-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully!');
  };

  const deleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    try {
      // In a real app, you'd call an API to delete the account
      await signOut();
      toast.success('Account deleted successfully');
    } catch (error) {
      toast.error('Failed to delete account');
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

  const tabVariants = {
    inactive: { scale: 1, opacity: 0.7 },
    active: { scale: 1.02, opacity: 1 }
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
        <div className="flex items-center space-x-3">
          <motion.div 
            className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Settings className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account preferences and privacy settings</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div 
          className="lg:col-span-1"
          variants={itemVariants}
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 sticky top-6">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  variants={tabVariants}
                  animate={activeTab === tab.id ? 'active' : 'inactive'}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div 
          className="lg:col-span-3"
          variants={itemVariants}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              layout
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                    >
                      <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-600">Receive updates via email</p>
                        </div>
                      </div>
                      <motion.label 
                        className="relative inline-flex items-center cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          {...register('notifications.email')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </motion.label>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                    >
                      <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                        </div>
                      </div>
                      <motion.label 
                        className="relative inline-flex items-center cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          {...register('notifications.push')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </motion.label>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                    >
                      <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Trend Alerts</p>
                          <p className="text-sm text-gray-600">Get notified about trending topics</p>
                        </div>
                      </div>
                      <motion.label 
                        className="relative inline-flex items-center cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          {...register('notifications.trends')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </motion.label>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                    >
                      <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Campaign Updates</p>
                          <p className="text-sm text-gray-600">Notifications about campaign applications</p>
                        </div>
                      </div>
                      <motion.label 
                        className="relative inline-flex items-center cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          {...register('notifications.campaigns')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </motion.label>
                    </motion.div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
                  
                  <div className="space-y-4">
                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                    >
                      <div className="flex items-center space-x-3">
                        <Eye className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Public Profile</p>
                          <p className="text-sm text-gray-600">Make your profile visible to other users</p>
                        </div>
                      </div>
                      <motion.label 
                        className="relative inline-flex items-center cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          {...register('privacy.profileVisible')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </motion.label>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                    >
                      <div className="flex items-center space-x-3">
                        <Eye className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Show Follower Count</p>
                          <p className="text-sm text-gray-600">Display your follower count publicly</p>
                        </div>
                      </div>
                      <motion.label 
                        className="relative inline-flex items-center cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          {...register('privacy.showFollowerCount')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </motion.label>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                    >
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Allow Messages</p>
                          <p className="text-sm text-gray-600">Allow other users to send you messages</p>
                        </div>
                      </div>
                      <motion.label 
                        className="relative inline-flex items-center cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          {...register('privacy.allowMessages')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </motion.label>
                    </motion.div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">App Preferences</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        {...register('preferences.theme')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        {...register('preferences.language')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        {...register('preferences.timezone')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        {timezones.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                    >
                      <div className="flex items-center space-x-3">
                        <Save className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Auto-save Content</p>
                          <p className="text-sm text-gray-600">Automatically save your work</p>
                        </div>
                      </div>
                      <motion.label 
                        className="relative inline-flex items-center cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          {...register('preferences.autoSave')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </motion.label>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                    >
                      <div className="flex items-center space-x-3">
                        {watch('preferences.soundEffects') ? (
                          <Volume2 className="h-5 w-5 text-gray-600" />
                        ) : (
                          <VolumeX className="h-5 w-5 text-gray-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">Sound Effects</p>
                          <p className="text-sm text-gray-600">Play sounds for interactions</p>
                        </div>
                      </div>
                      <motion.label 
                        className="relative inline-flex items-center cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          {...register('preferences.soundEffects')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </motion.label>
                    </motion.div>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Account Management</h2>
                  
                  <div className="space-y-4">
                    <motion.div 
                      className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Database className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">Export Your Data</p>
                            <p className="text-sm text-blue-700">Download all your content and settings</p>
                          </div>
                        </div>
                        <motion.button
                          onClick={exportData}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Download className="h-4 w-4" />
                          <span>Export</span>
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="p-4 bg-red-50 rounded-lg border border-red-200"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Trash2 className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium text-red-900">Delete Account</p>
                            <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                          </div>
                        </div>
                        <motion.button
                          onClick={deleteAccount}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            showDeleteConfirm
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{showDeleteConfirm ? 'Confirm Delete' : 'Delete Account'}</span>
                        </motion.button>
                      </div>
                      {showDeleteConfirm && (
                        <motion.div 
                          className="mt-3 p-3 bg-red-100 rounded-lg"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <p className="text-sm text-red-800">
                            This action cannot be undone. All your content, settings, and account data will be permanently deleted.
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <motion.div 
                className="flex justify-end pt-6 border-t border-gray-200"
                variants={itemVariants}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Settings</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}