-- Per-sport hourly prices for venue owner registration
ALTER TABLE venues ADD COLUMN IF NOT EXISTS sport_prices TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS base_price_per_hour INTEGER DEFAULT 0;
