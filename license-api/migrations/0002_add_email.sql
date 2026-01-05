-- Migration number: 0002_add_email

-- Add email to licenses for contact and verification
ALTER TABLE licenses ADD COLUMN email TEXT;
ALTER TABLE licenses ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE licenses ADD COLUMN stripe_session_id TEXT;
