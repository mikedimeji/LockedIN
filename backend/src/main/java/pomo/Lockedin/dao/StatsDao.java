package pomo.Lockedin.dao;

import pomo.Lockedin.dto.AchievementDTO;
import pomo.Lockedin.service.StatsService.DailyStreakDTO;

import java.util.List;
import java.util.Map;

public interface StatsDao {
    /**
     * Get the total number of pomodoros completed by a user
     *
     * @param userId User ID
     * @return Total number of pomodoros completed
     */
    int getTotalPomodorosCompleted(Long userId);

    /**
     * Get the total hours spent in pomodoro sessions
     *
     * @param userId User ID
     * @return Total hours spent
     */
    double getTotalHoursRevised(Long userId);

    /**
     * Get daily pomodoro counts for the past week
     *
     * @param userId User ID
     * @return List of pomodoro counts for each day of the week
     */
    List<Integer> getPomodorosCompletedPerDayLastWeek(Long userId);

    /**
     * Get daily hours spent for the past week
     *
     * @param userId User ID
     * @return List of hours spent for each day of the week
     */
    List<Double> getHoursCompletedPerDayLastWeek(Long userId);

    /**
     * Get the streak history for a user
     *
     * @param userId User ID
     * @param days Number of days of history to retrieve
     * @return List of daily streak values
     */
    List<DailyStreakDTO> getStreakHistory(Long userId, int days);

    /**
     * Get user achievements
     *
     * @param userId User ID
     * @return List of user achievements
     */
    List<AchievementDTO> getUserAchievements(Long userId);

    /**
     * Get daily session counts for the past N days (for trend chart)
     */
    List<Map<String, Object>> getTrend(Long userId, int days);

    /**
     * Get session counts grouped by day-of-week × hour (for heatmap)
     */
    List<Map<String, Object>> getHeatmap(Long userId);

    /** Compute current streak from actual session dates (no userstats dependency) */
    int computeCurrentStreak(Long userId);

    /** Compute longest streak ever from actual session dates (no userstats dependency) */
    int computeLongestStreak(Long userId);

    /** Save a completed session record */
    void saveSession(Long userId, String startTime, String endTime, int durationMinutes,
                     int pomodorosCompleted, int pauseCount, String subject);

    /** Minutes studied per subject (all time) */
    List<Map<String, Object>> getSubjectBreakdown(Long userId);

    /** Focus score 0-100 based on sessions and consistency this week */
    int getFocusScore(Long userId);
}
