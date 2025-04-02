-- Create alert_invitations table for tracking invitations to non-users
CREATE TABLE IF NOT EXISTS alert_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  token TEXT UNIQUE DEFAULT uuid_generate_v4()
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_alert_invitations_email ON alert_invitations(email);

-- Add index on status for filtering pending invitations
CREATE INDEX IF NOT EXISTS idx_alert_invitations_status ON alert_invitations(status);

-- Add comment on the table
COMMENT ON TABLE alert_invitations IS 'Tracks invitations sent to non-users to join alert groups';

-- Add a migration record
INSERT INTO migrations (name, applied_at) 
VALUES ('create_alert_invitations', NOW())
ON CONFLICT (name) DO NOTHING; 