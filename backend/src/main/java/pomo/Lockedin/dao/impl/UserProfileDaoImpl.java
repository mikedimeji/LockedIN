package pomo.Lockedin.dao.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.UserProfileDao;
import pomo.Lockedin.entities.UserProfile;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Repository
public class UserProfileDaoImpl implements UserProfileDao {

    private final JdbcTemplate jdbcTemplate;

    public UserProfileDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<UserProfile> findByUserId(Long userId) {
        String sql = "SELECT * FROM user_profile WHERE user_id = ?";
        try {
            UserProfile profile = jdbcTemplate.queryForObject(sql, new UserProfileRowMapper(), userId);
            return Optional.ofNullable(profile);
        } catch (Exception e) {
            log.debug("No profile found for user ID: {}", userId);
            return Optional.empty();
        }
    }

    @Override
    public void insert(UserProfile p) {
        String sql = "INSERT INTO user_profile " +
                "(user_id, focus_completion_difficulty, sustained_attention_difficulty, distraction_frequency, " +
                "sleep_hours, chronotype, daily_focus_time, primary_focus_challenge, work_environment, " +
                "task_breakdown_ease, procrastination_tendency, stress_level, primary_motivation, " +
                "status, skipped_at, completed_at, is_premium_at_completion, raw_json) " +
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        jdbcTemplate.update(sql,
                p.getUserId(),
                p.getFocusCompletionDifficulty(),
                p.getSustainedAttentionDifficulty(),
                p.getDistractionFrequency(),
                p.getSleepHours(),
                p.getChronotype(),
                p.getDailyFocusTime(),
                p.getPrimaryFocusChallenge(),
                p.getWorkEnvironment(),
                p.getTaskBreakdownEase(),
                p.getProcrastinationTendency(),
                p.getStressLevel(),
                p.getPrimaryMotivation(),
                p.getStatus(),
                p.getSkippedAt() != null ? Timestamp.valueOf(p.getSkippedAt()) : null,
                p.getCompletedAt() != null ? Timestamp.valueOf(p.getCompletedAt()) : null,
                p.getIsPremiumAtCompletion(),
                p.getRawJson());
    }

    @Override
    public void update(UserProfile p) {
        String sql = "UPDATE user_profile SET " +
                "focus_completion_difficulty=?, sustained_attention_difficulty=?, distraction_frequency=?, " +
                "sleep_hours=?, chronotype=?, daily_focus_time=?, primary_focus_challenge=?, work_environment=?, " +
                "task_breakdown_ease=?, procrastination_tendency=?, stress_level=?, primary_motivation=?, " +
                "status=?, skipped_at=?, completed_at=?, is_premium_at_completion=?, raw_json=? " +
                "WHERE user_id=?";

        jdbcTemplate.update(sql,
                p.getFocusCompletionDifficulty(),
                p.getSustainedAttentionDifficulty(),
                p.getDistractionFrequency(),
                p.getSleepHours(),
                p.getChronotype(),
                p.getDailyFocusTime(),
                p.getPrimaryFocusChallenge(),
                p.getWorkEnvironment(),
                p.getTaskBreakdownEase(),
                p.getProcrastinationTendency(),
                p.getStressLevel(),
                p.getPrimaryMotivation(),
                p.getStatus(),
                p.getSkippedAt() != null ? Timestamp.valueOf(p.getSkippedAt()) : null,
                p.getCompletedAt() != null ? Timestamp.valueOf(p.getCompletedAt()) : null,
                p.getIsPremiumAtCompletion(),
                p.getRawJson(),
                p.getUserId());
    }

    @Override
    public void markSkipped(Long userId, LocalDateTime skippedAt) {
        String sql = "UPDATE user_profile SET status='skipped', skipped_at=? WHERE user_id=?";
        jdbcTemplate.update(sql, Timestamp.valueOf(skippedAt), userId);
    }

    public static class UserProfileRowMapper implements RowMapper<UserProfile> {
        @Override
        public UserProfile mapRow(ResultSet rs, int rowNum) throws SQLException {
            Timestamp skippedAt = rs.getTimestamp("skipped_at");
            Timestamp completedAt = rs.getTimestamp("completed_at");
            return UserProfile.builder()
                    .id(rs.getLong("id"))
                    .userId(rs.getLong("user_id"))
                    .focusCompletionDifficulty(rs.getString("focus_completion_difficulty"))
                    .sustainedAttentionDifficulty(rs.getString("sustained_attention_difficulty"))
                    .distractionFrequency(rs.getString("distraction_frequency"))
                    .sleepHours(rs.getString("sleep_hours"))
                    .chronotype(rs.getString("chronotype"))
                    .dailyFocusTime(rs.getString("daily_focus_time"))
                    .primaryFocusChallenge(rs.getString("primary_focus_challenge"))
                    .workEnvironment(rs.getString("work_environment"))
                    .taskBreakdownEase(rs.getString("task_breakdown_ease"))
                    .procrastinationTendency(rs.getString("procrastination_tendency"))
                    .stressLevel(rs.getString("stress_level"))
                    .primaryMotivation(rs.getString("primary_motivation"))
                    .status(rs.getString("status"))
                    .skippedAt(skippedAt != null ? skippedAt.toLocalDateTime() : null)
                    .completedAt(completedAt != null ? completedAt.toLocalDateTime() : null)
                    .isPremiumAtCompletion(rs.getBoolean("is_premium_at_completion"))
                    .rawJson(rs.getString("raw_json"))
                    .build();
        }
    }
}
