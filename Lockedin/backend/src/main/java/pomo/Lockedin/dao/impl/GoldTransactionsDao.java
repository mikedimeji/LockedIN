package pomo.Lockedin.dao.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * DAO specifically for handling gold transactions
 */
@Slf4j
@Repository
public class GoldTransactionsDao {

    private final JdbcTemplate jdbcTemplate;

    public GoldTransactionsDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Record a gold transaction
     * @param userId The user's ID
     * @param amount Amount of gold
     * @param type Transaction type ('EARN' or 'SPEND')
     * @param description Description of the transaction
     * @return True if transaction was recorded successfully
     */
    public boolean recordTransaction(Long userId, int amount, String type, String description) {
        try {
            String sql = "INSERT INTO gold_transactions (user_id, amount, transaction_type, description) " +
                    "VALUES (?, ?, ?, ?)";

            int rowsAffected = jdbcTemplate.update(sql, userId, amount, type, description);

            if (rowsAffected != 1) {
                log.warn("Expected 1 row to be affected when recording gold transaction, but got: {}", rowsAffected);
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("Error recording gold transaction for user ID {}: {}", userId, e.getMessage());
            return false;
        }
    }
}
