package pomo.Lockedin.dao;

import pomo.Lockedin.entities.UserProfile;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserProfileDao {
    Optional<UserProfile> findByUserId(Long userId);
    void insert(UserProfile profile);
    void update(UserProfile profile);
    void markSkipped(Long userId, LocalDateTime skippedAt);
}
