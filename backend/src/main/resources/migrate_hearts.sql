ALTER TABLE userstats ADD COLUMN heart_points INT NOT NULL DEFAULT 2;
ALTER TABLE userstats ADD COLUMN last_heart_refill_date DATE;
