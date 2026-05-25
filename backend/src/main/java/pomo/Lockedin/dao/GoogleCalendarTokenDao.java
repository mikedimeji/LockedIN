package pomo.Lockedin.dao;

import java.util.Optional;

public interface GoogleCalendarTokenDao {
    boolean exists(Long userId);
    Optional<GoogleCalendarToken> find(Long userId);
    void save(Long userId, String accessToken, String refreshToken, long expiresAt);
    void updateAccessToken(Long userId, String accessToken, long expiresAt);
    void delete(Long userId);

    record GoogleCalendarToken(Long userId, String accessToken, String refreshToken, long expiresAt) {}
}
