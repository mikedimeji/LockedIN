package pomo.Lockedin.dao.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import pomo.Lockedin.dao.impl.UserDaoImpl;
import pomo.Lockedin.service.GoldService;
import pomo.Lockedin.service.StreakService;
import pomo.Lockedin.service.UserService;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GoldServiceTest {

    @Mock
    private UserDaoImpl userDao;

    @Mock
    private UserService userService;

    @Mock
    private StreakService streakService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private GoldService goldService;

    private final String userEmail = "test@example.com";
    private final Long userId = 1L;

    @BeforeEach
    void setUp() {
        when(userService.getUserIdByEmail(userEmail)).thenReturn(userId);
    }

    @Test
    void getUserGoldShouldReturnCurrentGold() {
        // Arrange
        when(userDao.getUserGold(userId)).thenReturn(100);

        // Act
        int gold = goldService.getUserGold(userEmail);

        // Assert
        assertEquals(100, gold);
    }

    @Test
    void addGoldShouldIncrementGoldBalance() {
        // Arrange
        when(userDao.getUserGold(userId)).thenReturn(150);

        // Act
        int newBalance = goldService.addGold(userEmail, 50);

        // Assert
        assertEquals(150, newBalance);
        verify(userDao).incrementUserGold(userId, 50);
        verify(jdbcTemplate).update(anyString(), eq(userId), eq(50), eq("EARN"), eq("Added gold"));
    }


    @Test
    void spendGoldShouldDecrementGoldBalance() {
        // Arrange
        when(userDao.getUserGold(userId)).thenReturn(80, 50);

        // Act
        int newBalance = goldService.spendGold(userEmail, 30);

        // Assert
        assertEquals(50, newBalance);
        verify(userDao).incrementUserGold(userId, -30);
        verify(jdbcTemplate).update(anyString(), eq(userId), eq(30), eq("SPEND"), eq("Spent gold"));
    }

    @Test
    void awardGoldForPomodorosShouldCalculateCorrectGold() {
        // Arrange
        when(streakService.updateStreakOnPomodoroCompletion(userEmail)).thenReturn(3);
        when(userDao.getUserGold(userId)).thenReturn(130);

        // Act
        int newBalance = goldService.awardGoldForPomodoros(userEmail, 2);

        // Assert
        assertEquals(130, newBalance);
        // Base gold for 2 pomodoros = 10, streak bonus for streak of 3 = 3, total = 13
        verify(userDao).incrementUserGold(eq(userId), eq(13));
    }
}
