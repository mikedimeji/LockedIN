package pomo.Lockedin.dao.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.UserThemeUnlockDao;
import pomo.Lockedin.entities.UserThemeUnlock;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Repository
public class UserThemeUnlockDaoImpl implements UserThemeUnlockDao {

    private final JdbcTemplate jdbcTemplate;

    public UserThemeUnlockDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<UserThemeUnlock> getUnlockedThemesByUserId(Long userId) {
        try {
            String sql = "SELECT * FROM user_theme_unlocks WHERE user_id = ? ORDER BY unlocked_date DESC";
            return jdbcTemplate.query(sql, new UserThemeUnlockRowMapper(), userId);
        } catch (Exception e) {
            log.error("Error retrieving unlocked themes for user ID {}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<String> getUnlockedThemePathsByUserId(Long userId) {
        try {
            String sql = "SELECT theme_path FROM user_theme_unlocks WHERE user_id = ?";
            return jdbcTemplate.queryForList(sql, String.class, userId);
        } catch (Exception e) {
            log.error("Error retrieving unlocked theme paths for user ID {}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public boolean existsByUserIdAndThemePath(Long userId, String themePath) {
        try {
            String sql = "SELECT COUNT(*) FROM user_theme_unlocks WHERE user_id = ? AND theme_path = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId, themePath);
            return count != null && count > 0;
        } catch (Exception e) {
            log.error("Error checking if theme exists for user ID {} and path {}: {}", userId, themePath, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean saveThemeUnlock(UserThemeUnlock unlock) {
        try {
            String sql = "INSERT INTO user_theme_unlocks (user_id, theme_path, theme_name, gold_cost, unlocked_date) " +
                    "VALUES (?, ?, ?, ?, ?)";

            int rowsAffected = jdbcTemplate.update(sql,
                    unlock.getUserId(),
                    unlock.getThemePath(),
                    unlock.getThemeName(),
                    unlock.getGoldCost(),
                    unlock.getUnlockedDate() != null ? unlock.getUnlockedDate() : LocalDateTime.now());

            return rowsAffected == 1;
        } catch (Exception e) {
            log.error("Error saving theme unlock for user ID {}: {}", unlock.getUserId(), e.getMessage());
            return false;
        }
    }

    private static class UserThemeUnlockRowMapper implements RowMapper<UserThemeUnlock> {
        @Override
        public UserThemeUnlock mapRow(ResultSet rs, int rowNum) throws SQLException {
            return UserThemeUnlock.builder()
                    .id(rs.getLong("id"))
                    .userId(rs.getLong("user_id"))
                    .themePath(rs.getString("theme_path"))
                    .themeName(rs.getString("theme_name"))
                    .goldCost(rs.getInt("gold_cost"))
                    .unlockedDate(rs.getTimestamp("unlocked_date") != null ?
                            rs.getTimestamp("unlocked_date").toLocalDateTime() : null)
                    .build();
        }
    }
}
