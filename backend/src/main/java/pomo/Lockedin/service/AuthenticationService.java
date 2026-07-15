package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import pomo.Lockedin.Requests.AuthenticationRequest;
import pomo.Lockedin.Requests.RegisterRequest;
import pomo.Lockedin.Security.JwtService;
import pomo.Lockedin.dao.impl.UserDaoImpl;
import pomo.Lockedin.entities.AuthenticationResponse;
import pomo.Lockedin.entities.Role;
import pomo.Lockedin.entities.User;

@Service
@RequiredArgsConstructor
public class AuthenticationService implements UserDetailsService {

    private final UserDaoImpl userDao;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Register a new user with validation
     */
    public AuthenticationResponse register(RegisterRequest request) {
        // Validate email format
        if (!isValidEmail(request.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Validate password strength
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }

        // Validate username
        if (request.getUsername() == null || request.getUsername().trim().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
        }

        // Check if email already exists
        if (userDao.findUserByEmailOrUsername(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        var user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .gold(150)
                .build();
        userDao.createUser(user);

        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .message("User registered successfully")
                .build();
    }


    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Incorrect password");
        }

        var user = userDao.findUserByEmailOrUsername(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Email not found"));

        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .message("Login successful")
                .build();
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userDao.findUserByEmailOrUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    /**
     * Validate email format
     */
    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    }
}