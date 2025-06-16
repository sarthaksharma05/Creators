import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  LogOut, 
  User, 
  Settings, 
  CreditCard, 
  Crown,
  ChevronDown,
  Shield,
  HelpCircle,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDropdownItemClick = (href: string, isExternal = false) => {
    setShowDropdown(false);
    
    if (isExternal) {
      window.open(href, '_blank');
      return;
    }

    // Handle internal navigation
    if (href.startsWith('/app/')) {
      navigate(href);
    } else if (href.startsWith('/')) {
      navigate(href);
    }
  };

  const dropdownItems = [
    {
      icon: User,
      label: 'Profile',
      href: '/app/profile',
      description: 'Manage your profile',
      isExternal: false
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/app/settings',
      description: 'Account preferences',
      isExternal: false
    },
    {
      icon: Crown,
      label: 'Upgrade to Pro',
      href: '/app/upgrade',
      description: 'Unlock all features',
      highlight: !profile?.is_pro,
      isExternal: false
    },
    {
      icon: CreditCard,
      label: 'Billing & Plans',
      href: '/app/upgrade',
      description: 'Manage subscription',
      isExternal: false
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      href: '/app/settings',
      description: 'Privacy settings',
      isExternal: false
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      href: '/contact',
      description: 'Get assistance',
      isExternal: false
    },
    {
      icon: Mail,
      label: 'Contact Us',
      href: '/contact',
      description: 'Send us a message',
      isExternal: false
    }
  ];

  // Get display name - prioritize full_name, fallback to email prefix, then 'Creator'
  const getDisplayName = () => {
    if (profile?.full_name && profile.full_name.trim()) {
      return profile.full_name;
    }
    if (profile?.email) {
      return profile.email.split('@')[0];
    }
    return 'Creator';
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = getDisplayName();
    if (name === 'Creator') return 'C';
    
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  console.log('🎯 Header render - profile:', profile, 'showDropdown:', showDropdown);

  return (
    <motion.header 
      className="bg-white shadow-sm border-b border-gray-200 relative"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary-50/30 to-secondary-50/30"></div>
      <div className="flex h-16 items-center justify-between px-4 lg:px-6 relative z-10">
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
          
          <div className="hidden md:flex items-center space-x-4">
            <motion.div 
              className="relative"
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <motion.input
                type="text"
                placeholder="Search content, campaigns..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button 
            className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="h-5 w-5" />
            <motion.span 
              className="absolute -top-1 -right-1 h-4 w-4 bg-primary-500 rounded-full text-xs text-white flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            >
              3
            </motion.span>
          </motion.button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => {
                console.log('🎯 Profile button clicked, current state:', showDropdown);
                setShowDropdown(!showDropdown);
              }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="hidden sm:block text-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm font-medium text-gray-900">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-500">
                  {profile?.is_pro ? 'Pro Member' : 'Free Plan'}
                </p>
              </motion.div>
              
              <motion.div
                className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium shadow-sm"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
              >
                {getInitials()}
              </motion.div>

              <motion.div
                animate={{ rotate: showDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showDropdown && (
                <>
                  {/* Mobile backdrop - only show on mobile */}
                  <motion.div 
                    className="fixed inset-0 bg-black/40 z-[9998] md:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowDropdown(false)}
                  />
                  
                  {/* Dropdown content - Increased opacity and better visibility */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 py-2 z-[9999] overflow-hidden"
                    style={{ 
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary-50/80 to-secondary-50/80 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium shadow-lg">
                          {getInitials()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {getDisplayName()}
                          </p>
                          <p className="text-xs text-gray-600">{profile?.email}</p>
                          {profile?.is_pro ? (
                            <div className="flex items-center space-x-1 mt-1">
                              <Crown className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-yellow-600 font-medium">Pro Member</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 mt-1">
                              <div className="w-3 h-3 bg-gray-400 rounded-full" />
                              <span className="text-xs text-gray-500">Free Plan</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Account Stats */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {profile?.follower_count?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-gray-500">Followers</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {profile?.niche ? '1' : '0'}
                          </p>
                          <p className="text-xs text-gray-500">Niche Focus</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2 max-h-80 overflow-y-auto bg-white/90 backdrop-blur-sm">
                      {dropdownItems.map((item, index) => (
                        <div key={index}>
                          <button
                            onClick={() => handleDropdownItemClick(item.href, item.isExternal)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50/80 transition-colors text-left ${
                              item.highlight ? 'bg-gradient-to-r from-yellow-50/80 to-orange-50/80 border-l-4 border-yellow-400' : ''
                            }`}
                          >
                            <item.icon className={`h-5 w-5 ${
                              item.highlight ? 'text-yellow-600' : 'text-gray-500'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className={`font-medium ${
                                  item.highlight ? 'text-yellow-900' : 'text-gray-900'
                                }`}>
                                  {item.label}
                                </p>
                                {item.isExternal && (
                                  <ExternalLink className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                              <p className={`text-xs ${
                                item.highlight ? 'text-yellow-700' : 'text-gray-500'
                              }`}>
                                {item.description}
                              </p>
                            </div>
                            {item.highlight && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                Upgrade
                              </span>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-100 pt-2 bg-white/90 backdrop-blur-sm">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 transition-colors w-full"
                      >
                        <LogOut className="h-5 w-5" />
                        <div className="flex-1 text-left">
                          <p className="font-medium">Sign Out</p>
                          <p className="text-xs text-red-500">End your session</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}