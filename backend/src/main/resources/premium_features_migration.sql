-- Add subject tagging to pomodoro_sessions
ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS subject VARCHAR(100) NULL;

-- Study goals table for premium users
CREATE TABLE IF NOT EXISTS study_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    weekly_hours_target DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_subject (user_id, subject)
);
