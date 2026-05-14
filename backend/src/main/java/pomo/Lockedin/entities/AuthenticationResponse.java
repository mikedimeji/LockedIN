package pomo.Lockedin.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {

    private String token;
    private String refreshToken;
    private String message;
    private String username;

    // Convenience constructor for error responses
    public AuthenticationResponse(String message) {
        this.message = message;
    }

    // Convenience constructor for successful auth
    public AuthenticationResponse(String token, String refreshToken, String username) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.username = username;
    }
}
