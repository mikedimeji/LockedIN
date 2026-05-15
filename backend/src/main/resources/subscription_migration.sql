-- Run this against your Aiven MySQL database after premium_migration.sql
-- Adds the Stripe subscription tracking table

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                BIGINT NOT NULL UNIQUE,
    stripe_customer_id     VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    plan                   VARCHAR(20),               -- 'monthly' | 'annual'
    status                 VARCHAR(50) DEFAULT 'inactive', -- 'active' | 'cancelled' | 'past_due' | 'inactive'
    current_period_end     TIMESTAMP NULL,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);
