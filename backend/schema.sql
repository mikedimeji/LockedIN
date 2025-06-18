-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS revisiontopic;
DROP TABLE IF EXISTS userstats;
DROP TABLE IF EXISTS user;

-- Create the 'user' table
CREATE TABLE user (
                      user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      username VARCHAR(255) NOT NULL,
                      email VARCHAR(255) NOT NULL UNIQUE,
                      password VARCHAR(255) NOT NULL,
                      role VARCHAR(50) NOT NULL,
                      gold INT DEFAULT 0
);

-- Create the 'revisiontopic' table
CREATE TABLE revisiontopic (
                               revision_topic_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                               user_id BIGINT NOT NULL,
                               title VARCHAR(255) NOT NULL,
                               description TEXT,
                               pomodoro_number INT,
                               FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- Create the 'userstats' table with streak columns
CREATE TABLE userstats (
                           user_stats_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                           user_id BIGINT NOT NULL,
                           hours_spent_revising_per_day FLOAT DEFAULT 0,
                           days_revised_in_a_row INT DEFAULT 0,
                           total_hours_revised FLOAT DEFAULT 0,
                           current_streak INT DEFAULT 0,
                           longest_streak INT DEFAULT 0,
                           last_pomodoro_date DATE,
                           FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- Table for storing pomodoro session data
CREATE TABLE pomodoro_sessions (
                                   id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                   user_id BIGINT NOT NULL,
                                   start_time TIMESTAMP NOT NULL,
                                   end_time TIMESTAMP NOT NULL,
                                   duration_minutes INT NOT NULL,
                                   pomodoros_completed INT NOT NULL,
                                   pause_count INT DEFAULT 0,
                                   FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- Table for tracking achievements
CREATE TABLE achievements (
                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                              user_id BIGINT NOT NULL,
                              name VARCHAR(100) NOT NULL,
                              description VARCHAR(255) NOT NULL,
                              achieved_date DATE NOT NULL,
                              achievement_type VARCHAR(50) NOT NULL,
                              FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- Optional: Table for tracking gold transactions
CREATE TABLE gold_transactions (
                                   id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                   user_id BIGINT NOT NULL,
                                   amount INT NOT NULL,
                                   transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                   transaction_type ENUM('EARN', 'SPEND') NOT NULL,
                                   description VARCHAR(255),
                                   FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX idx_pomodoro_user_date ON pomodoro_sessions(user_id, start_time);
CREATE INDEX idx_achievement_user ON achievements(user_id, achieved_date);
CREATE INDEX idx_gold_user_date ON gold_transactions(user_id, transaction_date, transaction_type);

-- Sample data insertion (optional)
INSERT INTO user (username, email, password, role, gold)
VALUES
    ('john_doe', 'john@example.com', 'password123', 'ROLE_USER', 10),
    ('admin', 'admin@example.com', '$2a$10$EixZaYVK1fsbw1Zfbx3OpI.QnJIsw2REedFf8RgC2pvXbZSZceFpW', 'ROLE_ADMIN', 50);

INSERT INTO revisiontopic (user_id, title, description, pomodoro_number)
VALUES
    (1, 'Math Revision', 'Algebra and Geometry', 5),
    (2, 'Science Revision', 'Physics and Chemistry', 8);

-- Insert userstats for existing users with initial streak values
INSERT INTO userstats (user_id, hours_spent_revising_per_day, days_revised_in_a_row, total_hours_revised, current_streak, longest_streak)
SELECT user_id, 0, 0, 0, 0, 0 FROM user;

-- Ensure that the AUTO_INCREMENT values start from a specific number if needed
ALTER TABLE user AUTO_INCREMENT = 1;
ALTER TABLE revisiontopic AUTO_INCREMENT = 1;
ALTER TABLE userstats AUTO_INCREMENT = 1;


