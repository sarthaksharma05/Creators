// This edge function handles Stripe webhook events
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
    
    // Get the Stripe webhook secret
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    
    if (!stripeWebhookSecret) {
      throw new Error("Missing Stripe webhook secret");
    }
    
    // Get the request body as text
    const body = await req.text();
    
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No Stripe signature found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Log the webhook event
    const { error: logError } = await supabase
      .from('edge_functions.webhooks')
      .insert({
        source: 'stripe',
        event_type: event.type,
        payload: event,
        status: 'received'
      });
    
    if (logError) {
      console.error('Error logging webhook event:', logError);
    }
    
    // Handle the event based on its type
    switch (event.type) {
      case 'customer.created':
      case 'customer.updated':
        await handleCustomerEvent(event.data.object, supabase);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object, supabase, stripe);
        break;
        
      case 'invoice.paid':
      case 'invoice.payment_failed':
        await handleInvoiceEvent(event.data.object, supabase);
        break;
        
      case 'product.created':
      case 'product.updated':
        await handleProductEvent(event.data.object, supabase);
        break;
        
      case 'price.created':
      case 'price.updated':
        await handlePriceEvent(event.data.object, supabase);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Update the webhook event status
    const { error: updateError } = await supabase
      .from('edge_functions.webhooks')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('source', 'stripe')
      .eq('event_type', event.type)
      .eq('status', 'received');
    
    if (updateError) {
      console.error('Error updating webhook event status:', updateError);
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in Stripe webhook handler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Handler functions for different event types
async function handleCustomerEvent(customer: any, supabase: any) {
  // Get the user ID from the customer metadata
  const userId = customer.metadata?.user_id;
  
  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }
  
  // Upsert the customer in the database
  const { error } = await supabase
    .from('stripe.customers')
    .upsert({
      id: userId,
      customer_id: customer.id,
      email: customer.email,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error upserting customer:', error);
  }
}

async function handleSubscriptionEvent(subscription: any, supabase: any, stripe: any) {
  // Get the customer
  const { data: customers, error: customerError } = await supabase
    .from('stripe.customers')
    .select('id')
    .eq('customer_id', subscription.customer)
    .limit(1);
  
  if (customerError || !customers.length) {
    console.error('Error finding customer:', customerError || 'No customer found');
    return;
  }
  
  const userId = customers[0].id;
  
  // Get the price details
  let priceId = subscription.items.data[0].price.id;
  
  // Upsert the subscription in the database
  const { error } = await supabase
    .from('stripe.subscriptions')
    .upsert({
      id: subscription.id,
      user_id: userId,
      status: subscription.status,
      price_id: priceId,
      quantity: subscription.items.data[0].quantity,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      metadata: subscription.metadata,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error upserting subscription:', error);
  }
  
  // Update the user's profile with subscription details
  const subscriptionTier = priceId.includes('pro') ? 'pro' : priceId.includes('studio') ? 'studio' : 'free';
  
  // Set usage limits based on subscription tier
  let usageLimits = {};
  
  if (subscriptionTier === 'pro') {
    usageLimits = {
      content_generations: -1, // unlimited
      voiceover_minutes: 60,
      video_generations: 10
    };
  } else if (subscriptionTier === 'studio') {
    usageLimits = {
      content_generations: -1, // unlimited
      voiceover_minutes: -1, // unlimited
      video_generations: -1 // unlimited
    };
  } else {
    usageLimits = {
      content_generations: 5,
      voiceover_minutes: 2,
      video_generations: 0
    };
  }
  
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_tier: subscriptionTier,
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      usage_limits: usageLimits,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
  
  if (profileError) {
    console.error('Error updating profile:', profileError);
  }
}

async function handleInvoiceEvent(invoice: any, supabase: any) {
  // Get the customer
  const { data: customers, error: customerError } = await supabase
    .from('stripe.customers')
    .select('id')
    .eq('customer_id', invoice.customer)
    .limit(1);
  
  if (customerError || !customers.length) {
    console.error('Error finding customer:', customerError || 'No customer found');
    return;
  }
  
  const userId = customers[0].id;
  
  // Upsert the invoice in the database
  const { error } = await supabase
    .from('stripe.invoices')
    .upsert({
      id: invoice.id,
      user_id: userId,
      subscription_id: invoice.subscription,
      status: invoice.status,
      currency: invoice.currency,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      amount_remaining: invoice.amount_remaining,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error upserting invoice:', error);
  }
}

async function handleProductEvent(product: any, supabase: any) {
  // Upsert the product in the database
  const { error } = await supabase
    .from('stripe.products')
    .upsert({
      id: product.id,
      active: product.active,
      name: product.name,
      description: product.description,
      metadata: product.metadata,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error upserting product:', error);
  }
}

async function handlePriceEvent(price: any, supabase: any) {
  // Upsert the price in the database
  const { error } = await supabase
    .from('stripe.prices')
    .upsert({
      id: price.id,
      product_id: price.product,
      active: price.active,
      currency: price.currency,
      unit_amount: price.unit_amount,
      type: price.type,
      interval: price.recurring?.interval,
      interval_count: price.recurring?.interval_count,
      trial_period_days: price.recurring?.trial_period_days,
      metadata: price.metadata,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error upserting price:', error);
  }
}