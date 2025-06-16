// This edge function handles OAuth callbacks from social media platforms
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const url = new URL(req.url);
    const platform = url.pathname.split('/').pop();
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      console.error(`OAuth error: ${error}`);
      return new Response(
        JSON.stringify({ error: `Authentication failed: ${error}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: "No authorization code provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!platform) {
      return new Response(
        JSON.stringify({ error: "No platform specified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    // Exchange the authorization code for an access token
    // This would be different for each platform
    let tokenResponse;
    let userData;
    
    switch (platform) {
      case 'instagram':
        tokenResponse = await exchangeInstagramCode(code);
        userData = await getInstagramUserData(tokenResponse.access_token);
        break;
      case 'youtube':
        tokenResponse = await exchangeYoutubeCode(code);
        userData = await getYoutubeUserData(tokenResponse.access_token);
        break;
      case 'twitter':
        tokenResponse = await exchangeTwitterCode(code);
        userData = await getTwitterUserData(tokenResponse.access_token);
        break;
      case 'linkedin':
        tokenResponse = await exchangeLinkedinCode(code);
        userData = await getLinkedinUserData(tokenResponse.access_token);
        break;
      case 'facebook':
        tokenResponse = await exchangeFacebookCode(code);
        userData = await getFacebookUserData(tokenResponse.access_token);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Unsupported platform" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
    
    // Store the token in the database
    const { error: insertError } = await supabase
      .from('edge_functions.oauth_tokens')
      .upsert({
        user_id: user.id,
        platform,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope,
        expires_at: tokenResponse.expires_at ? new Date(tokenResponse.expires_at) : null,
        platform_user_id: userData.id,
        platform_username: userData.username,
        metadata: userData
      });
    
    if (insertError) {
      console.error('Error storing token:', insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Return success HTML that will close the popup window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .card {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              max-width: 500px;
            }
            h1 {
              margin-top: 0;
            }
            .checkmark {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: block;
              stroke-width: 2;
              stroke: #4BB71B;
              stroke-miterlimit: 10;
              box-shadow: 0 0 20px #4BB71B;
              animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
              margin: 0 auto 20px;
              background: rgba(255, 255, 255, 0.2);
            }
            .checkmark__circle {
              stroke-dasharray: 166;
              stroke-dashoffset: 166;
              stroke-width: 2;
              stroke-miterlimit: 10;
              stroke: #4BB71B;
              fill: none;
              animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            .checkmark__check {
              transform-origin: 50% 50%;
              stroke-dasharray: 48;
              stroke-dashoffset: 48;
              animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
            }
            @keyframes stroke {
              100% {
                stroke-dashoffset: 0;
              }
            }
            @keyframes scale {
              0%, 100% {
                transform: none;
              }
              50% {
                transform: scale3d(1.1, 1.1, 1);
              }
            }
            @keyframes fill {
              100% {
                box-shadow: inset 0px 0px 0px 30px rgba(75, 183, 27, 0.2);
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h1>Authentication Successful!</h1>
            <p>Your ${platform} account has been connected successfully.</p>
            <p>You can close this window and return to CreatorCopilot.</p>
          </div>
          <script>
            // Close the window after 3 seconds
            setTimeout(function() {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `;
    
    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html" },
      status: 200
    });
    
  } catch (error) {
    console.error('Error in auth callback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Platform-specific OAuth token exchange functions
// These would need to be implemented with the correct OAuth flow for each platform
async function exchangeInstagramCode(code: string) {
  // In production, this would make a real API call to Instagram
  console.log('Exchanging Instagram code:', code);
  return {
    access_token: 'mock_instagram_token',
    token_type: 'bearer',
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
  };
}

async function getInstagramUserData(accessToken: string) {
  // In production, this would make a real API call to Instagram
  console.log('Getting Instagram user data with token:', accessToken);
  return {
    id: 'instagram_12345',
    username: 'creator_demo',
    name: 'Creator Demo',
    profile_picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Content creator and digital marketer',
    website: 'https://example.com',
    is_business: true,
    followers_count: 15420
  };
}

async function exchangeYoutubeCode(code: string) {
  // In production, this would make a real API call to YouTube/Google
  console.log('Exchanging YouTube code:', code);
  return {
    access_token: 'mock_youtube_token',
    refresh_token: 'mock_youtube_refresh',
    token_type: 'bearer',
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
  };
}

async function getYoutubeUserData(accessToken: string) {
  // In production, this would make a real API call to YouTube
  console.log('Getting YouTube user data with token:', accessToken);
  return {
    id: 'youtube_67890',
    username: 'CreatorChannel',
    name: 'Creator Channel',
    profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    subscribers_count: 8750,
    channel_url: 'https://youtube.com/c/creatorchannel'
  };
}

// Implement similar functions for Twitter, LinkedIn, and Facebook
async function exchangeTwitterCode(code: string) {
  console.log('Exchanging Twitter code:', code);
  return { access_token: 'mock_twitter_token', token_type: 'bearer' };
}

async function getTwitterUserData(accessToken: string) {
  console.log('Getting Twitter user data with token:', accessToken);
  return { id: 'twitter_12345', username: 'creator_twitter' };
}

async function exchangeLinkedinCode(code: string) {
  console.log('Exchanging LinkedIn code:', code);
  return { access_token: 'mock_linkedin_token', token_type: 'bearer' };
}

async function getLinkedinUserData(accessToken: string) {
  console.log('Getting LinkedIn user data with token:', accessToken);
  return { id: 'linkedin_12345', username: 'creator_linkedin' };
}

async function exchangeFacebookCode(code: string) {
  console.log('Exchanging Facebook code:', code);
  return { access_token: 'mock_facebook_token', token_type: 'bearer' };
}

async function getFacebookUserData(accessToken: string) {
  console.log('Getting Facebook user data with token:', accessToken);
  return { id: 'facebook_12345', username: 'creator_facebook' };
}