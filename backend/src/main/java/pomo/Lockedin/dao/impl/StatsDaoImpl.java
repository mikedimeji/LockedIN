package pomo.Lockedin.dao.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.StatsDao;
import pomo.Lockedin.dto.AchievementDTO;
import pomo.Lockedin.service.StatsService.DailyStreakDTO;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Repository
public class StatsDaoImpl implements StatsDao {

    private final JdbcTemplate jdbcTemplate;

    public StatsDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public int getTotalPomodorosCompleted(Long userId) {
        try {
            String sql = "SELECT COALESCE(SUM(pomodoros_completed), 0) FROM pomodoro_sessions WHERE user_id = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("Error retrieving total pomodoros for user ID {}: {}", userId, e.getMessage());
            return 0; // Default value if not found
        }
    }

    @Override
    public double getTotalHoursRevised(Long userId) {
        try {
            String sql = "SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 FROM pomodoro_sessions WHERE user_id = ?";
            Double hours = jdbcTemplate.queryForObject(sql, Double.class, userId);
            return hours != null ? hours : 0.0;
        } catch (Exception e) {
            log.error("Error retrieving total hours for user ID {}: {}", userId, e.getMessage());
            return 0.0; // Default value if not found
        }
    }

    @Override
    public List<Integer> getPomodorosCompletedPerDayLastWeek(Long userId) {
        try {
            // First, create a result template with zeros for all days of the week
            List<Integer> resultTemplate = Arrays.asList(0, 0, 0, 0, 0, 0, 0); // Default zeros for each day

            // Query to get pomodoros completed per day in the last week
            String sql = "SELECT DAYOFWEEK(date(start_time))-1 as day_index, " +
                    "COALESCE(SUM(pomodoros_completed), 0) as count " +
                    "FROM pomodoro_sessions " +
                    "WHERE user_id = ? AND date(start_time) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) " +
                    "GROUP BY DAYOFWEEK(date(start_time)) " +
                    "ORDER BY DAYOFWEEK(date(start_time))";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, userId);

            // If we have data, replace zeros in the template with actual values
            if (!rows.isEmpty()) {
                List<Integer> result = new ArrayList<>(resultTemplate);
                for (Map<String, Object> row : rows) {
                    int dayIndex = ((Number) row.get("day_index")).intValue();
                    int count = ((Number) row.get("count")).intValue();
                    // Adjust index for days of week (0 = Monday, 6 = Sunday)
                    dayIndex = (dayIndex + 6) % 7; // Convert from DAYOFWEEK (1=Sunday) to our format (0=Monday)
                    if (dayIndex >= 0 && dayIndex < 7) {
                        result.set(dayIndex, count);
                    }
                }
                return result;
            }

            return resultTemplate;
        } catch (Exception e) {
            log.error("Error retrieving weekly pomodoros for user ID {}: {}", userId, e.getMessage());
            return Arrays.asList(0, 0, 0, 0, 0, 0, 0);
        }
    }

    @Override
    public List<Double> getHoursCompletedPerDayLastWeek(Long userId) {
        try {
            // First, create a result template with zeros for all days of the week
            List<Double> resultTemplate = Arrays.asList(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0); // Default zeros for each day

            // Query to get hours completed per day in the last week
            String sql = "SELECT DAYOFWEEK(date(start_time))-1 as day_index, " +
                    "COALESCE(SUM(duration_minutes), 0) / 60.0 as hours " +
                    "FROM pomodoro_sessions " +
                    "WHERE user_id = ? AND date(start_time) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) " +
                    "GROUP BY DAYOFWEEK(date(start_time)) " +
                    "ORDER BY DAYOFWEEK(date(start_time))";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, userId);

            // If we have data, replace zeros in the template with actual values
            if (!rows.isEmpty()) {
                List<Double> result = new ArrayList<>(resultTemplate);
                for (Map<String, Object> row : rows) {
                    int dayIndex = ((Number) row.get("day_index")).intValue();
                    double hours = ((Number) row.get("hours")).doubleValue();
                    // Adjust index for days of week (0 = Monday, 6 = Sunday)
                    dayIndex = (dayIndex + 6) % 7; // Convert from DAYOFWEEK (1=Sunday) to our format (0=Monday)
                    if (dayIndex >= 0 && dayIndex < 7) {
                        result.set(dayIndex, hours);
                    }
                }
                return result;
            }

            return resultTemplate;
        } catch (Exception e) {
            log.error("Error retrieving weekly hours for user ID {}: {}", userId, e.getMessage());
            return Arrays.asList(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        }
    }

    @Override
    public List<DailyStreakDTO> getStreakHistory(Long userId, int days) {
        LocalDate today = LocalDate.now();
        List<DailyStreakDTO> history = new ArrayList<>();
        try {
            Set<LocalDate> sessionSet = getSessionDateSet(userId);

            for (int i = days - 1; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                int streak = 0;
                LocalDate cursor = date;
                while (sessionSet.contains(cursor)) {
                    streak++;
                    cursor = cursor.minusDays(1);
                }
                history.add(DailyStreakDTO.builder().date(date).streakValue(streak).build());
            }
            return history;
        } catch (Exception e) {
            log.error("Error retrieving streak history for user ID {}: {}", userId, e.getMessage(), e);
            for (int i = days - 1; i >= 0; i--) {
                history.add(DailyStreakDTO.builder().date(today.minusDays(i)).streakValue(0).build());
            }
            return history;
        }
    }

    @Override
    public int computeCurrentStreak(Long userId) {
        try {
            Set<LocalDate> sessionSet = getSessionDateSet(userId);
            LocalDate today = LocalDate.now();
            // Accept streak starting from today or yesterday
            LocalDate start = sessionSet.contains(today) ? today : today.minusDays(1);
            if (!sessionSet.contains(start)) return 0;
            int streak = 0;
            LocalDate cursor = start;
            while (sessionSet.contains(cursor)) {
                streak++;
                cursor = cursor.minusDays(1);
            }
            return streak;
        } catch (Exception e) {
            log.error("Error computing current streak for user ID {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    @Override
    public int computeLongestStreak(Long userId) {
        try {
            List<LocalDate> dates = jdbcTemplate.query(
                "SELECT DISTINCT DATE(start_time) as d FROM pomodoro_sessions WHERE user_id = ? ORDER BY d ASC",
                (rs, row) -> rs.getDate("d").toLocalDate(), userId);
            int longest = 0, run = 0;
            LocalDate prev = null;
            for (LocalDate d : dates) {
                if (prev != null && d.minusDays(1).equals(prev)) {
                    run++;
                } else {
                    run = 1;
                }
                if (run > longest) longest = run;
                prev = d;
            }
            return longest;
        } catch (Exception e) {
            log.error("Error computing longest streak for user ID {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    private Set<LocalDate> getSessionDateSet(Long userId) {
        List<LocalDate> dates = jdbcTemplate.query(
            "SELECT DISTINCT DATE(start_time) as d FROM pomodoro_sessions WHERE user_id = ?",
            (rs, row) -> rs.getDate("d").toLocalDate(), userId);
        return new HashSet<>(dates);
    }

    @Override
    public List<Map<String, Object>> getTrend(Long userId, int days) {
        try {
            String sql = "SELECT DATE(start_time) as day, COALESCE(SUM(pomodoros_completed), 0) as count " +
                         "FROM pomodoro_sessions WHERE user_id = ? AND DATE(start_time) >= DATE_SUB(CURDATE(), INTERVAL ? DAY) " +
                         "GROUP BY DATE(start_time) ORDER BY day";
            return jdbcTemplate.queryForList(sql, userId, days);
        } catch (Exception e) {
            log.error("Error getting trend for user {}: {}", userId, e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public List<Map<String, Object>> getHeatmap(Long userId) {
        try {
            String sql = "SELECT DAYOFWEEK(start_time) as dow, HOUR(start_time) as hr, COUNT(*) as cnt " +
                         "FROM pomodoro_sessions WHERE user_id = ? GROUP BY dow, hr";
            return jdbcTemplate.queryForList(sql, userId);
        } catch (Exception e) {
            log.error("Error getting heatmap for user {}: {}", userId, e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public List<AchievementDTO> getUserAchievements(Long userId) {
        try {
            String sql = "SELECT id, name, achieved_date, description, COALESCE(gold_reward, 0) AS gold_reward " +
                    "FROM achievements WHERE user_id = ? ORDER BY achieved_date DESC";

            return jdbcTemplate.query(sql, (rs, rowNum) -> AchievementDTO.builder()
                    .id(rs.getLong("id"))
                    .name(rs.getString("name"))
                    .date(rs.getDate("achieved_date").toLocalDate().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")))
                    .description(rs.getString("description"))
                    .goldReward(rs.getInt("gold_reward"))
                    .build(), userId);
        } catch (Exception e) {
            log.error("Error retrieving achievements for user ID {}: {}", userId, e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public void saveSession(Long userId, String startTime, String endTime,
                            int durationMinutes, int pomodorosCompleted, int pauseCount, String subject) {
        try {
            String sql = "INSERT INTO pomodoro_sessions " +
                         "(user_id, start_time, end_time, duration_minutes, pomodoros_completed, pause_count, subject) " +
                         "VALUES (?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql, userId, startTime, endTime, durationMinutes, pomodorosCompleted, pauseCount,
                    (subject != null && !subject.isBlank()) ? subject : null);
        } catch (Exception e) {
            log.error("Error saving session for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> getSubjectBreakdown(Long userId) {
        try {
            String sql = "SELECT subject, SUM(duration_minutes) as total_minutes, COUNT(*) as session_count " +
                         "FROM pomodoro_sessions WHERE user_id = ? AND subject IS NOT NULL AND subject != '' " +
                         "GROUP BY subject ORDER BY total_minutes DESC";
            return jdbcTemplate.queryForList(sql, userId);
        } catch (Exception e) {
            log.error("Error getting subject breakdown for user {}: {}", userId, e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public void tagLatestSession(Long userId, String subject) {
        try {
            String sql = "UPDATE pomodoro_sessions SET subject = ? " +
                         "WHERE user_id = ? ORDER BY start_time DESC LIMIT 1";
            jdbcTemplate.update(sql, subject != null ? subject.trim() : null, userId);
        } catch (Exception e) {
            log.error("Error tagging latest session for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    public int getTodaySessions(Long userId) {
        try {
            Integer v = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(pomodoros_completed), 0) FROM pomodoro_sessions WHERE user_id = ? AND DATE(start_time) = CURDATE()",
                Integer.class, userId);
            return v != null ? v : 0;
        } catch (Exception e) { return 0; }
    }

    @Override
    public int getTodayMinutes(Long userId) {
        try {
            Integer v = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(duration_minutes), 0) FROM pomodoro_sessions WHERE user_id = ? AND DATE(start_time) = CURDATE()",
                Integer.class, userId);
            return v != null ? v : 0;
        } catch (Exception e) { return 0; }
    }

    @Override
    public int getBestDaySessions(Long userId) {
        try {
            Integer v = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(cnt), 0) FROM (SELECT SUM(pomodoros_completed) cnt FROM pomodoro_sessions WHERE user_id = ? GROUP BY DATE(start_time)) t",
                Integer.class, userId);
            return v != null ? v : 0;
        } catch (Exception e) { return 0; }
    }

    @Override
    public int getThisWeekSessions(Long userId) {
        try {
            Integer v = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(pomodoros_completed), 0) FROM pomodoro_sessions WHERE user_id = ? AND DATE(start_time) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)",
                Integer.class, userId);
            return v != null ? v : 0;
        } catch (Exception e) { return 0; }
    }

    @Override
    public int getLastWeekSessions(Long userId) {
        try {
            Integer v = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(pomodoros_completed), 0) FROM pomodoro_sessions WHERE user_id = ? AND DATE(start_time) BETWEEN DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
                Integer.class, userId);
            return v != null ? v : 0;
        } catch (Exception e) { return 0; }
    }

    @Override
    public int getFocusScore(Long userId) {
        try {
            String sessionsSql = "SELECT COUNT(*) FROM pomodoro_sessions " +
                                 "WHERE user_id = ? AND start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            Integer sessionsThisWeek = jdbcTemplate.queryForObject(sessionsSql, Integer.class, userId);

            String pauseSql = "SELECT COALESCE(AVG(pause_count), 0) FROM pomodoro_sessions " +
                              "WHERE user_id = ? AND start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            Double avgPauses = jdbcTemplate.queryForObject(pauseSql, Double.class, userId);

            int streak = computeCurrentStreak(userId);
            int sessions = sessionsThisWeek != null ? sessionsThisWeek : 0;
            double pauses = avgPauses != null ? avgPauses : 0;

            // sessions*5 → need 14+/wk to approach 100; streak capped at 30 pts; pauses subtract
            int score = (int) (sessions * 5 + Math.min(30, streak) - pauses * 4);
            return Math.min(100, Math.max(0, score));
        } catch (Exception e) {
            log.error("Error computing focus score for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }
}
