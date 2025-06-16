// This edge function handles AI content generation with OpenAI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import OpenAI from "npm:openai@4.20.1";

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
    
    // Initialize OpenAI client
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";
    
    if (!openaiApiKey) {
      throw new Error("Missing OpenAI API key");
    }
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    
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
    const { type, niche, platform, additionalContext, title } = await req.json();
    
    if (!type || !niche) {
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
    
    // Check if the user is on a free plan and has reached their limit
    if (profile.subscription_tier === 'free') {
      const contentGenerationLimit = profile.usage_limits.content_generations;
      const currentUsage = profile.usage_counts.content_generations;
      
      if (contentGenerationLimit !== -1 && currentUsage >= contentGenerationLimit) {
        return new Response(
          JSON.stringify({ 
            error: "Usage limit reached", 
            message: "You've reached your monthly content generation limit. Upgrade to Pro for unlimited generations.",
            limit: contentGenerationLimit,
            usage: currentUsage
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }
    
    // Create the prompt based on the content type
    const prompts = {
      script: `Create an engaging ${platform} script for a ${niche} content creator. Make it conversational, valuable, and hook viewers from the start. Include a strong opening, valuable content, and clear call-to-action. ${additionalContext || ''}`,
      caption: `Write a compelling ${platform} caption for ${niche} content. Include relevant emojis, engaging hooks, and encourage interaction. ${additionalContext || ''}`,
      hashtags: `Generate 15-20 trending hashtags for ${niche} content on ${platform}. Mix popular and niche-specific tags for maximum reach. ${additionalContext || ''}`,
      ideas: `Suggest 10 creative content ideas for a ${niche} creator on ${platform}. Make them current, engaging, and aligned with trending topics. ${additionalContext || ''}`
    };
    
    const prompt = prompts[type as keyof typeof prompts] || prompts.ideas;
    
    // Generate content with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are CreatorCopilot, an AI assistant specialized in helping content creators generate high-quality, engaging content across social media platforms."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });
    
    const generatedContent = completion.choices[0]?.message?.content || "Unable to generate content";
    
    // Update the user's usage count
    const newUsageCount = profile.usage_counts.content_generations + 1;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        usage_counts: {
          ...profile.usage_counts,
          content_generations: newUsageCount
        }
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating usage count:', updateError);
    }
    
    // Save the generated content to the database
    const { error: insertError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        type,
        title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} for ${niche} on ${platform}`,
        content: generatedContent,
        niche,
        platform
      });
    
    if (insertError) {
      console.error('Error saving generated content:', insertError);
    }
    
    // Log the function execution
    const { error: logError } = await supabase
      .from('edge_functions.function_logs')
      .insert({
        function_name: 'generate-content',
        user_id: user.id,
        status: 'success',
        execution_time_ms: Date.now() - new Date(req.headers.get('date') || Date.now()).getTime(),
        request_payload: { type, niche, platform, additionalContext },
        response_payload: { content: generatedContent.substring(0, 100) + '...' }
      });
    
    if (logError) {
      console.error('Error logging function execution:', logError);
    }
    
    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in generate-content function:', error);
    
    // Log the error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('edge_functions.function_logs')
          .insert({
            function_name: 'generate-content',
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