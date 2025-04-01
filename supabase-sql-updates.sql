-- 1. Add created_by column to emergency_contacts
ALTER TABLE emergency_contacts 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing records to set created_by equal to user_id
-- This assumes the relationship that the current user_id is the one who created the contact
UPDATE emergency_contacts 
SET created_by = user_id 
WHERE created_by IS NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_created_by 
ON emergency_contacts(created_by);

-- 2. Create a notification_settings table to track notification preferences
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email_alerts BOOLEAN DEFAULT TRUE,
  sms_alerts BOOLEAN DEFAULT FALSE,
  alert_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Create a group_alert_recipients table to link alerts with recipients
CREATE TABLE IF NOT EXISTS group_alert_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  emergency_contact_id UUID REFERENCES emergency_contacts(id),
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(alert_id, user_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_group_alert_recipients_alert 
ON group_alert_recipients(alert_id);

CREATE INDEX IF NOT EXISTS idx_group_alert_recipients_user 
ON group_alert_recipients(user_id);

CREATE INDEX IF NOT EXISTS idx_group_alert_recipients_contact 
ON group_alert_recipients(emergency_contact_id);

-- 4. Add role column to profiles table for role-based access control
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

-- Create an index for better query performance when checking roles
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role);

-- Update any existing admin users if needed
-- Example: UPDATE profiles SET role = 'admin' WHERE id = 'specific-user-id';

-- 5. Create a function to check if a user has a specific role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = required_role;
END;
$$ LANGUAGE plpgsql; 