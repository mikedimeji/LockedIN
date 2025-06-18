package pomo.Lockedin.dao;

import pomo.Lockedin.entities.UserStats;

import java.time.LocalDate;
import java.util.Optional;

public interface UserStatsDao {
    void createUserStats(UserStats userStats);
    Optional<UserStats> getUserStatsByUserId(Long userId);
    void updateUserStats(UserStats userStats);
    void updateLastPomodoroDate(Long userId, LocalDate date);
    void updateStreak(Long userId, int currentStreak, int longestStreak);
    void resetStreakForInactiveUsers(LocalDate cutoffDate);
}
