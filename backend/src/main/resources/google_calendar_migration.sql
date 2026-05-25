CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    user_id     BIGINT PRIMARY KEY,
    access_token  TEXT    NOT NULL,
    refresh_token TEXT,
    expires_at    BIGINT  NOT NULL,
    CONSTRAINT fk_gct_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);
