package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dto.PremiumStatusDTO;
import pomo.Lockedin.entities.Role;

import java.util.Arrays;

@Slf4j
@Service
@RequiredArgsConstructor
public class PremiumService {

    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;
    private final SubscriptionService subscriptionService;

    @Value("${app.admin-usernames:flcl}")
    private String adminUsernames;

    public boolean isPremium(String email) {
        boolean admin = isAdminUser(email);
        log.info("[isPremium] email={} isAdmin={}", email, admin);
        if (admin) return true;
        Long userId = userService.getUserIdByEmail(email);
        log.info("[isPremium] userId={}", userId);
        if (userId == null) return false;
        boolean active = subscriptionService.isSubscriptionActive(userId);
        log.info("[isPremium] isSubscriptionActive={}", active);
        return active;
    }

    public PremiumStatusDTO getStatus(String email) {
        if (isAdminUser(email)) {
            return PremiumStatusDTO.builder().isPremium(true).subscriptionStatus("active").plan(null).build();
        }
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) {
            return PremiumStatusDTO.builder().isPremium(false).build();
        }
        // Use isSubscriptionActive so the current_period_end check applies here too
        boolean active = subscriptionService.isSubscriptionActive(userId);
        String subStatus = active
                ? subscriptionService.getSubscriptionStatus(userId)
                : "inactive";
        String plan = active ? subscriptionService.getSubscriptionPlan(userId) : null;
        return PremiumStatusDTO.builder()
                .isPremium(active)
                .subscriptionStatus(subStatus)
                .plan(plan)
                .build();
    }

    private boolean isAdminUser(String email) {
        return userService.getUserByEmail(email).map(user -> {
            if (user.getRole() == Role.ADMIN) return true;
            return Arrays.stream(adminUsernames.split(","))
                    .map(String::trim)
                    .anyMatch(a -> a.equalsIgnoreCase(user.getUsername()));
        }).orElse(false);
    }
}
