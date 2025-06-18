package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dao.UserStatsDao;
import pomo.Lockedin.entities.UserStats;

import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StreakService {

    private final UserStatsDao userStatsDao;
    private final UserService userService;

    /**
     * Update a user's streak when they complete a pomodoro
     *
     * @param userEmail The user's email
     * @return The updated current streak
     */
    public int updateStreakOnPomodoroCompletion(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        LocalDate today = LocalDate.now();

        // Get or create user stats
        UserStats userStats = getUserStatsOrCreate(userId);

        // If this is the first pomodoro ever or the first one today, update the streak
        if (userStats.getLastPomodoroDate() == null) {
            // First pomodoro ever
            userStats.setCurrentStreak(1);
            userStats.setLongestStreak(1);
            userStats.setLastPomodoroDate(today);
        } else if (today.equals(userStats.getLastPomodoroDate())) {
            // Already completed a pomodoro today, no streak change needed
            // Just need to update the date
        } else if (today.minusDays(1).equals(userStats.getLastPomodoroDate())) {
            // Completed a pomodoro yesterday, increment streak
            userStats.setCurrentStreak(userStats.getCurrentStreak() + 1);

            // Update longest streak if needed
            if (userStats.getCurrentStreak() > userStats.getLongestStreak()) {
                userStats.setLongestStreak(userStats.getCurrentStreak());
            }

            userStats.setLastPomodoroDate(today);
        } else {
            // More than one day gap, reset streak to 1
            userStats.setCurrentStreak(1);
            userStats.setLastPomodoroDate(today);
        }

        // Save updated stats
        userStatsDao.updateUserStats(userStats);

        return userStats.getCurrentStreak();
    }

    /**
     * Get a user's current streak
     *
     * @param userEmail The user's email
     * @return The current streak count
     */
    public int getCurrentStreak(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        Optional<UserStats> userStatsOpt = userStatsDao.getUserStatsByUserId(userId);
        return userStatsOpt.map(UserStats::getCurrentStreak).orElse(0);
    }

    /**
     * Get a user's longest streak
     *
     * @param userEmail The user's email
     * @return The longest streak count
     */
    public int getLongestStreak(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        Optional<UserStats> userStatsOpt = userStatsDao.getUserStatsByUserId(userId);
        return userStatsOpt.map(UserStats::getLongestStreak).orElse(0);
    }

    /**
     * Get or create user stats for a user
     *
     * @param userId The user ID
     * @return The user's stats
     */
    private UserStats getUserStatsOrCreate(Long userId) {
        Optional<UserStats> userStatsOpt = userStatsDao.getUserStatsByUserId(userId);

        if (userStatsOpt.isPresent()) {
            return userStatsOpt.get();
        } else {
            // Create new stats for user
            UserStats newUserStats = UserStats.builder()
                    .userId(userId)
                    .currentStreak(0)
                    .longestStreak(0)
                    .hoursSpentRevisingPerDay(0)
                    .daysRevisedInARow(0)
                    .totalHoursRevised(0)
                    .build();

            userStatsDao.createUserStats(newUserStats);
            return newUserStats;
        }
    }

    /**
     * Scheduled job that runs daily to reset streaks for inactive users
     * This runs at 00:01 AM every day
     */
    @Scheduled(cron = "0 1 0 * * ?")
    public void resetInactiveStreaks() {
        log.info("Running scheduled job to reset inactive streaks");
        LocalDate yesterday = LocalDate.now().minusDays(1);
        userStatsDao.resetStreakForInactiveUsers(yesterday);
    }
}
