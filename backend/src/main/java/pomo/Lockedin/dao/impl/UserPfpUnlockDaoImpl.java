package pomo.Lockedin.dao.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.UserPfpUnlockDao;
import pomo.Lockedin.entities.UserPfpUnlock;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Repository
public class UserPfpUnlockDaoImpl implements UserPfpUnlockDao {

    private final JdbcTemplate jdbcTemplate;

    public UserPfpUnlockDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<UserPfpUnlock> getUnlockedPfpsByUserId(Long userId) {
        try {
            String sql = "SELECT * FROM user_pfp_unlocks WHERE user_id = ? ORDER BY unlocked_date DESC";
            return jdbcTemplate.query(sql, new UserPfpUnlockRowMapper(), userId);
        } catch (Exception e) {
            log.error("Error retrieving unlocked PFPs for user ID {}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<String> getUnlockedPfpPathsByUserId(Long userId) {
        try {
            String sql = "SELECT pfp_path FROM user_pfp_unlocks WHERE user_id = ?";
            return jdbcTemplate.queryForList(sql, String.class, userId);
        } catch (Exception e) {
            log.error("Error retrieving unlocked PFP paths for user ID {}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public boolean existsByUserIdAndPfpPath(Long userId, String pfpPath) {
        try {
            String sql = "SELECT COUNT(*) FROM user_pfp_unlocks WHERE user_id = ? AND pfp_path = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId, pfpPath);
            return count != null && count > 0;
        } catch (Exception e) {
            log.error("Error checking if PFP exists for user ID {} and path {}: {}", userId, pfpPath, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean savePfpUnlock(UserPfpUnlock unlock) {
        try {
            String sql = "INSERT INTO user_pfp_unlocks (user_id, pfp_path, pfp_name, gold_cost, unlocked_date) " +
                    "VALUES (?, ?, ?, ?, ?)";

            int rowsAffected = jdbcTemplate.update(sql,
                    unlock.getUserId(),
                    unlock.getPfpPath(),
                    unlock.getPfpName(),
                    unlock.getGoldCost(),
                    unlock.getUnlockedDate() != null ? unlock.getUnlockedDate() : LocalDateTime.now());

            return rowsAffected == 1;
        } catch (Exception e) {
            log.error("Error saving PFP unlock for user ID {}: {}", unlock.getUserId(), e.getMessage());
            return false;
        }
    }

    private static class UserPfpUnlockRowMapper implements RowMapper<UserPfpUnlock> {
        @Override
        public UserPfpUnlock mapRow(ResultSet rs, int rowNum) throws SQLException {
            return UserPfpUnlock.builder()
                    .id(rs.getLong("id"))
                    .userId(rs.getLong("user_id"))
                    .pfpPath(rs.getString("pfp_path"))
                    .pfpName(rs.getString("pfp_name"))
                    .goldCost(rs.getInt("gold_cost"))
                    .unlockedDate(rs.getTimestamp("unlocked_date") != null ?
                            rs.getTimestamp("unlocked_date").toLocalDateTime() : null)
                    .build();
        }
    }
}
