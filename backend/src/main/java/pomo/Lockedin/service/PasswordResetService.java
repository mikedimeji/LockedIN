package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import pomo.Lockedin.Security.JwtService;
import pomo.Lockedin.dao.impl.UserDaoImpl;
import pomo.Lockedin.entities.User;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final JwtService jwtService;
    private final UserDaoImpl userDao;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${spring.mail.from:noreply@tokispirit.com}")
    private String fromEmail;

    @Async
    public void sendResetEmail(String email) {
        Optional<User> userOpt = userDao.findUserByEmailOrUsername(email);
        if (userOpt.isEmpty()) {
            log.debug("Forgot-password request for unknown email: {}", email);
            return;
        }

        String token = jwtService.generatePasswordResetToken(email);
        String link  = frontendUrl + "/reset-password?token=" + token;
        String text  = "Hi " + userOpt.get().getUsername() + ",\n\n"
                + "Click the link below to reset your TokiSpirit password. It expires in 15 minutes.\n\n"
                + link + "\n\n"
                + "If you didn't request this, you can safely ignore this email.\n\n"
                + "— TokiSpirit";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = Map.of(
                "from",    fromEmail,
                "to",      List.of(email),
                "subject", "TokiSpirit — Reset your password",
                "text",    text
            );

            ResponseEntity<Map> resp = restTemplate.exchange(
                "https://api.resend.com/emails",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
            );
            log.info("Password reset email sent to {} (id={})", email,
                     resp.getBody() != null ? resp.getBody().get("id") : "?");
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", email, e.getMessage());
        }
    }

    public void resetPassword(String token, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        String email = jwtService.extractEmailFromResetToken(token);
        userDao.updatePassword(email, passwordEncoder.encode(newPassword));
        log.info("Password reset completed for {}", email);
    }
}
