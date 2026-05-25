package pomo.Lockedin.dao.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.GoogleCalendarTokenDao;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class GoogleCalendarTokenDaoImpl implements GoogleCalendarTokenDao {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean exists(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM google_calendar_tokens WHERE user_id = ?", Integer.class, userId);
        return count != null && count > 0;
    }

    @Override
    public Optional<GoogleCalendarToken> find(Long userId) {
        try {
            GoogleCalendarToken token = jdbcTemplate.queryForObject(
                    "SELECT user_id, access_token, refresh_token, expires_at " +
                    "FROM google_calendar_tokens WHERE user_id = ?",
                    (rs, rowNum) -> new GoogleCalendarToken(
                            rs.getLong("user_id"),
                            rs.getString("access_token"),
                            rs.getString("refresh_token"),
                            rs.getLong("expires_at")),
                    userId);
            return Optional.ofNullable(token);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public void save(Long userId, String accessToken, String refreshToken, long expiresAt) {
        jdbcTemplate.update(
                "INSERT INTO google_calendar_tokens (user_id, access_token, refresh_token, expires_at) " +
                "VALUES (?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE " +
                "access_token = ?, refresh_token = COALESCE(?, refresh_token), expires_at = ?",
                userId, accessToken, refreshToken, expiresAt,
                accessToken, refreshToken, expiresAt);
    }

    @Override
    public void updateAccessToken(Long userId, String accessToken, long expiresAt) {
        jdbcTemplate.update(
                "UPDATE google_calendar_tokens SET access_token = ?, expires_at = ? WHERE user_id = ?",
                accessToken, expiresAt, userId);
    }

    @Override
    public void delete(Long userId) {
        jdbcTemplate.update("DELETE FROM google_calendar_tokens WHERE user_id = ?", userId);
    }
}
