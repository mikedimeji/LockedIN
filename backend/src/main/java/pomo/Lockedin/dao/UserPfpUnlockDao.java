package pomo.Lockedin.dao;

import pomo.Lockedin.entities.UserPfpUnlock;
import java.util.List;

public interface UserPfpUnlockDao {
    List<UserPfpUnlock> getUnlockedPfpsByUserId(Long userId);
    List<String> getUnlockedPfpPathsByUserId(Long userId);
    boolean existsByUserIdAndPfpPath(Long userId, String pfpPath);
    boolean savePfpUnlock(UserPfpUnlock unlock);
}
