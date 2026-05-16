package pomo.Lockedin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PremiumStatusDTO {
    @JsonProperty("isPremium")
    private boolean isPremium;
    private String subscriptionStatus; // 'active' | 'past_due' | 'cancelled' | 'inactive'
    private String plan;               // 'monthly' | 'annual' | null for admin
    // kept for backwards compat — not used for gating anymore
    private int goldRequired;
    private int currentGold;
    private boolean canAfford;
}
