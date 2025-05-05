package pomo.Lockedin.dao.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.GoldDao;
import pomo.Lockedin.dao.JdbcTemplateProvider;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j
@Repository
public class GoldDaoImpl implements GoldDao, JdbcTemplateProvider {

    private final JdbcTemplate jdbcTemplate;

    public GoldDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<Integer> getGoldEarnedPerDayLastWeek(Long userId) {
        try {
            // First, create a result template with zeros for all days of the week
            List<Integer> resultTemplate = Arrays.asList(0, 0, 0, 0, 0, 0, 0); // Default zeros for each day

            // Query to get gold earned per day in the last week
            String sql = "SELECT DAYOFWEEK(date(transaction_date))-1 as day_index, " +
                    "COALESCE(SUM(amount), 0) as gold_amount " +
                    "FROM gold_transactions " +
                    "WHERE user_id = ? " +
                    "AND transaction_type = 'EARN' " +
                    "AND date(transaction_date) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) " +
                    "GROUP BY DAYOFWEEK(date(transaction_date)) " +
                    "ORDER BY DAYOFWEEK(date(transaction_date))";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, userId);

            // If we have data, replace zeros in the template with actual values
            if (!rows.isEmpty()) {
                List<Integer> result = new ArrayList<>(resultTemplate);
                for (Map<String, Object> row : rows) {
                    int dayIndex = ((Number) row.get("day_index")).intValue();
                    int goldAmount = ((Number) row.get("gold_amount")).intValue();
                    // Adjust index for days of week (0 = Monday, 6 = Sunday)
                    dayIndex = (dayIndex + 6) % 7; // Convert from DAYOFWEEK (1=Sunday) to our format (0=Monday)
                    if (dayIndex >= 0 && dayIndex < 7) {
                        result.set(dayIndex, goldAmount);
                    }
                }
                return result;
            }

            return resultTemplate;
        } catch (Exception e) {
            log.error("Error retrieving weekly gold earned for user ID {}: {}", userId, e.getMessage());
            return Arrays.asList(0, 0, 0, 0, 0, 0, 0);
        }
    }

    @Override
    public int getTotalGoldEarned(Long userId) {
        try {
            String sql = "SELECT COALESCE(SUM(amount), 0) FROM gold_transactions " +
                    "WHERE user_id = ? AND transaction_type = 'EARN'";
            Integer total = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            return total != null ? total : 0;
        } catch (Exception e) {
            log.error("Error retrieving total gold earned for user ID {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    @Override
    public int getTotalGoldSpent(Long userId) {
        try {
            String sql = "SELECT COALESCE(SUM(amount), 0) FROM gold_transactions " +
                    "WHERE user_id = ? AND transaction_type = 'SPEND'";
            Integer total = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            return total != null ? total : 0;
        } catch (Exception e) {
            log.error("Error retrieving total gold spent for user ID {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    @Override
    public JdbcTemplate getJdbcTemplate() {
        return this.jdbcTemplate;
    }
}
