package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
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

import java.util.Map;

@RestController
@RequestMapping("/api/home/auth")
@RequiredArgsConstructor
public class UserAuthController {

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;

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
