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
      console.error("ElevenLabs API key not found in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "ElevenLabs API key not configured. Please configure the ELEVENLABS_API_KEY environment variable in your Supabase Edge Functions settings.",
          details: "Go to your Supabase project dashboard -> Edge Functions -> generate-voiceover -> Environment Variables and add ELEVENLABS_API_KEY"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
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
      .select('is_pro')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.warn('Failed to fetch user profile, proceeding without usage limits check:', profileError);
    }
    
    // Calculate the estimated minutes for this script (rough estimate: 150 words per minute)
    const wordCount = script.split(/\s+/).length;
    const estimatedMinutes = wordCount / 150;
    
    // For now, we'll skip the detailed usage limit check since the profile structure might not have usage_limits
    // This can be re-enabled once the profile table is properly configured with usage tracking
    
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
      console.error(`ElevenLabs API error: ${response.status} ${response.statusText}`, errorText);
      
      // Update the voiceover record with the error
      await supabase
        .from('voiceovers')
        .update({
          status: 'failed'
        })
        .eq('id', voiceover.id);
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to generate voiceover`,
          details: `ElevenLabs API error: ${response.status} ${response.statusText}. ${errorText}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Get the audio data
    const audioData = await response.arrayBuffer();
    console.log(`Generated audio data of size: ${audioData.byteLength} bytes`);
    
    // Upload the audio file to Supabase Storage
    const fileName = `voiceovers/${user.id}/${voiceover.id}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
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
        message: "Please ensure your ElevenLabs API key is properly configured in Supabase Edge Functions environment variables."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});