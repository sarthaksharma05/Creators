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
    
    // Get the ElevenLabs API key - use the provided key
    const elevenLabsApiKey = "sk_f08bd81526c5b374dd56a774b9a2f1aab5b68fc67b2ab81b";
    
    console.log("ElevenLabs API key configured successfully");
    
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
    
    // Validate script length
    if (script.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Script too long. Maximum 5000 characters allowed." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Check if the user has reached their usage limit
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_pro, usage_limits, usage_counts')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.warn('Failed to fetch user profile, proceeding without usage limits check:', profileError);
    }
    
    // Calculate the estimated minutes for this script (rough estimate: 150 words per minute)
    const wordCount = script.split(/\s+/).length;
    const estimatedMinutes = wordCount / 150;
    
    // Check usage limits for non-pro users
    if (profile && !profile.is_pro && profile.usage_limits && profile.usage_counts) {
      const voiceoverLimit = profile.usage_limits.voiceover_minutes || 2;
      const currentUsage = profile.usage_counts.voiceover_minutes || 0;
      
      if (currentUsage + estimatedMinutes > voiceoverLimit) {
        return new Response(
          JSON.stringify({ 
            error: "Usage limit reached", 
            message: `You've reached your monthly voiceover limit. Current usage: ${currentUsage.toFixed(1)}/${voiceoverLimit} minutes. Upgrade to Pro for unlimited voiceovers.`,
            limit: voiceoverLimit,
            usage: currentUsage
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
      console.error('Failed to create voiceover record:', insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create voiceover record", details: insertError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Generate the voiceover with ElevenLabs
    console.log(`Generating voiceover with ElevenLabs for voice ${voiceId}`);
    console.log(`Script length: ${script.length} characters, estimated ${estimatedMinutes.toFixed(2)} minutes`);
    
    // Use proper ElevenLabs API settings for high-quality audio
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
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        },
        output_format: 'mp3_44100_128'
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} ${response.statusText}`, errorText);
      
      // Update the voiceover record with the error
      await supabase
        .from('voiceovers')
        .update({
          status: 'failed'
        })
        .eq('id', voiceover.id);
      
      let errorMessage = 'Failed to generate voiceover';
      
      if (response.status === 401) {
        errorMessage = 'Invalid ElevenLabs API key. Please check your API key configuration.';
      } else if (response.status === 402) {
        errorMessage = 'ElevenLabs account has insufficient credits. Please check your billing.';
      } else if (response.status === 429) {
        errorMessage = 'ElevenLabs API rate limit exceeded. Please try again in a few minutes.';
      } else if (response.status === 422) {
        errorMessage = 'Invalid voice ID or text content. Please check your input.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `ElevenLabs API error: ${response.status} ${response.statusText}. ${errorText}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Get the audio data
    const audioData = await response.arrayBuffer();
    console.log(`Generated audio data of size: ${audioData.byteLength} bytes`);
    
    // Validate that we received actual audio data
    if (audioData.byteLength < 1000) {
      console.error('Received suspiciously small audio data:', audioData.byteLength, 'bytes');
      
      await supabase
        .from('voiceovers')
        .update({
          status: 'failed'
        })
        .eq('id', voiceover.id);
      
      return new Response(
        JSON.stringify({ 
          error: "Generated audio file is too small or corrupted",
          details: `Received only ${audioData.byteLength} bytes of audio data` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Upload the audio file to Supabase Storage
    const fileName = `voiceovers/${user.id}/${voiceover.id}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Failed to upload audio file:', uploadError);
      
      // Update the voiceover record with the error
      await supabase
        .from('voiceovers')
        .update({
          status: 'failed'
        })
        .eq('id', voiceover.id);
      
      return new Response(
        JSON.stringify({ error: "Failed to upload audio file", details: uploadError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Get the public URL for the audio file
    const { data: publicUrl } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);
    
    console.log(`Audio uploaded successfully: ${publicUrl.publicUrl}`);
    
    // Update the voiceover record with the audio URL
    const { error: updateError } = await supabase
      .from('voiceovers')
      .update({
        audio_url: publicUrl.publicUrl,
        status: 'completed'
      })
      .eq('id', voiceover.id);
    
    if (updateError) {
      console.error('Failed to update voiceover record:', updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update voiceover record", details: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Update user's usage count
    if (profile && profile.usage_counts) {
      const newUsageCount = (profile.usage_counts.voiceover_minutes || 0) + estimatedMinutes;
      await supabase
        .from('profiles')
        .update({
          usage_counts: {
            ...profile.usage_counts,
            voiceover_minutes: newUsageCount
          }
        })
        .eq('id', user.id);
    }
    
    console.log(`Voiceover generation completed successfully for ID: ${voiceover.id}`);
    
    return new Response(
      JSON.stringify({ 
        voiceoverId: voiceover.id, 
        audioUrl: publicUrl.publicUrl,
        estimatedMinutes,
        message: "Voiceover generated successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in generate-voiceover function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate voiceover",
        details: error.message,
        message: "An unexpected error occurred during voiceover generation."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});