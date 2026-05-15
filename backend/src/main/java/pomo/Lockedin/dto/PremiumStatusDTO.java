package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PremiumStatusDTO {
    private boolean isPremium;
    private String subscriptionStatus; // 'active' | 'past_due' | 'cancelled' | 'inactive'
    // kept for backwards compat — not used for gating anymore
    private int goldRequired;
    private int currentGold;
    private boolean canAfford;
}
