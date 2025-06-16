// This edge function handles voiceover generation with ElevenLabs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the ElevenLabs API key
    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || "";
    
    if (!elevenLabsApiKey) {
      throw new Error("Missing ElevenLabs API key");
    }
    
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
    
    // Get the request body
    const { script, voiceId, title } = await req.json();
    
    if (!script || !voiceId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Check if the user has reached their usage limit
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, usage_limits, usage_counts')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Calculate the estimated minutes for this script (rough estimate: 150 words per minute)
    const wordCount = script.split(/\s+/).length;
    const estimatedMinutes = wordCount / 150;
    
    // Check if the user is on a free plan and has reached their limit
    if (profile.subscription_tier === 'free') {
      const voiceoverLimit = profile.usage_limits.voiceover_minutes;
      const currentUsage = profile.usage_counts.voiceover_minutes;
      
      if (voiceoverLimit !== -1 && currentUsage + estimatedMinutes > voiceoverLimit) {
        return new Response(
          JSON.stringify({ 
            error: "Usage limit reached", 
            message: "You've reached your monthly voiceover minutes limit. Upgrade to Pro for more minutes.",
            limit: voiceoverLimit,
            usage: currentUsage,
            requested: estimatedMinutes
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }
    
    // Create a record in the database for this voiceover
    const { data: voiceover, error: insertError } = await supabase
      .from('voiceovers')
      .insert({
        user_id: user.id,
        title: title || 'Untitled Voiceover',
        script,
        voice_id: voiceId,
        status: 'generating'
      })
      .select()
      .single();
    
    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to create voiceover record" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Generate the voiceover with ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // Update the voiceover record with the error
      await supabase
        .from('voiceovers')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', voiceover.id);
      
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status} ${response.statusText}`, details: errorText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Get the audio data
    const audioData = await response.arrayBuffer();
    
    // Upload the audio file to Supabase Storage
    const fileName = `voiceovers/${user.id}/${voiceover.id}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      });
    
    if (uploadError) {
      // Update the voiceover record with the error
      await supabase
        .from('voiceovers')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', voiceover.id);
      
      return new Response(
        JSON.stringify({ error: "Failed to upload audio file", details: uploadError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Get the public URL for the audio file
    const { data: publicUrl } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);
    
    // Update the voiceover record with the audio URL
    const { error: updateError } = await supabase
      .from('voiceovers')
      .update({
        audio_url: publicUrl.publicUrl,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', voiceover.id);
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update voiceover record", details: updateError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Update the user's usage count
    const newUsageCount = profile.usage_counts.voiceover_minutes + estimatedMinutes;
    const { error: usageError } = await supabase
      .from('profiles')
      .update({
        usage_counts: {
          ...profile.usage_counts,
          voiceover_minutes: newUsageCount
        }
      })
      .eq('id', user.id);
    
    if (usageError) {
      console.error('Error updating usage count:', usageError);
    }
    
    // Log the function execution
    const { error: logError } = await supabase
      .from('edge_functions.function_logs')
      .insert({
        function_name: 'generate-voiceover',
        user_id: user.id,
        status: 'success',
        execution_time_ms: Date.now() - new Date(req.headers.get('date') || Date.now()).getTime(),
        request_payload: { script: script.substring(0, 100) + '...', voiceId, title },
        response_payload: { voiceoverId: voiceover.id, audioUrl: publicUrl.publicUrl }
      });
    
    if (logError) {
      console.error('Error logging function execution:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        voiceoverId: voiceover.id, 
        audioUrl: publicUrl.publicUrl,
        estimatedMinutes,
        remainingMinutes: profile.subscription_tier === 'free' 
          ? profile.usage_limits.voiceover_minutes - newUsageCount 
          : null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in generate-voiceover function:', error);
    
    // Log the error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('edge_functions.function_logs')
          .insert({
            function_name: 'generate-voiceover',
            status: 'error',
            error_message: error.message,
            execution_time_ms: Date.now() - new Date(req.headers.get('date') || Date.now()).getTime()
          });
      }
    } catch (logError) {
      console.error('Error logging function error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});