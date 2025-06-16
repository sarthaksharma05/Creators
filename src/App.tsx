import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './components/Landing/LandingPage';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ContentGenerator } from './components/Content/ContentGenerator';
import { VoiceoverStudio } from './components/Voiceover/VoiceoverStudio';
import { VideoStudio } from './components/Video/VideoStudio';
import { TrendRadar } from './components/Trends/TrendRadar';
import { CampaignMarketplace } from './components/Campaigns/CampaignMarketplace';
import { ProfilePage } from './components/Profile/ProfilePage';
import { BillingPage } from './components/Billing/BillingPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import { AboutPage } from './components/About/AboutPage';
import { PricingPage } from './components/Pricing/PricingPage';
import { ContactPage } from './components/Contact/ContactPage';
import { UpgradePage } from './components/Upgrade/UpgradePage';
import { AuthForm } from './components/Auth/AuthForm';

function App() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen with better UX and progress indication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-purple-300/30 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md">
            <h2 className="text-2xl font-bold text-white mb-3">CreatorCopilot</h2>
            <p className="text-purple-200 mb-4">Initializing your creative workspace...</p>
            
            {/* Progress dots */}
            <div className="flex justify-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            
            <div className="text-xs text-purple-300">
              This should only take a moment
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🎯 App render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main Landing Page - ALWAYS the first page */}
          <Route 
            path="/" 
            element={<LandingPage />} 
          />
          
          {/* Auth Route */}
          <Route 
            path="/auth" 
            element={
              isAuthenticated ? (
                <Navigate to="/app/dashboard" replace />
              ) : (
                <AuthForm />
              )
            } 
          />
          
          {/* Public Routes - Always accessible */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          
          {/* Protected Routes - Only for authenticated users */}
          {isAuthenticated ? (
            <Route path="/app" element={<Layout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="content" element={<ContentGenerator />} />
              <Route path="voiceovers" element={<VoiceoverStudio />} />
              <Route path="videos" element={<VideoStudio />} />
              <Route path="trends" element={<TrendRadar />} />
              <Route path="campaigns" element={<CampaignMarketplace />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="upgrade" element={<UpgradePage />} />
            </Route>
          ) : (
            <Route path="/app/*" element={<Navigate to="/auth" replace />} />
          )}
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;