// UserPreferencesDaoImpl.java
package pomo.Lockedin.dao.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.UserPreferencesDao;
import pomo.Lockedin.entities.UserPreferences;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Repository
public class UserPreferencesDaoImpl implements UserPreferencesDao {

    private final JdbcTemplate jdbcTemplate;

    public UserPreferencesDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<UserPreferences> getUserPreferencesByUserId(Long userId) {
        try {
            String sql = "SELECT * FROM user_preferences WHERE user_id = ?";
            List<UserPreferences> preferences = jdbcTemplate.query(sql, new UserPreferencesRowMapper(), userId);
            return preferences.isEmpty() ? Optional.empty() : Optional.of(preferences.get(0));
        } catch (Exception e) {
            log.error("Error retrieving user preferences for user ID {}: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public UserPreferences saveUserPreferences(UserPreferences preferences) {
        try {
            if (existsByUserId(preferences.getUserId())) {
                // Update existing preferences
                String sql = "UPDATE user_preferences SET selected_pfp = ?, selected_theme = ?, " +
                        "is_video_background = ?, show_live_themes = ?, nav_hidden = ?, updated_at = ? " +
                        "WHERE user_id = ?";

                int rowsAffected = jdbcTemplate.update(sql,
                        preferences.getSelectedPfp(),
                        preferences.getSelectedTheme(),
                        preferences.getIsVideoBackground(),
                        preferences.getShowLiveThemes(),
                        preferences.getNavHidden(),
                        LocalDateTime.now(),
                        preferences.getUserId());

                if (rowsAffected == 1) {
                    return getUserPreferencesByUserId(preferences.getUserId()).orElse(preferences);
                }
            } else {
                // Insert new preferences
                String sql = "INSERT INTO user_preferences (user_id, selected_pfp, selected_theme, " +
                        "is_video_background, show_live_themes, nav_hidden, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

                LocalDateTime now = LocalDateTime.now();
                int rowsAffected = jdbcTemplate.update(sql,
                        preferences.getUserId(),
                        preferences.getSelectedPfp(),
                        preferences.getSelectedTheme(),
                        preferences.getIsVideoBackground(),
                        preferences.getShowLiveThemes(),
                        preferences.getNavHidden(),
                        now,
                        now);

                if (rowsAffected == 1) {
                    return getUserPreferencesByUserId(preferences.getUserId()).orElse(preferences);
                }
            }
        } catch (Exception e) {
            log.error("Error saving user preferences for user ID {}: {}", preferences.getUserId(), e.getMessage());
        }
        return preferences;
    }

    @Override
    public UserPreferences createDefaultPreferences(Long userId) {
        UserPreferences defaultPrefs = UserPreferences.builder()
                .userId(userId)
                .selectedPfp("assets/images/durarara1.jpg")
                .selectedTheme("assets/videos/yumenikki.mp4")
                .isVideoBackground(true)
                .showLiveThemes(true)
                .navHidden(false)
                .build();

        return saveUserPreferences(defaultPrefs);
    }

    @Override
    public boolean existsByUserId(Long userId) {
        try {
            String sql = "SELECT COUNT(*) FROM user_preferences WHERE user_id = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            return count != null && count > 0;
        } catch (Exception e) {
            log.error("Error checking if user preferences exist for user ID {}: {}", userId, e.getMessage());
            return false;
        }
    }

    private static class UserPreferencesRowMapper implements RowMapper<UserPreferences> {
        @Override
        public UserPreferences mapRow(ResultSet rs, int rowNum) throws SQLException {
            return UserPreferences.builder()
                    .id(rs.getLong("id"))
                    .userId(rs.getLong("user_id"))
                    .selectedPfp(rs.getString("selected_pfp"))
                    .selectedTheme(rs.getString("selected_theme"))
                    .isVideoBackground(rs.getBoolean("is_video_background"))
                    .showLiveThemes(rs.getBoolean("show_live_themes"))
                    .navHidden(rs.getBoolean("nav_hidden"))
                    .createdAt(rs.getTimestamp("created_at") != null ?
                            rs.getTimestamp("created_at").toLocalDateTime() : null)
                    .updatedAt(rs.getTimestamp("updated_at") != null ?
                            rs.getTimestamp("updated_at").toLocalDateTime() : null)
                    .build();
        }
    }
}
