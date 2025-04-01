-- Add the share_zipcode column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS share_zipcode BOOLEAN DEFAULT false;

-- Comment on the column
COMMENT ON COLUMN profiles.share_zipcode IS 'Whether the user has opted to share their zipcode with administrators';

-- Add a migration record
INSERT INTO migrations (name, applied_at) 
VALUES ('add_share_zipcode_column', NOW())
ON CONFLICT (name) DO NOTHING; 