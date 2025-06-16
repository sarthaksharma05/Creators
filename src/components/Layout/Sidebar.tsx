import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Lightbulb, 
  Mic, 
  Video,
  TrendingUp, 
  Briefcase, 
  User, 
  Settings,
  Crown,
  Sparkles,
  LogOut,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: Home },
    { name: 'AI Content', href: '/app/content', icon: Lightbulb },
    { name: 'Voiceovers', href: '/app/voiceovers', icon: Mic },
    { name: 'AI Videos', href: '/app/videos', icon: Video },
    { name: 'TrendRadar', href: '/app/trends', icon: TrendingUp },
    { name: 'Campaigns', href: '/app/campaigns', icon: Briefcase },
    { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/app/profile', icon: User },
    { name: 'Billing', href: '/app/billing', icon: CreditCard },
    { name: 'Settings', href: '/app/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const itemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      opacity: 0,
      x: -20
    }
  };

  const containerVariants = {
    open: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    closed: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Sidebar - Fixed position on desktop, overlay on mobile */}
      <motion.div
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl
          lg:relative lg:z-auto lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out lg:transition-none
        `}
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <motion.div 
            className="flex h-16 items-center justify-center border-b border-gray-200 bg-gradient-to-r from-primary-500 to-secondary-500 relative overflow-hidden"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-secondary-600/20"></div>
            <motion.div 
              className="flex items-center space-x-2 relative z-10"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-white">CreatorCopilot</span>
            </motion.div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <motion.div 
              className="space-y-2"
              variants={containerVariants}
              initial="closed"
              animate="open"
            >
              {navigation.map((item, index) => (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 shadow-sm border border-primary-200'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <motion.div
                          animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <item.icon className="h-5 w-5" />
                        </motion.div>
                        <span>{item.name}</span>
                        {isActive && (
                          <motion.div
                            className="ml-auto w-2 h-2 bg-primary-500 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </motion.div>
          </nav>

          {/* Pro Badge & Logout */}
          {profile && (
            <motion.div 
              className="border-t border-gray-200 p-4 space-y-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                  profile.is_pro
                    ? 'bg-gradient-to-r from-accent-500 to-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  animate={profile.is_pro ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Crown className="h-5 w-5" />
                </motion.div>
                <span className="text-sm font-medium">
                  {profile.is_pro ? 'Pro Member' : 'Free Plan'}
                </span>
              </motion.div>
              
              {!profile.is_pro && (
                <NavLink to="/app/upgrade">
                  <motion.button 
                    className="w-full rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 px-3 py-2 text-sm font-medium text-white hover:from-primary-600 hover:to-secondary-600 transition-all shadow-sm"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={onClose}
                  >
                    Upgrade to Pro
                  </motion.button>
                </NavLink>
              )}

              {/* Logout Button */}
              <motion.button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}