package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;

    // ─── Achievement definitions ───────────────────────────────────────────────
    // Each entry: { thresholdOrKey, name, description, type, goldReward }

    private static final Object[][] SESSION_MILESTONES = {
        {1,   "First Focus",       "Completed your first focus session",      "SESSION", 5},
        {5,   "Getting Started",   "Completed 5 focus sessions",              "SESSION", 5},
        {10,  "Building Momentum", "Completed 10 focus sessions",             "SESSION", 10},
        {25,  "Committed",         "Completed 25 focus sessions",             "SESSION", 10},
        {50,  "Double Digits",     "Completed 50 focus sessions",             "SESSION", 15},
        {100, "Centurion",         "Completed 100 focus sessions",            "SESSION", 25},
        {250, "Dedicated",         "Completed 250 focus sessions",            "SESSION", 35},
        {500, "Elite Focuser",     "Completed 500 focus sessions",            "SESSION", 50},
    };

    private static final Object[][] STREAK_MILESTONES = {
        {3,  "First Flame",      "Maintained a 3-day study streak",   "STREAK", 10},
        {7,  "Week Warrior",     "Maintained a 7-day study streak",   "STREAK", 20},
        {14, "Fortnight Focus",  "Maintained a 14-day study streak",  "STREAK", 30},
        {30, "Monthly Maven",    "Maintained a 30-day study streak",  "STREAK", 50},
    };

    // Total gold ever earned (sum of all EARN transactions)
    private static final Object[][] GOLD_MILESTONES = {
        {100,   "First Gold",   "Earned a total of 100 gold",    "GOLD", 5},
        {500,   "Gold Rush",    "Earned a total of 500 gold",    "GOLD", 10},
        {1000,  "Wealthy",      "Earned a total of 1,000 gold",  "GOLD", 15},
        {2500,  "High Roller",  "Earned a total of 2,500 gold",  "GOLD", 25},
        {5000,  "Gold Baron",   "Earned a total of 5,000 gold",  "GOLD", 35},
        {10000, "Gold Lord",    "Earned a total of 10,000 gold", "GOLD", 50},
    };

    // Total hours studied
    private static final Object[][] HOURS_MILESTONES = {
        {1,   "First Hour",    "Studied for a total of 1 hour",    "TIME", 5},
        {10,  "Ten Hours",     "Studied for a total of 10 hours",  "TIME", 15},
        {24,  "Full Day",      "Studied for a total of 24 hours",  "TIME", 25},
        {50,  "Scholar",       "Studied for a total of 50 hours",  "TIME", 40},
        {100, "Grand Scholar", "Studied for a total of 100 hours", "TIME", 50},
    };

    // Sessions completed in a single day
    private static final Object[][] DAILY_MILESTONES = {
        {2, "Power Hour",      "Completed 2 sessions in a single day",  "DAILY", 10},
        {4, "Half Day Hero",   "Completed 4 sessions in a single day",  "DAILY", 20},
        {6, "Full Focus Day",  "Completed 6 sessions in a single day",  "DAILY", 30},
        {8, "Marathon",        "Completed 8 sessions in a single day",  "DAILY", 40},
    };

    // Time-of-day / calendar special achievements
    private static final Object[][] SPECIAL_ACHIEVEMENTS = {
        {"early_bird",       "Early Bird",       "Completed a session before 8 AM",      "SPECIAL", 15},
        {"night_owl",        "Night Owl",        "Completed a session after 10 PM",       "SPECIAL", 15},
        {"weekend_warrior",  "Weekend Warrior",  "Completed a session on a weekend",      "SPECIAL", 10},
    };

    // Schedule / time-blocking achievements
    private static final Object[][] SCHEDULE_ACHIEVEMENTS = {
        {"first_time_block",   "Planner",           "Created your first time block",                 "SCHEDULE", 10},
        {"day_architect",      "Day Architect",      "Planned 5 or more blocks in a single day",      "SCHEDULE", 20},
        {"schedule_warrior",   "Schedule Warrior",   "Planned blocks across 7 different days",         "SCHEDULE", 30},
        {"gcal_connected",     "Synced",             "Linked Google Calendar to your schedule",        "SCHEDULE", 15},
    };

    // ─── Public entry points ───────────────────────────────────────────────────

    public List<String> checkAndGrantAchievements(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            log.warn("Achievement check skipped — user not found: {}", userEmail);
            return List.of();
        }
        List<String> newlyUnlocked = new java.util.ArrayList<>();
        try {
            newlyUnlocked.addAll(checkSessionAchievements(userId));
            newlyUnlocked.addAll(checkStreakAchievements(userId));
            newlyUnlocked.addAll(checkGoldAchievements(userId));
            newlyUnlocked.addAll(checkHoursAchievements(userId));
            newlyUnlocked.addAll(checkDailyAchievements(userId));
            newlyUnlocked.addAll(checkSpecialAchievements(userId));
        } catch (Exception e) {
            log.error("Achievement check failed for user {}: {}", userId, e.getMessage());
        }
        return newlyUnlocked;
    }

    public List<String> checkScheduleBlockAchievements(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) return List.of();
        List<String> newlyUnlocked = new java.util.ArrayList<>();
        try {
            int totalBlocks = queryInt("SELECT COUNT(*) FROM time_blocks WHERE user_id = ?", userId);
            int daysWithBlocks = queryInt(
                "SELECT COUNT(DISTINCT date) FROM time_blocks WHERE user_id = ?", userId);
            int maxBlocksOneDay = queryInt(
                "SELECT COALESCE(MAX(cnt),0) FROM (SELECT COUNT(*) cnt FROM time_blocks WHERE user_id = ? GROUP BY date) t", userId);

            for (Object[] def : SCHEDULE_ACHIEVEMENTS) {
                String key = (String) def[0];
                boolean earned = switch (key) {
                    case "first_time_block"  -> totalBlocks >= 1;
                    case "day_architect"     -> maxBlocksOneDay >= 5;
                    case "schedule_warrior"  -> daysWithBlocks >= 7;
                    default -> false;
                };
                if (earned && grant(userId, def)) newlyUnlocked.add((String) def[1]);
            }
        } catch (Exception e) {
            log.error("Schedule achievement check failed for user {}: {}", userId, e.getMessage());
        }
        return newlyUnlocked;
    }

    public void checkGCalAchievement(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) return;
        for (Object[] def : SCHEDULE_ACHIEVEMENTS) {
            if ("gcal_connected".equals(def[0])) {
                grant(userId, def);
                break;
            }
        }
    }

    // ─── Category checkers ────────────────────────────────────────────────────

    private List<String> checkSessionAchievements(Long userId) {
        int total = queryInt(
            "SELECT COALESCE(SUM(pomodoros_completed), 0) FROM pomodoro_sessions WHERE user_id = ?", userId);
        List<String> unlocked = new java.util.ArrayList<>();
        for (Object[] def : SESSION_MILESTONES) {
            if (total >= (int) def[0] && grant(userId, def)) unlocked.add((String) def[1]);
        }
        return unlocked;
    }

    private List<String> checkStreakAchievements(Long userId) {
        int streak = queryInt(
            "SELECT COALESCE(current_streak, 0) FROM userstats WHERE user_id = ?", userId);
        List<String> unlocked = new java.util.ArrayList<>();
        for (Object[] def : STREAK_MILESTONES) {
            if (streak >= (int) def[0] && grant(userId, def)) unlocked.add((String) def[1]);
        }
        return unlocked;
    }

    private List<String> checkGoldAchievements(Long userId) {
        int totalEarned = queryInt(
            "SELECT COALESCE(SUM(amount), 0) FROM gold_transactions WHERE user_id = ? AND transaction_type = 'EARN'", userId);
        List<String> unlocked = new java.util.ArrayList<>();
        for (Object[] def : GOLD_MILESTONES) {
            if (totalEarned >= (int) def[0] && grant(userId, def)) unlocked.add((String) def[1]);
        }
        return unlocked;
    }

    private List<String> checkHoursAchievements(Long userId) {
        int totalMinutes = queryInt(
            "SELECT COALESCE(SUM(duration_minutes), 0) FROM pomodoro_sessions WHERE user_id = ?", userId);
        double hours = totalMinutes / 60.0;
        List<String> unlocked = new java.util.ArrayList<>();
        for (Object[] def : HOURS_MILESTONES) {
            if (hours >= (int) def[0] && grant(userId, def)) unlocked.add((String) def[1]);
        }
        return unlocked;
    }

    private List<String> checkDailyAchievements(Long userId) {
        int todaySessions = queryInt(
            "SELECT COALESCE(SUM(pomodoros_completed), 0) FROM pomodoro_sessions WHERE user_id = ? AND DATE(start_time) = CURDATE()", userId);
        List<String> unlocked = new java.util.ArrayList<>();
        for (Object[] def : DAILY_MILESTONES) {
            if (todaySessions >= (int) def[0] && grant(userId, def)) unlocked.add((String) def[1]);
        }
        return unlocked;
    }

    private List<String> checkSpecialAchievements(Long userId) {
        int currentHour = java.time.LocalTime.now().getHour();
        int dayOfWeek   = java.time.LocalDate.now().getDayOfWeek().getValue(); // 1=Mon, 7=Sun
        List<String> unlocked = new java.util.ArrayList<>();
        for (Object[] def : SPECIAL_ACHIEVEMENTS) {
            String key = (String) def[0];
            boolean earned = switch (key) {
                case "early_bird"      -> currentHour < 8;
                case "night_owl"       -> currentHour >= 22;
                case "weekend_warrior" -> dayOfWeek >= 6;
                default -> false;
            };
            if (earned && grant(userId, def)) unlocked.add((String) def[1]);
        }
        return unlocked;
    }

    // ─── Grant helper ─────────────────────────────────────────────────────────

    /** Returns true if the achievement was newly granted, false if already owned. */
    private boolean grant(Long userId, Object[] def) {
        String name        = (String) def[1];
        String description = (String) def[2];
        String type        = (String) def[3];
        int    goldReward  = (int)    def[4];

        Integer existing = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM achievements WHERE user_id = ? AND name = ?",
            Integer.class, userId, name);
        if (existing != null && existing > 0) return false;

        jdbcTemplate.update(
            "INSERT INTO achievements (user_id, name, description, achieved_date, achievement_type, gold_reward) " +
            "VALUES (?, ?, ?, CURDATE(), ?, ?)",
            userId, name, description, type, goldReward);

        if (goldReward > 0) {
            jdbcTemplate.update(
                "UPDATE user SET gold = gold + ? WHERE user_id = ?",
                goldReward, userId);
            jdbcTemplate.update(
                "INSERT INTO gold_transactions (user_id, amount, transaction_type, description) VALUES (?, ?, 'EARN', ?)",
                userId, goldReward, "Achievement unlocked: " + name);
        }

        log.info("Achievement unlocked: '{}' for user {} (+{} gold)", name, userId, goldReward);
        return true;
    }

    // ─── Utility ──────────────────────────────────────────────────────────────

    private int queryInt(String sql, Object... args) {
        try {
            Integer val = jdbcTemplate.queryForObject(sql, Integer.class, args);
            return val != null ? val : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}
