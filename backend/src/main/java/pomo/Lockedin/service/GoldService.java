package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dao.impl.UserDaoImpl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoldService {

    private final UserDaoImpl userDao;
    private final UserService userService;
    private final StreakService streakService;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Base gold reward per pomodoro
     */
    private static final int BASE_GOLD_PER_POMODORO = 10;

    /**
     * Additional gold per streak day (multiplier)
     */
    private static final double STREAK_BONUS_MULTIPLIER = 0.1; // 10% bonus per streak day

    /**
     * Get the current gold amount for a user by their email
     *
     * @param userEmail User's email address
     * @return Current gold amount
     */
    public int getUserGold(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }
        return userDao.getUserGold(userId);
    }

    /**
     * Add gold to a user's account
     *
     * @param userEmail User's email address
     * @param amount    Amount of gold to add (positive number)
     * @return New gold balance
     */
    public int addGold(String userEmail, int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Gold amount to add must be positive");
        }

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        userDao.incrementUserGold(userId, amount);

        // Record the transaction
        recordGoldTransaction(userId, amount, "EARN", "Added gold");

        return userDao.getUserGold(userId);
    }

    /**
     * Spend gold from a user's account
     *
     * @param userEmail User's email address
     * @param amount    Amount of gold to spend (positive number)
     * @return Remaining gold balance
     * @throws IllegalArgumentException if user doesn't have enough gold
     */
    public int spendGold(String userEmail, int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Gold amount to spend must be positive");
        }

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        int currentGold = userDao.getUserGold(userId);
        if (currentGold < amount) {
            throw new IllegalArgumentException("Insufficient gold: needed " + amount + ", has " + currentGold);
        }

        userDao.incrementUserGold(userId, -amount);

        // Record the transaction
        recordGoldTransaction(userId, amount, "SPEND", "Spent gold");

        return userDao.getUserGold(userId);
    }

    /**
     * Award gold for completing a pomodoro session
     * Based on the number of pomodoros completed and current streak
     *
     * @param userEmail          User's email address
     * @param pomodorosCompleted Number of pomodoros completed
     * @return New gold balance
     */
    public int awardGoldForPomodoros(String userEmail, int pomodorosCompleted) {
        // First update the streak
        int currentStreak = streakService.updateStreakOnPomodoroCompletion(userEmail);

        // Calculate gold award with streak bonus
        int baseGold = pomodorosCompleted * BASE_GOLD_PER_POMODORO;

        // Apply streak bonus (minimum streak of 1)
        int streakBonus = (int) (baseGold * Math.max(1, currentStreak) * STREAK_BONUS_MULTIPLIER);

        int totalGold = baseGold + streakBonus;

        log.info("Awarding {} gold to user {} for {} pomodoros (streak: {}, base: {}, bonus: {})",
                totalGold, userEmail, pomodorosCompleted, currentStreak, baseGold, streakBonus);

        // Get userId for recording transaction
        Long userId = userService.getUserIdByEmail(userEmail);

        userDao.incrementUserGold(userId, totalGold);

        // Record the transaction
        recordGoldTransaction(userId, totalGold, "EARN", "Completed " + pomodorosCompleted + " pomodoros");

        return userDao.getUserGold(userId);
    }

    /**
     * Get daily gold earned for the past week
     */
    public List<Integer> getGoldEarnedPerDayLastWeek(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

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
            log.error("Error retrieving weekly gold for user ID {}: {}", userId, e.getMessage());
            return Arrays.asList(0, 0, 0, 0, 0, 0, 0);
        }
    }

    /**
     * Record a gold transaction in the database
     */
    private void recordGoldTransaction(Long userId, int amount, String type, String description) {
        try {
            String sql = "INSERT INTO gold_transactions (user_id, amount, transaction_type, description) " +
                    "VALUES (?, ?, ?, ?)";

            int rowsAffected = jdbcTemplate.update(sql, userId, amount, type, description);

            if (rowsAffected != 1) {
                log.warn("Expected 1 row to be affected when recording gold transaction, but got: {}", rowsAffected);
            }
        } catch (Exception e) {
            log.error("Error recording gold transaction for user ID {}: {}", userId, e.getMessage());
        }
    }

    // Add these methods to your existing GoldService class

    /**
     * Get user's gold balance by userId (instead of email)
     */
    public int getUserGoldByUserId(Long userId) {
        try {
            String sql = "SELECT gold FROM user WHERE user_id = ?";
            Integer gold = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            return gold != null ? gold : 0;
        } catch (Exception e) {
            log.error("Error retrieving gold for user ID {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    /**
     * Spend gold by userId and return new balance
     */
    public int spendGoldByUserId(Long userId, Integer amount) {
        try {
            // Check current balance first
            int currentGold = getUserGoldByUserId(userId);

            if (currentGold < amount) {
                throw new IllegalArgumentException("Insufficient gold balance");
            }

            // Update the gold balance
            String sql = "UPDATE user SET gold = gold - ? WHERE user_id = ?";
            int rowsAffected = jdbcTemplate.update(sql, amount, userId);

            if (rowsAffected != 1) {
                throw new RuntimeException("Failed to update gold balance");
            }

            // Return new balance
            return getUserGoldByUserId(userId);
        } catch (Exception e) {
            log.error("Error spending gold for user ID {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to spend gold", e);
        }
    }

    /**
     * Add gold to user by userId
     */
    public int addGoldByUserId(Long userId, Integer amount) {
        try {
            String sql = "UPDATE user SET gold = gold + ? WHERE user_id = ?";
            int rowsAffected = jdbcTemplate.update(sql, amount, userId);

            if (rowsAffected != 1) {
                throw new RuntimeException("Failed to update gold balance");
            }

            return getUserGoldByUserId(userId);
        } catch (Exception e) {
            log.error("Error adding gold for user ID {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to add gold", e);
        }
    }
}