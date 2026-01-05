-- Migration number: 0001_security_updates

-- Add metadata to licenses
ALTER TABLE licenses ADD COLUMN type TEXT DEFAULT 'FREE'; -- 'FREE' or 'PRO'
ALTER TABLE licenses ADD COLUMN domain TEXT;              -- Locks license to a specific domain

-- Add tracking to usage_logs
ALTER TABLE usage_logs ADD COLUMN ip_address TEXT;
