/*
  # Edge Functions Schema

  1. New Tables
    - `edge_function_logs` - Logs for edge function executions
    - `oauth_tokens` - Store OAuth tokens for social media platforms
    - `webhooks` - Store webhook events from external services

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
*/

-- Create schema for edge function related tables
CREATE SCHEMA IF NOT EXISTS edge_functions;

-- Edge Function Logs
CREATE TABLE IF NOT EXISTS edge_functions.function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  request_id text,
  user_id uuid REFERENCES public.profiles(id),
  status text NOT NULL,
  execution_time_ms integer,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create index on function name and timestamp
CREATE INDEX IF NOT EXISTS idx_function_logs_function_name ON edge_functions.function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_function_logs_created_at ON edge_functions.function_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_function_logs_user_id ON edge_functions.function_logs(user_id);

-- OAuth Tokens
CREATE TABLE IF NOT EXISTS edge_functions.oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  platform_user_id text,
  platform_username text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Create indexes for OAuth tokens
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON edge_functions.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_platform ON edge_functions.oauth_tokens(platform);

-- Webhook Events
CREATE TABLE IF NOT EXISTS edge_functions.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for webhook events
CREATE INDEX IF NOT EXISTS idx_webhooks_source ON edge_functions.webhooks(source);
CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON edge_functions.webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON edge_functions.webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON edge_functions.webhooks(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE edge_functions.function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_functions.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_functions.webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Function logs - only admins can access
CREATE POLICY "Admins can manage function logs" 
  ON edge_functions.function_logs 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- OAuth tokens - users can only access their own tokens
CREATE POLICY "Users can manage their own OAuth tokens" 
  ON edge_functions.oauth_tokens 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Webhooks - only admins can access
CREATE POLICY "Admins can manage webhooks" 
  ON edge_functions.webhooks 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- Add is_admin column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;