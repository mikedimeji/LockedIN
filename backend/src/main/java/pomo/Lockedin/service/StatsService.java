package pomo.Lockedin.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dao.StatsDao;
import pomo.Lockedin.dto.AchievementDTO;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final UserService userService;
    private final StatsDao statsDao;
    private final GoldService goldService;

    /**
     * Get total number of pomodoros completed by a user
     */
    public int getTotalPomodorosCompleted(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        return statsDao.getTotalPomodorosCompleted(userId);
    }

    /**
     * Get total hours spent in pomodoro sessions
     */
    public double getTotalHoursRevised(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        return statsDao.getTotalHoursRevised(userId);
    }

    /**
     * Get daily pomodoro counts for the past week
     */
    public List<Integer> getPomodorosCompletedPerDayLastWeek(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        return statsDao.getPomodorosCompletedPerDayLastWeek(userId);
    }

    /**
     * Get daily hours spent for the past week
     */
    public List<Double> getHoursCompletedPerDayLastWeek(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        return statsDao.getHoursCompletedPerDayLastWeek(userId);
    }

    /**
     * Get the streak history for a user
     */
    public List<DailyStreakDTO> getStreakHistory(String userEmail, int days) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        return statsDao.getStreakHistory(userId, days);
    }

    /**
     * Get 28-day daily session counts for trend chart
     */
    public Map<String, Object> getTrend(String userEmail, int days) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) throw new RuntimeException("User not found: " + userEmail);

        List<Map<String, Object>> rawData = statsDao.getTrend(userId, days);
        Map<String, Integer> byDate = new HashMap<>();
        for (Map<String, Object> row : rawData) {
            String key = row.get("day").toString().substring(0, 10);
            byDate.put(key, ((Number) row.get("count")).intValue());
        }

        LocalDate today = LocalDate.now();
        List<String> labels = new ArrayList<>();
        List<Integer> values = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM/dd");
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            labels.add(date.format(fmt));
            values.add(byDate.getOrDefault(date.toString(), 0));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("labels", labels);
        result.put("values", values);
        return result;
    }

    /**
     * Get session counts grouped into 4 time blocks × 7 days for heatmap
     */
    public int[][] getHeatmap(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) throw new RuntimeException("User not found: " + userEmail);

        List<Map<String, Object>> rawData = statsDao.getHeatmap(userId);
        int[][] grid = new int[4][7]; // [timeBlock 0-3][day Mon-Sun]

        for (Map<String, Object> row : rawData) {
            int dow = ((Number) row.get("dow")).intValue(); // MySQL: 1=Sun, 2=Mon...7=Sat
            int hr  = ((Number) row.get("hr")).intValue();
            int cnt = ((Number) row.get("cnt")).intValue();

            int dayIndex = (dow == 1) ? 6 : dow - 2; // 0=Mon...6=Sun
            int block = (hr >= 6 && hr < 12) ? 1 : (hr >= 12 && hr < 17) ? 2 : (hr >= 17 && hr < 22) ? 3 : 0;

            if (dayIndex >= 0 && dayIndex < 7) {
                grid[block][dayIndex] += cnt;
            }
        }
        return grid;
    }

    public void saveSession(String userEmail, String startTime, String endTime,
                            int durationMinutes, int pomodorosCompleted, int pauseCount, String subject) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) return;
        statsDao.saveSession(userId, startTime, endTime, durationMinutes, pomodorosCompleted, pauseCount, subject);
    }

    public List<Map<String, Object>> getSubjectBreakdown(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) throw new RuntimeException("User not found: " + userEmail);
        return statsDao.getSubjectBreakdown(userId);
    }

    public int getFocusScore(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) return 0;
        return statsDao.getFocusScore(userId);
    }

    public void tagLatestSession(String userEmail, String subject) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) return;
        statsDao.tagLatestSession(userId, subject);
    }

    /** Current streak computed from actual session dates */
    public int computeCurrentStreak(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) return 0;
        return statsDao.computeCurrentStreak(userId);
    }

    /** Longest streak ever computed from actual session dates */
    public int computeLongestStreak(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) return 0;
        return statsDao.computeLongestStreak(userId);
    }

    /**
     * Get user achievements
     */
    public List<AchievementDTO> getUserAchievements(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        return statsDao.getUserAchievements(userId);
    }

    /**
     * DTO for daily streak data
     */
    @Data
    @Builder
    @AllArgsConstructor
    public static class DailyStreakDTO {
        private LocalDate date;
        private int streakValue;
    }
}
