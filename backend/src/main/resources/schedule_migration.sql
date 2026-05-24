CREATE TABLE IF NOT EXISTS time_blocks (
    id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    block_date DATE         NOT NULL,
    start_minute SMALLINT   NOT NULL,
    end_minute   SMALLINT   NOT NULL,
    type       VARCHAR(20)  NOT NULL,
    title      VARCHAR(100) NOT NULL DEFAULT '',
    CONSTRAINT fk_tb_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_tb_user_date (user_id, block_date)
);
