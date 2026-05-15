package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dto.PremiumStatusDTO;

@Slf4j
@Service
@RequiredArgsConstructor
public class PremiumService {

    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;
    private final SubscriptionService subscriptionService;

    public boolean isPremium(String email) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return false;
        return subscriptionService.isSubscriptionActive(userId);
    }

    public PremiumStatusDTO getStatus(String email) {
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
}
