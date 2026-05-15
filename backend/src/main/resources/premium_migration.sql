-- Run this against your Aiven MySQL database
-- Adds the premium unlock system for LockedIN Stats

CREATE TABLE IF NOT EXISTS user_premium (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE,
    is_premium  BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at TIMESTAMP NULL,
    unlock_method VARCHAR(50) DEFAULT 'gold',
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);
