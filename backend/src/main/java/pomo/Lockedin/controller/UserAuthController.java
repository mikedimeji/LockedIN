package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.Requests.AuthenticationRequest;
import pomo.Lockedin.Requests.RegisterRequest;
import pomo.Lockedin.Security.JwtService;
import pomo.Lockedin.entities.AuthenticationResponse;
import pomo.Lockedin.service.AuthenticationService;
import pomo.Lockedin.service.PasswordResetService;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/home/auth")
@RequiredArgsConstructor
public class UserAuthController {

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request){
        try {
            AuthenticationResponse response = authenticationService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // Handle validation errors from service
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(AuthenticationResponse.builder()
                            .message(e.getMessage())
                            .build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AuthenticationResponse.builder()
                            .message("Server error occurred during registration")
                            .build());
        }
    }

    @PostMapping("/Authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request){
        try {
            AuthenticationResponse response = authenticationService.authenticate(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthenticationResponse.builder()
                            .message(e.getMessage())
                            .build());
        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthenticationResponse.builder()
                            .message(e.getMessage())
                            .build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AuthenticationResponse.builder()
                            .message("Server error occurred during login")
                            .build());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        try {
            passwordResetService.sendResetEmail(email.trim().toLowerCase());
        } catch (Exception e) {
            log.warn("forgot-password error: {}", e.getMessage());
        }
        // Always 200 — never reveal whether the email is registered
        return ResponseEntity.ok(Map.of("message", "If that email is registered, a reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and new password are required"));
        }
        try {
            passwordResetService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired reset link"));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthenticationResponse> refreshToken(@RequestBody Map<String, String> request){
        String refreshToken = request.get("refreshToken");

        if(refreshToken == null || refreshToken.isEmpty()){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(AuthenticationResponse.builder()
                            .message("Refresh token is required")
                            .build());
        }

        try {
            String username = jwtService.extractUsername(refreshToken);
            var userDetails = authenticationService.loadUserByUsername(username);

            if(!jwtService.isTokenValid(refreshToken, userDetails)){
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(AuthenticationResponse.builder()
                                .message("Invalid or expired refresh token")
                                .build());
            }

            String newAccessToken = jwtService.generateToken(userDetails);

            return ResponseEntity.ok(
                    AuthenticationResponse.builder()
                            .token(newAccessToken)
                            .refreshToken(refreshToken)
                            .username(username)
                            .message("Token refreshed successfully")
                            .build()
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthenticationResponse.builder()
                            .message("Failed to refresh token")
                            .build());
        }
    }
}
