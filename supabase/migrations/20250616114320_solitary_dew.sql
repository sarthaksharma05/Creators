/*
  # Stripe Integration Tables

  1. New Tables
    - `stripe_customers` - Link Supabase users to Stripe customers
    - `stripe_products` - Store product information from Stripe
    - `stripe_prices` - Store price information from Stripe
    - `stripe_subscriptions` - Store subscription information from Stripe
    - `stripe_invoices` - Store invoice information from Stripe

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
*/

-- Create schema for Stripe related tables
CREATE SCHEMA IF NOT EXISTS stripe;

-- Stripe Customers
CREATE TABLE IF NOT EXISTS stripe.customers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text UNIQUE NOT NULL,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stripe Products
CREATE TABLE IF NOT EXISTS stripe.products (
  id text PRIMARY KEY,
  active boolean,
  name text,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stripe Prices
CREATE TABLE IF NOT EXISTS stripe.prices (
  id text PRIMARY KEY,
  product_id text REFERENCES stripe.products(id),
  active boolean,
  currency text,
  unit_amount bigint,
  type text,
  interval text,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stripe Subscriptions
CREATE TABLE IF NOT EXISTS stripe.subscriptions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text,
  price_id text REFERENCES stripe.prices(id),
  quantity integer,
  cancel_at_period_end boolean,
  current_period_start timestamptz,
  current_period_end timestamptz,
  ended_at timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stripe Invoices
CREATE TABLE IF NOT EXISTS stripe.invoices (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id text REFERENCES stripe.subscriptions(id),
  status text,
  currency text,
  amount_due bigint,
  amount_paid bigint,
  amount_remaining bigint,
  invoice_pdf text,
  hosted_invoice_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE stripe.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers - users can only access their own customer data
CREATE POLICY "Users can view their own customer data" 
  ON stripe.customers 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Products - all authenticated users can view products
CREATE POLICY "Authenticated users can view products" 
  ON stripe.products 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Prices - all authenticated users can view prices
CREATE POLICY "Authenticated users can view prices" 
  ON stripe.prices 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Subscriptions - users can only access their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON stripe.subscriptions 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Invoices - users can only access their own invoices
CREATE POLICY "Users can view their own invoices" 
  ON stripe.invoices 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create function to sync subscription status with profiles
CREATE OR REPLACE FUNCTION sync_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile subscription details
  UPDATE public.profiles
  SET 
    subscription_tier = CASE
      WHEN NEW.price_id LIKE '%pro%' THEN 'pro'
      WHEN NEW.price_id LIKE '%studio%' THEN 'studio'
      ELSE 'free'
    END,
    subscription_status = NEW.status,
    subscription_id = NEW.id,
    trial_ends_at = NEW.trial_end,
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync subscription status
CREATE TRIGGER sync_subscription_status_trigger
AFTER INSERT OR UPDATE ON stripe.subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_subscription_status();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON stripe.customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON stripe.prices(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON stripe.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON stripe.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON stripe.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON stripe.invoices(subscription_id);