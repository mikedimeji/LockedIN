-- Run this migration against your database before deploying
CREATE TABLE IF NOT EXISTS user_profile (
    id                            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                       BIGINT NOT NULL UNIQUE,
    -- ASRS-v1.1 focus questions
    focus_completion_difficulty   VARCHAR(20),
    sustained_attention_difficulty VARCHAR(20),
    distraction_frequency         VARCHAR(20),
    -- Sleep (B-PSQI)
    sleep_hours                   VARCHAR(20),
    chronotype                    VARCHAR(20),
    -- Work style
    daily_focus_time              VARCHAR(20),
    primary_focus_challenge       VARCHAR(30),
    work_environment              VARCHAR(20),
    -- Executive function (ESQ-R)
    task_breakdown_ease           VARCHAR(30),
    procrastination_tendency      VARCHAR(20),
    -- Context
    stress_level                  VARCHAR(20),
    primary_motivation            VARCHAR(30),
    -- Metadata
    status                        VARCHAR(20) NOT NULL DEFAULT 'not_started',
    skipped_at                    TIMESTAMP NULL,
    completed_at                  TIMESTAMP NULL,
    is_premium_at_completion      BOOLEAN DEFAULT FALSE,
    raw_json                      TEXT,
    FOREIGN KEY (user_id)         REFERENCES `user`(user_id)
);
