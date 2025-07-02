-- Required Supabase Database Schema Updates for Subscription Management
-- Execute this in your Supabase SQL Editor

-- 0. First, create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 1. Create or update the subscriptions table (used by the admin system)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL, -- Stripe customer ID
  subscription_id TEXT, -- Stripe subscription ID (can be null for admin-set free plans)
  price_id TEXT, -- Stripe price ID
  plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'comfort', 'deluxe')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'canceled', 'trialing', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT, -- For admin-managed changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_id ON subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

-- 3. Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update subscriptions" ON subscriptions
  FOR UPDATE USING (true);

-- 5. Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. The profiles table now already exists with role column
-- No need to add role column as it was created in step 0

-- 8. Create admin audit log for subscription changes
CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'created', 'updated', 'canceled', 'plan_changed', etc.
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create index for audit log
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_subscription_id ON subscription_audit_log(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_admin_user_id ON subscription_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_action ON subscription_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_created_at ON subscription_audit_log(created_at);

-- 10. Enable RLS for audit log
ALTER TABLE subscription_audit_log ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policy for audit log (admin only)
CREATE POLICY "Admins can view audit log" ON subscription_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 12. Create a function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO subscription_audit_log (
      subscription_id,
      action,
      old_values,
      new_values,
      reason
    ) VALUES (
      NEW.id,
      'updated',
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.admin_notes
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO subscription_audit_log (
      subscription_id,
      action,
      new_values,
      reason
    ) VALUES (
      NEW.id,
      'created',
      to_jsonb(NEW),
      NEW.admin_notes
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger for subscription audit logging
DROP TRIGGER IF EXISTS trigger_subscription_audit ON subscriptions;
CREATE TRIGGER trigger_subscription_audit
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- 14. Add constraints to ensure data integrity
ALTER TABLE subscriptions ADD CONSTRAINT unique_active_subscription_per_user 
  EXCLUDE (user_id WITH =) WHERE (status = 'active');

-- 15. Optional: Migrate data from user_subscriptions to subscriptions if needed
-- INSERT INTO subscriptions (user_id, customer_id, subscription_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
-- SELECT 
--   user_id::UUID,
--   customer_id,
--   subscription_id,
--   plan,
--   status,
--   current_period_start,
--   current_period_end,
--   created_at,
--   updated_at
-- FROM user_subscriptions
-- WHERE NOT EXISTS (
--   SELECT 1 FROM subscriptions s WHERE s.user_id = user_subscriptions.user_id::UUID
-- );

-- 16. Create a view for easy subscription lookup with user details
CREATE OR REPLACE VIEW user_subscription_details AS
SELECT 
  p.id as user_id,
  p.email,
  p.role,
  s.id as subscription_id,
  s.customer_id,
  s.subscription_id as stripe_subscription_id,
  s.price_id,
  s.plan,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.canceled_at,
  s.trial_start,
  s.trial_end,
  s.admin_notes,
  s.created_at as subscription_created_at,
  s.updated_at as subscription_updated_at
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id AND s.status = 'active';

-- Note: Views don't support RLS policies directly. 
-- Access control is handled through the underlying tables' RLS policies.
