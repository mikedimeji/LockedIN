package pomo.Lockedin.dao;

import pomo.Lockedin.entities.UserPreferences;
import java.util.Optional;

public interface UserPreferencesDao {
    Optional<UserPreferences> getUserPreferencesByUserId(Long userId);
    UserPreferences saveUserPreferences(UserPreferences preferences);
    UserPreferences createDefaultPreferences(Long userId);
    boolean existsByUserId(Long userId);
}

