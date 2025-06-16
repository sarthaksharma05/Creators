import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get the ElevenLabs API key
    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || "";
    
    if (!elevenLabsApiKey) {
      console.error("ElevenLabs API key not found in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "API key not configured",
          voices: getMockVoices() // Return mock voices as fallback
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Fetch voices from ElevenLabs API
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "Accept": "application/json",
        "xi-api-key": elevenLabsApiKey
      }
    });
    
    if (!response.ok) {
      console.error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: `ElevenLabs API error: ${response.status} ${response.statusText}`,
          voices: getMockVoices() // Return mock voices as fallback
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify({ voices: data.voices || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in elevenlabs-voices function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        voices: getMockVoices() // Return mock voices as fallback
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});

// Mock voices for fallback
function getMockVoices() {
  return [
    { voice_id: "rachel", name: "Rachel", category: "Female" },
    { voice_id: "domi", name: "Domi", category: "Female" },
    { voice_id: "bella", name: "Bella", category: "Female" },
    { voice_id: "antoni", name: "Antoni", category: "Male" },
    { voice_id: "elli", name: "Elli", category: "Female" },
    { voice_id: "josh", name: "Josh", category: "Male" },
    { voice_id: "arnold", name: "Arnold", category: "Male" },
    { voice_id: "adam", name: "Adam", category: "Male" },
    { voice_id: "sam", name: "Sam", category: "Male" }
  ];
}