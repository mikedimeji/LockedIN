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
public class UserThemeUnlock {

    private Long id;
    private Long userId;
    private String themePath;
    private String themeName;
    private Integer goldCost = 0;
    private LocalDateTime unlockedDate;
}