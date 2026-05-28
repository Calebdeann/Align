-- Add optional message column to pokes so the recipient sees what was sent.
ALTER TABLE pokes ADD COLUMN IF NOT EXISTS message TEXT;
