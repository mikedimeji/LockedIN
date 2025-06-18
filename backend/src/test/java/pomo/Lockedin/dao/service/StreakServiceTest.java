package pomo.Lockedin.dao.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pomo.Lockedin.dao.UserStatsDao;
import pomo.Lockedin.entities.UserStats;
import pomo.Lockedin.service.StreakService;
import pomo.Lockedin.service.UserService;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StreakServiceTest {

    @Mock
    private UserStatsDao userStatsDao;

    @Mock
    private UserService userService;

    @InjectMocks
    private StreakService streakService;

    private final String userEmail = "test@example.com";
    private final Long userId = 1L;
    private UserStats userStats;

    @BeforeEach
    void setUp() {
        when(userService.getUserIdByEmail(userEmail)).thenReturn(userId);

        userStats = UserStats.builder()
                .userId(userId)
                .currentStreak(2)
                .longestStreak(5)
                .lastPomodoroDate(LocalDate.now().minusDays(1))
                .build();
    }

    @Test
    void updateStreakOnPomodoroCompletionShouldIncrementStreakForConsecutiveDays() {
        // Arrange
        when(userStatsDao.getUserStatsByUserId(userId)).thenReturn(Optional.of(userStats));
        doNothing().when(userStatsDao).updateUserStats(any(UserStats.class));

        // Act
        int result = streakService.updateStreakOnPomodoroCompletion(userEmail);

        // Assert
        assertEquals(3, result); // Streak should increment from 2 to 3
        verify(userStatsDao).updateUserStats(userStats);
        assertEquals(LocalDate.now(), userStats.getLastPomodoroDate());
    }

    @Test
    void updateStreakOnPomodoroCompletionShouldResetStreakAfterGap() {
        // Arrange
        userStats.setLastPomodoroDate(LocalDate.now().minusDays(2));
        when(userStatsDao.getUserStatsByUserId(userId)).thenReturn(Optional.of(userStats));
        doNothing().when(userStatsDao).updateUserStats(any(UserStats.class));

        // Act
        int result = streakService.updateStreakOnPomodoroCompletion(userEmail);

        // Assert
        assertEquals(1, result); // Streak should reset to 1
        verify(userStatsDao).updateUserStats(userStats);
        assertEquals(LocalDate.now(), userStats.getLastPomodoroDate());
    }

    @Test
    void updateStreakOnPomodoroCompletionShouldCreateNewUserStatsIfNotExist() {
        // Arrange
        when(userStatsDao.getUserStatsByUserId(userId)).thenReturn(Optional.empty());
        // If createUserStats returns void, you can't mock a return value
        doNothing().when(userStatsDao).createUserStats(any(UserStats.class));

        // Act
        int result = streakService.updateStreakOnPomodoroCompletion(userEmail);

        // Assert
        assertEquals(1, result); // New streak starts at 1
        verify(userStatsDao).createUserStats(any(UserStats.class));
    }

    @Test
    void getCurrentStreakShouldReturnCurrentStreak() {
        // Arrange
        when(userStatsDao.getUserStatsByUserId(userId)).thenReturn(Optional.of(userStats));

        // Act
        int result = streakService.getCurrentStreak(userEmail);

        // Assert
        assertEquals(2, result);
    }

    @Test
    void getLongestStreakShouldReturnLongestStreak() {
        // Arrange
        when(userStatsDao.getUserStatsByUserId(userId)).thenReturn(Optional.of(userStats));

        // Act
        int result = streakService.getLongestStreak(userEmail);

        // Assert
        assertEquals(5, result);
    }

    @Test
    void getStreaksShouldReturnZeroWhenNoStatsExist() {
        // Arrange
        when(userStatsDao.getUserStatsByUserId(userId)).thenReturn(Optional.empty());

        // Act
        int currentStreak = streakService.getCurrentStreak(userEmail);
        int longestStreak = streakService.getLongestStreak(userEmail);

        // Assert
        assertEquals(0, currentStreak);
        assertEquals(0, longestStreak);
    }

}
