// PurchaseResultDTO.java
package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PurchaseResultDTO {
    private Boolean success;
    private String message;
    private Integer remainingGold;
    private String itemPath;
    private String itemName;
}
