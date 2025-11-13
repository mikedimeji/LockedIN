package pomo.Lockedin.dao;

import pomo.Lockedin.entities.UserThemeUnlock;
import java.util.List;

public interface UserThemeUnlockDao {
    List<UserThemeUnlock> getUnlockedThemesByUserId(Long userId);
    List<String> getUnlockedThemePathsByUserId(Long userId);
    boolean existsByUserIdAndThemePath(Long userId, String themePath);
    boolean saveThemeUnlock(UserThemeUnlock unlock);
}