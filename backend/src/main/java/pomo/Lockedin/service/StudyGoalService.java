package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dto.StudyGoalDTO;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudyGoalService {

    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;

    public List<StudyGoalDTO> getGoals(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) throw new RuntimeException("User not found: " + userEmail);

        String sql = "SELECT g.id, g.subject, g.weekly_hours_target, " +
                     "COALESCE(SUM(ps.duration_minutes), 0) / 60.0 AS weekly_hours_completed " +
                     "FROM study_goals g " +
                     "LEFT JOIN pomodoro_sessions ps ON ps.user_id = g.user_id " +
                     "  AND LOWER(ps.subject) = LOWER(g.subject) " +
                     "  AND ps.start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) " +
                     "WHERE g.user_id = ? " +
                     "GROUP BY g.id, g.subject, g.weekly_hours_target " +
                     "ORDER BY g.subject";

        return jdbcTemplate.query(sql, (rs, i) -> StudyGoalDTO.builder()
                .id(rs.getLong("id"))
                .subject(rs.getString("subject"))
                .weeklyHoursTarget(rs.getDouble("weekly_hours_target"))
                .weeklyHoursCompleted(rs.getDouble("weekly_hours_completed"))
                .build(), userId);
    }

    public StudyGoalDTO createOrUpdateGoal(String userEmail, StudyGoalDTO dto) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) throw new RuntimeException("User not found: " + userEmail);

        if (dto.getId() != null) {
            jdbcTemplate.update(
                    "UPDATE study_goals SET subject = ?, weekly_hours_target = ? WHERE id = ? AND user_id = ?",
                    dto.getSubject(), dto.getWeeklyHoursTarget(), dto.getId(), userId);
            return getGoals(userEmail).stream()
                    .filter(g -> g.getId().equals(dto.getId()))
                    .findFirst().orElse(dto);
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO study_goals (user_id, subject, weekly_hours_target) VALUES (?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE weekly_hours_target = VALUES(weekly_hours_target)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, userId);
            ps.setString(2, dto.getSubject());
            ps.setDouble(3, dto.getWeeklyHoursTarget());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        long newId = key != null ? key.longValue() :
                jdbcTemplate.queryForObject(
                        "SELECT id FROM study_goals WHERE user_id = ? AND subject = ?",
                        Long.class, userId, dto.getSubject());

        return getGoals(userEmail).stream()
                .filter(g -> g.getId() == newId)
                .findFirst()
                .orElse(StudyGoalDTO.builder().id(newId).subject(dto.getSubject())
                        .weeklyHoursTarget(dto.getWeeklyHoursTarget()).weeklyHoursCompleted(0).build());
    }

    public void deleteGoal(String userEmail, Long id) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) throw new RuntimeException("User not found: " + userEmail);
        jdbcTemplate.update("DELETE FROM study_goals WHERE id = ? AND user_id = ?", id, userId);
    }
}
