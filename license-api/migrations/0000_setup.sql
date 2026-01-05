-- Migration number: 0000_setup

CREATE TABLE IF NOT EXISTS licenses (
  key TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  quota_limit INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT NOT NULL,
  items_processed INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (license_key) REFERENCES licenses(key)
);

CREATE INDEX IF NOT EXISTS idx_usage_license_key ON usage_logs(license_key);
