-- Create the migrations table to track which migrations have been applied
CREATE TABLE IF NOT EXISTS migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add a comment on the table
COMMENT ON TABLE migrations IS 'Tracks database migrations that have been applied'; 