package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UnlockedItemDTO {
    private String path;
    private String name;
    private Integer goldCost;
    private LocalDateTime unlockedDate;
}
