import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  ChevronDown,
  Zap,
  Brain,
  Mic,
  Video,
  TrendingUp,
  Users,
  Globe,
  Rocket,
  Star,
  Crown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface WelcomePageProps {
  onGetStarted?: () => void;
}

export function WelcomePage({ onGetStarted }: WelcomePageProps) {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate('/landing');
    }
  };

  const floatingElements = [
    { icon: Brain, color: 'from-purple-500 to-pink-500', delay: 0, size: 'w-16 h-16' },
    { icon: Mic, color: 'from-blue-500 to-cyan-500', delay: 0.5, size: 'w-12 h-12' },
    { icon: Video, color: 'from-green-500 to-emerald-500', delay: 1, size: 'w-14 h-14' },
    { icon: TrendingUp, color: 'from-orange-500 to-red-500', delay: 1.5, size: 'w-10 h-10' },
    { icon: Users, color: 'from-indigo-500 to-purple-500', delay: 2, size: 'w-12 h-12' },
    { icon: Globe, color: 'from-yellow-500 to-orange-500', delay: 2.5, size: 'w-8 h-8' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated 3D Background */}
      <div className="absolute inset-0">
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/30 to-indigo-900/50"></div>
        
        {/* Floating 3D Orbs */}
        <motion.div 
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, rgba(236, 72, 153, 0.6) 50%, transparent 100%)',
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Static 3D Elements */}
        <motion.div 
          className="absolute top-20 left-20 w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10"
          style={{ y: y1 }}
          animate={{
            rotateX: [0, 15, 0],
            rotateY: [0, 25, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="absolute top-40 right-32 w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/10"
          style={{ y: y2 }}
          animate={{
            rotateZ: [0, 45, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="absolute bottom-32 left-1/3 w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-white/10"
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating Icons */}
        {floatingElements.map((element, index) => (
          <motion.div
            key={index}
            className={`absolute ${element.size} rounded-2xl bg-gradient-to-br ${element.color} backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl`}
            style={{
              left: `${20 + (index * 15)}%`,
              top: `${30 + (index % 2) * 40}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotateY: [0, 180, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4 + index,
              repeat: Infinity,
              ease: "easeInOut",
              delay: element.delay,
            }}
          >
            <element.icon className="h-6 w-6 text-white" />
          </motion.div>
        ))}

        {/* Particle Effects */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header 
          className="relative z-50 bg-white/5 backdrop-blur-md border-b border-white/10"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          style={{ opacity }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <motion.div 
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-2xl"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                    CreatorCopilot
                  </span>
                  <p className="text-purple-300 text-sm">AI-Powered Creation Platform</p>
                </div>
              </motion.div>

              <motion.div
                className="hidden md:flex items-center space-x-6"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link to="/about" className="text-white/80 hover:text-white transition-colors font-medium">
                  About
                </Link>
                <Link to="/contact" className="text-white/80 hover:text-white transition-colors font-medium">
                  Contact
                </Link>
                <Link to="/landing" className="text-white/80 hover:text-white transition-colors font-medium">
                  Features
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              {/* Badge */}
              <motion.div 
                className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-full px-8 py-4 mb-8 border border-white/20 shadow-2xl"
                whileHover={{ scale: 1.05, y: -5 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="h-6 w-6 text-yellow-400" />
                </motion.div>
                <span className="text-white font-semibold text-lg">Welcome to the Future of Content Creation</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Rocket className="h-6 w-6 text-cyan-400" />
                </motion.div>
              </motion.div>

              {/* Main Heading */}
              <motion.h1 
                className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <span className="text-white block mb-4">Create.</span>
                <motion.span 
                  className="block bg-gradient-to-r from-purple-400 via-pink-400 via-cyan-400 to-green-400 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                  style={{ backgroundSize: '400% 400%' }}
                >
                  Captivate.
                </motion.span>
                <span className="text-white block mt-4">Convert.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                className="text-2xl md:text-3xl text-purple-200 mb-12 max-w-4xl mx-auto leading-relaxed font-light"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
              >
                Transform your creative vision into reality with our revolutionary AI-powered platform. 
                <span className="text-white font-medium"> Generate content, create videos, and build your empire.</span>
              </motion.p>

              {/* Feature Pills */}
              <motion.div 
                className="flex flex-wrap justify-center gap-4 mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
              >
                {[
                  { icon: Brain, text: 'AI Content', color: 'from-purple-500 to-pink-500' },
                  { icon: Mic, text: 'Voiceovers', color: 'from-blue-500 to-cyan-500' },
                  { icon: Video, text: 'AI Videos', color: 'from-green-500 to-emerald-500' },
                  { icon: TrendingUp, text: 'Trends', color: 'from-orange-500 to-red-500' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className={`flex items-center space-x-2 bg-gradient-to-r ${feature.color} px-6 py-3 rounded-full text-white font-medium shadow-lg`}
                    whileHover={{ scale: 1.1, y: -5 }}
                    animate={{ 
                      y: [0, -5, 0],
                    }}
                    transition={{ 
                      duration: 2 + index * 0.5,
                      repeat: Infinity,
                      delay: index * 0.2
                    }}
                  >
                    <feature.icon className="h-5 w-5" />
                    <span>{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8 mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.1 }}
              >
                <motion.button
                  onClick={handleGetStarted}
                  className="group relative bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white px-12 py-6 rounded-full text-xl font-bold shadow-2xl overflow-hidden"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <span className="relative flex items-center space-x-3">
                    <span>Get Started</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </motion.div>
                  </span>
                </motion.button>

                <Link to="/landing">
                  <motion.button
                    className="group flex items-center space-x-3 bg-white/10 backdrop-blur-md text-white px-8 py-6 rounded-full text-xl font-semibold hover:bg-white/20 transition-all border border-white/20 shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Play className="h-6 w-6" />
                    </motion.div>
                    <span>Explore Features</span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.3 }}
              >
                {[
                  { number: '100K+', label: 'Creators', icon: Users },
                  { number: '10M+', label: 'Content Generated', icon: Brain },
                  { number: '1K+', label: 'Brands', icon: Crown },
                  { number: '99.9%', label: 'Uptime', icon: Star },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="text-center"
                    whileHover={{ scale: 1.1, y: -5 }}
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 3 + index * 0.5,
                      repeat: Infinity,
                      delay: index * 0.3
                    }}
                  >
                    <motion.div
                      className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-full border border-white/20 mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <stat.icon className="h-8 w-8 text-purple-300" />
                    </motion.div>
                    <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                    <div className="text-purple-200 font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ opacity }}
        >
          <span className="text-purple-200 text-sm mb-2">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="h-6 w-6 text-purple-300" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}