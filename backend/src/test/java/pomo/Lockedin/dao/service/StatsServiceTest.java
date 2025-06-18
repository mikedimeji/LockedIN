package pomo.Lockedin.dao.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pomo.Lockedin.dao.StatsDao;
import pomo.Lockedin.dto.AchievementDTO;
import pomo.Lockedin.service.GoldService;
import pomo.Lockedin.service.StatsService;
import pomo.Lockedin.service.UserService;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StatsServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private StatsDao statsDao;

    @Mock
    private GoldService goldService;

    @InjectMocks
    private StatsService statsService;

    private final String userEmail = "test@example.com";
    private final Long userId = 1L;

    @BeforeEach
    void setUp() {
        when(userService.getUserIdByEmail(userEmail)).thenReturn(userId);
    }

    @Test
    void getTotalPomodorosCompletedShouldReturnCount() {
        // Arrange
        when(statsDao.getTotalPomodorosCompleted(userId)).thenReturn(25);

        // Act
        int result = statsService.getTotalPomodorosCompleted(userEmail);

        // Assert
        assertEquals(25, result);
    }

    @Test
    void getTotalHoursRevisedShouldReturnHours() {
        // Arrange
        when(statsDao.getTotalHoursRevised(userId)).thenReturn(12.5);

        // Act
        double result = statsService.getTotalHoursRevised(userEmail);

        // Assert
        assertEquals(12.5, result);
    }

    @Test
    void getPomodorosCompletedPerDayLastWeekShouldReturnDailyData() {
        // Arrange
        List<Integer> dailyData = Arrays.asList(3, 5, 0, 2, 4, 1, 0);
        when(statsDao.getPomodorosCompletedPerDayLastWeek(userId)).thenReturn(dailyData);

        // Act
        List<Integer> result = statsService.getPomodorosCompletedPerDayLastWeek(userEmail);

        // Assert
        assertEquals(dailyData, result);
    }

    @Test
    void getHoursCompletedPerDayLastWeekShouldReturnDailyData() {
        // Arrange
        List<Double> dailyData = Arrays.asList(1.5, 2.5, 0.0, 1.0, 2.0, 0.5, 0.0);
        when(statsDao.getHoursCompletedPerDayLastWeek(userId)).thenReturn(dailyData);

        // Act
        List<Double> result = statsService.getHoursCompletedPerDayLastWeek(userEmail);

        // Assert
        assertEquals(dailyData, result);
    }

    @Test
    void getStreakHistoryShouldReturnStreakData() {
        // Arrange
        List<StatsService.DailyStreakDTO> streakData = Arrays.asList(
                new StatsService.DailyStreakDTO(LocalDate.now().minusDays(1), 2),
                new StatsService.DailyStreakDTO(LocalDate.now(), 3)
        );
        when(statsDao.getStreakHistory(userId, 7)).thenReturn(streakData);

        // Act
        List<StatsService.DailyStreakDTO> result = statsService.getStreakHistory(userEmail, 7);

        // Assert
        assertEquals(streakData, result);
    }

    // If your AchievementDTO doesn't have a proper constructor, modify the test:
    @Test
    void getUserAchievementsShouldReturnAchievements() {
        // Arrange
        AchievementDTO achievement1 = new AchievementDTO();
        achievement1.setName("First Pomodoro");
        achievement1.setDescription("Complete your first pomodoro");

        AchievementDTO achievement2 = new AchievementDTO();
        achievement2.setName("5 Day Streak");
        achievement2.setDescription("Maintain a 5 day streak");

        List<AchievementDTO> achievements = Arrays.asList(achievement1, achievement2);

        when(statsDao.getUserAchievements(userId)).thenReturn(achievements);

        // Act
        List<AchievementDTO> result = statsService.getUserAchievements(userEmail);

        // Assert
        assertEquals(achievements, result);
    }
}
