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
        if (isAdminUser(email)) return true;
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return false;
        return subscriptionService.isSubscriptionActive(userId);
    }

    public PremiumStatusDTO getStatus(String email) {
        if (isAdminUser(email)) {
            return PremiumStatusDTO.builder().isPremium(true).subscriptionStatus("active").build();
        }
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) {
            return PremiumStatusDTO.builder().isPremium(false).build();
        }
        String subStatus = subscriptionService.getSubscriptionStatus(userId);
        boolean active = "active".equals(subStatus) || "past_due".equals(subStatus);
        return PremiumStatusDTO.builder()
                .isPremium(active)
                .subscriptionStatus(subStatus)
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
