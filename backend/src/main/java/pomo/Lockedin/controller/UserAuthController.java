package pomo.Lockedin.controller;

import jdk.jfr.Registered;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.Requests.AuthenticationRequest;
import pomo.Lockedin.Requests.RegisterRequest;
import pomo.Lockedin.Security.JwtService;
import pomo.Lockedin.entities.AuthenticationResponse;
import pomo.Lockedin.service.AuthenticationService;
import pomo.Lockedin.service.UserService;

import java.util.Map;

@RestController
@RequestMapping("/api/home/auth")
@RequiredArgsConstructor
public class UserAuthController {

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;
    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse register(@RequestBody RegisterRequest request){
        return authenticationService.register(request);
    }

    @PostMapping("/Authenticate")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse register(@RequestBody AuthenticationRequest request){

        return authenticationService.authenticate(request);

    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthenticationResponse> refreshToken(@RequestBody Map<String, String> request){
        String refreshToken = request.get("refreshToken");

        if(refreshToken == null || refreshToken.isEmpty()){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }

        try {
            String username = jwtService.extractUsername(refreshToken);

            var userDetails = authenticationService.loadUserByUsername(username);

            if(!jwtService.isTokenValid(refreshToken, userDetails)){
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }

            //generate a new access token

            String newAccessToken = jwtService.generateToken(userDetails);

            return ResponseEntity.ok(new AuthenticationResponse(newAccessToken, refreshToken, username));

        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }

    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleEmailTakenException(IllegalArgumentException ex) {
        if (ex.getMessage().equals("Email Taken")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email Taken.");
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred.");
    }
}
