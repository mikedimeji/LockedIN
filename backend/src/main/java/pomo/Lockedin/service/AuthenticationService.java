package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
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

    public AuthenticationResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userDao.findUserByEmailOrUsername(request.getEmail()).isPresent()) {
            // If email is already taken, throw an exception or return a response
            throw new IllegalArgumentException("Email Taken");
        }

        var user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .gold(5)
                .build();
        userDao.createUser(user);
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())  // Include username in response
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = userDao.findUserByEmailOrUsername(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())  // Include username in response
                .build();
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userDao.findUserByEmailOrUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }
}