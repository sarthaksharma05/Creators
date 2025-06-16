import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// More robust validation for real Supabase configuration
const hasValidSupabaseConfig = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.length > 20 && // Real Supabase URLs are longer
  supabaseAnonKey.length > 50 && // Real anon keys are longer
  supabaseUrl.includes('supabase.co') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder') &&
  !supabaseUrl.includes('your_project_url') &&
  !supabaseAnonKey.includes('your_anon_key');

console.log('🔧 Supabase Configuration Check:');
console.log('- URL provided:', !!supabaseUrl);
console.log('- URL length:', supabaseUrl?.length || 0);
console.log('- Key provided:', !!supabaseAnonKey);
console.log('- Key length:', supabaseAnonKey?.length || 0);
console.log('- Valid config:', hasValidSupabaseConfig);

if (!hasValidSupabaseConfig) {
  console.warn('⚠️ Supabase configuration missing or invalid. Please check your .env file:');
  console.warn('- VITE_SUPABASE_URL should be your project URL (e.g., https://your-project.supabase.co)');
  console.warn('- VITE_SUPABASE_ANON_KEY should be your anon/public key');
  console.warn('- Make sure the .env file is in the root directory');
  console.warn('- Restart the development server after adding environment variables');
  console.warn('- Application will run in demo mode with limited functionality');
}

// Create a mock client for development when config is missing
const createMockSupabaseClient = () => {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({ data: [], error: { message: 'Supabase not configured' } }),
      insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      delete: () => ({ data: null, error: { message: 'Supabase not configured' } })
    })
  };
};

// Create the Supabase client or mock client
export const supabase = hasValidSupabaseConfig 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'creator-copilot@1.0.0'
        }
      }
    })
  : createMockSupabaseClient() as any;

// Test the connection only if we have valid config
if (hasValidSupabaseConfig) {
  console.log('✅ Supabase client created successfully');
  
  // Test the connection
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection test successful');
      console.log('- Session exists:', !!data.session);
    }
  }).catch((error) => {
    console.error('❌ Supabase connection error:', error);
  });
} else {
  console.warn('⚠️ Running in demo mode - Supabase functionality disabled');
}

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  niche?: string;
  bio?: string;
  social_links?: any;
  follower_count?: number;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  budget: number;
  niche: string;
  requirements: string[];
  status: 'active' | 'paused' | 'completed';
  applications_count: number;
  created_at: string;
  updated_at: string;
  brand: Profile;
};

export type CampaignApplication = {
  id: string;
  campaign_id: string;
  creator_id: string;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  campaign: Campaign;
  creator: Profile;
};

export type GeneratedContent = {
  id: string;
  user_id: string;
  type: 'script' | 'caption' | 'hashtags' | 'ideas';
  title: string;
  content: string;
  niche?: string;
  platform?: string;
  created_at: string;
};

export type Voiceover = {
  id: string;
  user_id: string;
  title: string;
  script: string;
  voice_id: string;
  audio_url?: string;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
};