// This edge function creates a Stripe checkout session
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import Stripe from "npm:stripe@12.0.0";

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
    
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    
    if (!stripeSecretKey) {
      throw new Error("Missing Stripe secret key");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
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
    const { priceId, successUrl, cancelUrl } = await req.json();
    
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Missing price ID" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Get or create a Stripe customer for this user
    let customerId;
    
    // Check if the user already has a Stripe customer
    const { data: customers, error: customerError } = await supabase
      .from('stripe.customers')
      .select('customer_id')
      .eq('id', user.id)
      .limit(1);
    
    if (customerError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch customer data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    if (customers && customers.length > 0) {
      customerId = customers[0].customer_id;
    } else {
      // Create a new Stripe customer
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch user profile" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name,
        metadata: {
          user_id: user.id
        }
      });
      
      customerId = customer.id;
      
      // Save the customer ID to the database
      const { error: insertError } = await supabase
        .from('stripe.customers')
        .insert({
          id: user.id,
          customer_id: customerId,
          email: profile.email
        });
      
      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Failed to save customer data" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/app/dashboard?checkout=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/app/upgrade?checkout=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      metadata: {
        user_id: user.id
      }
    });
    
    // Log the function execution
    const { error: logError } = await supabase
      .from('edge_functions.function_logs')
      .insert({
        function_name: 'create-checkout-session',
        user_id: user.id,
        status: 'success',
        execution_time_ms: Date.now() - new Date(req.headers.get('date') || Date.now()).getTime(),
        request_payload: { priceId },
        response_payload: { sessionId: session.id, url: session.url }
      });
    
    if (logError) {
      console.error('Error logging function execution:', logError);
    }
    
    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in create-checkout-session function:', error);
    
    // Log the error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('edge_functions.function_logs')
          .insert({
            function_name: 'create-checkout-session',
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