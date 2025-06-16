import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface AuthFormData {
  email: string;
  password: string;
  fullName?: string;
}

interface AuthFormProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export function AuthForm({ onBack, onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    try {
      if (isSignUp) {
        if (!data.fullName) {
          throw new Error('Full name is required');
        }
        await signUp(data.email, data.password, data.fullName);
        toast.success('Account created successfully! You can now sign in.');
        setIsSignUp(false);
        reset();
      } else {
        await signIn(data.email, data.password);
        toast.success('Welcome back to CreatorCopilot!');
        
        // Immediate redirect to dashboard after successful login
        navigate('/app/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Authentication failed';
      
      if (error.message?.includes('Invalid login credentials')) {
        if (isSignUp) {
          errorMessage = 'Failed to create account. Please try again.';
        } else {
          errorMessage = 'Invalid email or password. Please check your credentials or sign up for a new account.';
        }
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account before signing in.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  // Demo credentials helper
  const fillDemoCredentials = () => {
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
      const nameInput = form.querySelector('input[type="text"]') as HTMLInputElement;
      
      if (emailInput) emailInput.value = 'demo@creatorcopilot.com';
      if (passwordInput) passwordInput.value = 'demo123456';
      if (nameInput && isSignUp) nameInput.value = 'Demo Creator';
      
      // Trigger form validation
      emailInput?.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput?.dispatchEvent(new Event('input', { bubbles: true }));
      if (nameInput && isSignUp) nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-bounce-soft"></div>
      </div>

      <motion.div 
        className="max-w-md w-full space-y-8 relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Back Button */}
        <motion.button
          onClick={handleBackClick}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors mb-6"
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </motion.button>

        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <motion.div 
              className="flex justify-center mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className="text-purple-200">
              {isSignUp 
                ? 'Join CreatorCopilot and start your AI-powered creator journey' 
                : 'Sign in to access your creative workspace'
              }
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label htmlFor="fullName" className="sr-only">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                  <input
                    {...register('fullName', { 
                      required: isSignUp ? 'Full name is required' : false 
                    })}
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 placeholder-purple-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all"
                    placeholder="Full name"
                  />
                </div>
                {errors.fullName && (
                  <motion.p 
                    className="mt-2 text-sm text-red-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.fullName.message}
                  </motion.p>
                )}
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 placeholder-purple-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all"
                  placeholder="Email address"
                />
              </div>
              {errors.email && (
                <motion.p 
                  className="mt-2 text-sm text-red-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 placeholder-purple-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all"
                  placeholder="Password"
                />
                <motion.button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  whileTap={{ scale: 0.95 }}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </motion.button>
              </div>
              {errors.password && (
                <motion.p 
                  className="mt-2 text-sm text-red-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-4 rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </span>
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In to Dashboard'
              )}
            </motion.button>

            <div className="text-center">
              <motion.button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  reset();
                }}
                className="text-purple-300 hover:text-white text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </motion.button>
            </div>
          </form>

          {/* Demo Instructions */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-white font-medium mb-2">Demo Instructions:</h4>
            <div className="text-purple-200 text-sm space-y-2">
              <p>• <strong>First time?</strong> Click "Sign up" to create a new account</p>
              <p>• <strong>Returning?</strong> Use the same email/password you created</p>
              <p>• <strong>Quick Demo:</strong> 
                <button 
                  type="button"
                  onClick={fillDemoCredentials}
                  className="ml-2 text-purple-300 hover:text-white underline"
                >
                  Fill demo credentials
                </button>
              </p>
              <p className="text-xs text-purple-300 mt-2">
                Note: If you get "Invalid credentials" error, make sure to sign up first with your chosen email/password.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}