package pomo.Lockedin.dao.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pomo.Lockedin.dao.impl.UserDaoImpl;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.UserService;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserDaoImpl userRepo;

    @InjectMocks
    private UserService userService;

    @Test
    void getUserIdByEmailShouldReturnUserIdWhenUserExists() {
        // Arrange
        String email = "test@example.com";
        User user = User.builder()
                .user_Id(1L)
                .email(email)
                .build();
        when(userRepo.findUserByEmailOrUsername(email)).thenReturn(Optional.of(user));

        // Act
        Long userId = userService.getUserIdByEmail(email);

        // Assert
        assertEquals(1L, userId);
    }

    @Test
    void getUserIdByEmailShouldReturnNullWhenUserNotFound() {
        // Arrange
        String email = "nonexistent@example.com";
        when(userRepo.findUserByEmailOrUsername(email)).thenReturn(Optional.empty());

        // Act
        Long userId = userService.getUserIdByEmail(email);

        // Assert
        assertNull(userId);
    }
}
