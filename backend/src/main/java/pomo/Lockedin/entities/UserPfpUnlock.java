package pomo.Lockedin.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserPfpUnlock {

    private Long id;
    private Long userId;
    private String pfpPath;
    private String pfpName;
    private Integer goldCost = 0;
    private LocalDateTime unlockedDate;
}
