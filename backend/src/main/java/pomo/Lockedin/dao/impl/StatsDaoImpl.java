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
import java.util.List;
import java.util.Map;

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
        List<DailyStreakDTO> history = new ArrayList<>();
        LocalDate today = LocalDate.now();

        try {
            // Get the current streak info from userstats
            String streakSql = "SELECT current_streak, last_pomodoro_date FROM userstats WHERE user_id = ?";
            Map<String, Object> userStats = jdbcTemplate.queryForMap(streakSql, userId);

            int currentStreak = ((Number) userStats.getOrDefault("current_streak", 0)).intValue();
            LocalDate lastPomodoroDate = null;
            if (userStats.get("last_pomodoro_date") != null) {
                lastPomodoroDate = ((java.sql.Date) userStats.get("last_pomodoro_date")).toLocalDate();
            }

            // Get pomodoro completion dates for the last 'days' days
            String pomodoroDatesSql = "SELECT DISTINCT date(start_time) as completion_date " +
                    "FROM pomodoro_sessions " +
                    "WHERE user_id = ? AND date(start_time) >= DATE_SUB(CURDATE(), INTERVAL ? DAY) " +
                    "ORDER BY completion_date";

            List<LocalDate> completionDates = jdbcTemplate.query(
                    pomodoroDatesSql,
                    (rs, rowNum) -> rs.getDate("completion_date").toLocalDate(),
                    userId, days
            );

            // Build streak history by working backwards from current streak
            int streakValue = currentStreak;
            for (int i = 0; i < days; i++) {
                LocalDate date = today.minusDays(i);

                // If this date is after the last pomodoro date, streak was 0
                if (lastPomodoroDate != null && date.isAfter(lastPomodoroDate) && !date.isEqual(lastPomodoroDate)) {
                    streakValue = 0;
                }

                // If this date is not in completion dates, and it's not today, streak was broken
                if (!completionDates.contains(date) && !date.isEqual(today)) {
                    streakValue = 0;
                }

                // Add to history (in reverse order as we're going backwards)
                history.add(0, DailyStreakDTO.builder()
                        .date(date)
                        .streakValue(streakValue)
                        .build());

                // If streak was 0 but the previous day had a pomodoro, start a new streak count
                if (streakValue == 0 && completionDates.contains(date.minusDays(1))) {
                    streakValue = 1;
                } else if (streakValue > 0 && completionDates.contains(date.minusDays(1))) {
                    // If maintaining a streak and previous day had pomodoro, increment streak going backwards
                    streakValue++;
                }
            }

            return history;
        } catch (Exception e) {
            log.error("Error retrieving streak history for user ID {}: {}", userId, e.getMessage(), e);

            // If we can't get real data, generate empty streak history
            for (int i = 0; i < days; i++) {
                LocalDate date = today.minusDays(days - i - 1);
                history.add(DailyStreakDTO.builder()
                        .date(date)
                        .streakValue(0)
                        .build());
            }
            return history;
        }
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
            String sql = "SELECT id, name, achieved_date, description FROM achievements " +
                    "WHERE user_id = ? ORDER BY achieved_date DESC";

            return jdbcTemplate.query(sql, (rs, rowNum) -> AchievementDTO.builder()
                    .id(rs.getLong("id"))
                    .name(rs.getString("name"))
                    .date(rs.getDate("achieved_date").toLocalDate().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")))
                    .description(rs.getString("description"))
                    .build(), userId);
        } catch (Exception e) {
            log.error("Error retrieving achievements for user ID {}: {}", userId, e.getMessage());
            // Return empty list instead of sample data
            return new ArrayList<>();
        }
    }
}
