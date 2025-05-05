package pomo.Lockedin.dao.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import pomo.Lockedin.Requests.AuthenticationRequest;
import pomo.Lockedin.Requests.RegisterRequest;
import pomo.Lockedin.Security.JwtService;
import pomo.Lockedin.dao.impl.UserDaoImpl;
import pomo.Lockedin.entities.AuthenticationResponse;
import pomo.Lockedin.entities.Role;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.AuthenticationService;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthenticationServiceTest {

    @Mock
    private UserDaoImpl userDao;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthenticationService authenticationService;

    private RegisterRequest registerRequest;
    private AuthenticationRequest authRequest;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password123")
                .build();

        authRequest = AuthenticationRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        user = User.builder()
                .user_Id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .role(Role.USER)
                .gold(5)
                .build();
    }

    @Test
    void registerShouldCreateNewUser() {
        // Arrange
        when(userDao.findUserByEmailOrUsername(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(jwtService.generateToken(any(User.class))).thenReturn("jwtToken");
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn("refreshToken");

        // Act
        AuthenticationResponse response = authenticationService.register(registerRequest);

        // Assert
        assertNotNull(response);
        assertEquals("jwtToken", response.getToken());
        assertEquals("refreshToken", response.getRefreshToken());
        verify(userDao).createUser(any(User.class));
    }

    @Test
    void registerShouldThrowExceptionWhenEmailTaken() {
        // Arrange
        when(userDao.findUserByEmailOrUsername("test@example.com")).thenReturn(Optional.of(user));

        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            authenticationService.register(registerRequest);
        });

        assertEquals("Email Taken", exception.getMessage());
        verify(userDao, never()).createUser(any(User.class));
    }

    @Test
    void authenticateShouldGenerateTokenForValidUser() {
        // Arrange
        when(userDao.findUserByEmailOrUsername("test@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("jwtToken");
        when(jwtService.generateRefreshToken(user)).thenReturn("refreshToken");

        // Act
        AuthenticationResponse response = authenticationService.authenticate(authRequest);

        // Assert
        assertNotNull(response);
        assertEquals("jwtToken", response.getToken());
        assertEquals("refreshToken", response.getRefreshToken());
        assertEquals("testuser", response.getUsername());
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void loadUserByUsernameShouldReturnUserDetailsWhenUserExists() {
        // Arrange
        when(userDao.findUserByEmailOrUsername("test@example.com")).thenReturn(Optional.of(user));

        // Act
        User result = (User) authenticationService.loadUserByUsername("test@example.com");

        // Assert
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void loadUserByUsernameShouldThrowExceptionWhenUserNotFound() {
        // Arrange
        when(userDao.findUserByEmailOrUsername("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UsernameNotFoundException.class, () -> {
            authenticationService.loadUserByUsername("nonexistent@example.com");
        });
    }
}
