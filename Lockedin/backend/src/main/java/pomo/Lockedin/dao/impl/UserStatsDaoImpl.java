package pomo.Lockedin.dao.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.UserStatsDao;
import pomo.Lockedin.entities.UserStats;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Repository
public class UserStatsDaoImpl implements UserStatsDao {

    private final JdbcTemplate jdbcTemplate;

    public UserStatsDaoImpl(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void createUserStats(UserStats userStats) {
        String sql = "INSERT INTO userstats (user_id, hours_spent_revising_per_day, days_revised_in_a_row, " +
                "total_hours_revised, current_streak, longest_streak, last_pomodoro_date) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        jdbcTemplate.update(sql,
                userStats.getUserId(),
                userStats.getHoursSpentRevisingPerDay(),
                userStats.getDaysRevisedInARow(),
                userStats.getTotalHoursRevised(),
                userStats.getCurrentStreak(),
                userStats.getLongestStreak(),
                userStats.getLastPomodoroDate());
    }

    @Override
    public Optional<UserStats> getUserStatsByUserId(Long userId) {
        String sql = "SELECT * FROM userstats WHERE user_id = ?";
        try {
            UserStats userStats = jdbcTemplate.queryForObject(sql, new UserStatsRowMapper(), userId);
            return Optional.ofNullable(userStats);
        } catch (Exception e) {
            log.debug("No stats found for user ID: {}", userId);
            return Optional.empty();
        }
    }

    @Override
    public void updateUserStats(UserStats userStats) {
        String sql = "UPDATE userstats SET " +
                "hours_spent_revising_per_day = ?, " +
                "days_revised_in_a_row = ?, " +
                "total_hours_revised = ?, " +
                "current_streak = ?, " +
                "longest_streak = ?, " +
                "last_pomodoro_date = ? " +
                "WHERE user_id = ?";

        jdbcTemplate.update(sql,
                userStats.getHoursSpentRevisingPerDay(),
                userStats.getDaysRevisedInARow(),
                userStats.getTotalHoursRevised(),
                userStats.getCurrentStreak(),
                userStats.getLongestStreak(),
                userStats.getLastPomodoroDate(),
                userStats.getUserId());
    }

    @Override
    public void updateLastPomodoroDate(Long userId, LocalDate date) {
        String sql = "UPDATE userstats SET last_pomodoro_date = ? WHERE user_id = ?";
        jdbcTemplate.update(sql, date, userId);
    }

    @Override
    public void updateStreak(Long userId, int currentStreak, int longestStreak) {
        String sql = "UPDATE userstats SET current_streak = ?, longest_streak = ? WHERE user_id = ?";
        jdbcTemplate.update(sql, currentStreak, longestStreak, userId);
    }

    @Override
    public void resetStreakForInactiveUsers(LocalDate cutoffDate) {
        String sql = "UPDATE userstats SET current_streak = 0 WHERE last_pomodoro_date < ? OR last_pomodoro_date IS NULL";
        int updatedRows = jdbcTemplate.update(sql, cutoffDate);
        log.info("Reset streaks for {} users who were inactive after {}", updatedRows, cutoffDate);
    }

    public static class UserStatsRowMapper implements RowMapper<UserStats> {
        @Override
        public UserStats mapRow(ResultSet rs, int rowNum) throws SQLException {
            return UserStats.builder()
                    .statsId(rs.getLong("user_stats_id"))  // Updated column name
                    .userId(rs.getLong("user_id"))
                    .hoursSpentRevisingPerDay(rs.getFloat("hours_spent_revising_per_day"))
                    .daysRevisedInARow(rs.getInt("days_revised_in_a_row"))
                    .totalHoursRevised(rs.getFloat("total_hours_revised"))
                    .currentStreak(rs.getInt("current_streak"))
                    .longestStreak(rs.getInt("longest_streak"))
                    .lastPomodoroDate(rs.getDate("last_pomodoro_date") != null ?
                            rs.getDate("last_pomodoro_date").toLocalDate() : null)
                    .build();
        }
    }
}
