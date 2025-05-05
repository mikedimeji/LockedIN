package pomo.Lockedin.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dao.StatsDao;
import pomo.Lockedin.dto.AchievementDTO;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

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
