-- Add address-related columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip TEXT;

-- Add comments on the columns
COMMENT ON COLUMN profiles.address IS 'User''s street address';
COMMENT ON COLUMN profiles.city IS 'User''s city';
COMMENT ON COLUMN profiles.state IS 'User''s state or province';
COMMENT ON COLUMN profiles.zip IS 'User''s zip or postal code';

-- Add a migration record
INSERT INTO migrations (name, applied_at) 
VALUES ('add_address_columns', NOW())
ON CONFLICT (name) DO NOTHING; 