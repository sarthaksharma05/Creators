import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    
    const initializeAuth = async () => {
      console.log('🔄 Initializing authentication...');
      
      try {
        // Get initial session without aggressive timeout
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at
          };
          
          setUser(authUser);
          await fetchUserProfile(session.user.id, session.user.email || '');
        } else {
          console.log('ℹ️ No existing session found');
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user');
            
            if (session?.user) {
              const authUser: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                created_at: session.user.created_at,
                updated_at: session.user.updated_at || session.user.created_at
              };
              
              setUser(authUser);
              await fetchUserProfile(session.user.id, session.user.email || '');
            } else {
              setUser(null);
              setProfile(null);
            }
            
            if (!initialized) {
              setLoading(false);
              setInitialized(true);
            }
          }
        );

        authSubscription = subscription;

        // Mark as initialized after setting up the listener
        if (!initialized) {
          setLoading(false);
          setInitialized(true);
        }

      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Safety net - ensure loading stops after reasonable time
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading && !initialized) {
        console.log('⏰ Safety timeout - ensuring auth initialization completes');
        setLoading(false);
        setInitialized(true);
      }
    }, 10000); // 10 seconds instead of 5

    return () => clearTimeout(safetyTimeout);
  }, [loading, initialized]);

  const fetchUserProfile = async (userId: string, userEmail: string) => {
    try {
      console.log('👤 Fetching profile for user:', userId);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);

      if (error) {
        console.error('❌ Error fetching profile:', error);
        
        // Check if the error is due to JWT expiration
        if (error.message?.includes('JWT expired') || error.code === 'PGRST301') {
          console.log('🔑 JWT expired, signing out user...');
          await signOut();
          return;
        }
        
        return;
      }

      // If no profile exists, create one
      if (!profiles || profiles.length === 0) {
        console.log('📝 Profile not found, creating default profile...');
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            full_name: '',
            avatar_url: null,
            niche: null,
            bio: null,
            social_links: {},
            follower_count: 0,
            is_pro: false
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating profile:', insertError);
          return;
        }

        console.log('✅ Profile created successfully:', newProfile?.email);
        setProfile(newProfile);
        return;
      }

      const profile = profiles[0];
      console.log('✅ Profile fetched successfully:', profile?.email);
      setProfile(profile);
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('📝 Attempting to sign up user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        console.error('❌ Signup error from Supabase:', error);
        // Handle specific error cases
        if (error.message?.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw new Error(error.message || 'Failed to create account');
      }

      // Create profile if user was created successfully
      if (data.user) {
        console.log('👤 User created, creating profile...');
        
        // Wait a moment for the user to be fully created in auth
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            full_name: fullName, // Use the provided full name
            avatar_url: null,
            niche: null,
            bio: null,
            social_links: {},
            follower_count: 0,
            is_pro: false
          });

        if (profileError) {
          console.error('❌ Error creating profile:', profileError);
          // Don't throw here as the user was created successfully
        } else {
          console.log('✅ Profile created successfully with name:', fullName);
        }
      }

      console.log('✅ User created successfully:', email);
      return data;
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      throw error; // Re-throw the original error to preserve the message
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting to sign in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Signin error from Supabase:', error);
        // Provide more specific error messages
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials or sign up for a new account.');
        } else if (error.message?.includes('Email not confirmed')) {
          throw new Error('Please check your email and confirm your account before signing in.');
        } else if (error.message?.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        }
        throw new Error(error.message || 'Failed to sign in');
      }

      console.log('✅ User signed in successfully:', email);
      return data;
    } catch (error: any) {
      console.error('❌ Signin error:', error);
      throw error; // Re-throw the original error to preserve the message
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      setUser(null);
      setProfile(null);

      console.log('✅ User signed out successfully');
    } catch (error: any) {
      console.error('❌ Signout error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) throw new Error('No user logged in');

    try {
      console.log('📝 Updating profile for user:', user.email);
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        // Check if the error is due to JWT expiration
        if (error.message?.includes('JWT expired') || error.code === 'PGRST301') {
          console.log('🔑 JWT expired during profile update, signing out user...');
          await signOut();
          throw new Error('Session expired. Please sign in again.');
        }
        throw error;
      }

      console.log('✅ Profile updated successfully');
      setProfile(data);
      return data;
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  };
}