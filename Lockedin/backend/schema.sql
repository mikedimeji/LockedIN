-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS revisiontopic;
DROP TABLE IF EXISTS user;

-- Create the 'user' table
CREATE TABLE user (
                      user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      username VARCHAR(255) NOT NULL,
                      email VARCHAR(255) NOT NULL UNIQUE,
                      password VARCHAR(255) NOT NULL,
                      role VARCHAR(50) NOT NULL
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

-- Sample data insertion (optional)
INSERT INTO user (username, email, password, role) VALUES
                                                       ('john_doe', 'john@example.com', 'password123', 'ROLE_USER'),
                                                       ('admin', 'admin@example.com', 'adminpass', 'ROLE_ADMIN');

INSERT INTO revisiontopic (user_id, title, description, pomodoro_number) VALUES
                                                                             (1, 'Math Revision', 'Algebra and Geometry', 5),
                                                                             (2, 'Science Revision', 'Physics and Chemistry', 8);

-- Ensure that the AUTO_INCREMENT values start from a specific number if needed
ALTER TABLE user AUTO_INCREMENT = 1;
ALTER TABLE revisiontopic AUTO_INCREMENT = 1;
