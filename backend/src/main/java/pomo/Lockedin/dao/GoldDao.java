package pomo.Lockedin.dao;

import java.util.List;

public interface GoldDao {
    /**
     * Get gold earned per day for the last week
     * @param userId The user's ID
     * @return List of integers with gold earned for each day (Mon to Sun)
     */
    List<Integer> getGoldEarnedPerDayLastWeek(Long userId);

    /**
     * Get total gold earned by the user
     * @param userId The user's ID
     * @return Total gold earned
     */
    int getTotalGoldEarned(Long userId);

    /**
     * Get total gold spent by the user
     * @param userId The user's ID
     * @return Total gold spent
     */
    int getTotalGoldSpent(Long userId);
}
