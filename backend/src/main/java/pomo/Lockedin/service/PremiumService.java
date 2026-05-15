package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dto.PremiumStatusDTO;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PremiumService {

    private static final int PREMIUM_GOLD_COST = 500;

    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;
    private final GoldService goldService;

    public boolean isPremium(String email) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return false;
        try {
            String sql = "SELECT is_premium FROM user_premium WHERE user_id = ?";
            Boolean result = jdbcTemplate.queryForObject(sql, Boolean.class, userId);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            return false;
        }
    }

    public PremiumStatusDTO getStatus(String email) {
        Long userId = userService.getUserIdByEmail(email);
        int currentGold = userId != null ? goldService.getUserGold(email) : 0;
        boolean premium = isPremium(email);
        return PremiumStatusDTO.builder()
                .isPremium(premium)
                .goldRequired(PREMIUM_GOLD_COST)
                .currentGold(currentGold)
                .canAfford(currentGold >= PREMIUM_GOLD_COST)
                .build();
    }

    public PremiumStatusDTO unlock(String email) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) throw new RuntimeException("User not found");

        if (isPremium(email)) {
            return getStatus(email);
        }

        int currentGold = goldService.getUserGold(email);
        if (currentGold < PREMIUM_GOLD_COST) {
            throw new IllegalArgumentException("Insufficient gold: need " + PREMIUM_GOLD_COST + ", have " + currentGold);
        }

        goldService.spendGold(email, PREMIUM_GOLD_COST);

        String upsert = "INSERT INTO user_premium (user_id, is_premium, unlocked_at, unlock_method) " +
                "VALUES (?, TRUE, ?, 'gold') " +
                "ON DUPLICATE KEY UPDATE is_premium = TRUE, unlocked_at = ?, unlock_method = 'gold'";
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update(upsert, userId, now, now);

        log.info("User {} unlocked premium for {} gold", email, PREMIUM_GOLD_COST);
        return getStatus(email);
    }
}
