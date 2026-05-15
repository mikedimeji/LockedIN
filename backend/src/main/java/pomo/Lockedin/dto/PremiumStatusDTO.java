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
    private int goldRequired;
    private int currentGold;
    private boolean canAfford;
}
