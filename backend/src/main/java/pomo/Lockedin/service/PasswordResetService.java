package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pomo.Lockedin.Security.JwtService;
import pomo.Lockedin.dao.impl.UserDaoImpl;
import pomo.Lockedin.entities.User;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final JwtService jwtService;
    private final UserDaoImpl userDao;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.mail.from:noreply@tokispirit.app}")
    private String fromEmail;

    @Async
    public void sendResetEmail(String email) {
        Optional<User> userOpt = userDao.findUserByEmailOrUsername(email);
        if (userOpt.isEmpty()) {
            // Don't reveal whether the email is registered
            log.debug("Forgot-password request for unknown email: {}", email);
            return;
        }

        String token = jwtService.generatePasswordResetToken(email);
        String link  = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(email);
        msg.setSubject("TokiSpirit — Reset your password");
        msg.setText(
            "Hi " + userOpt.get().getUsername() + ",\n\n" +
            "Click the link below to reset your password. It expires in 15 minutes.\n\n" +
            link + "\n\n" +
            "If you didn't request this, you can safely ignore this email.\n\n" +
            "— TokiSpirit"
        );

        mailSender.send(msg);
        log.info("Password reset email sent to {}", email);
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
