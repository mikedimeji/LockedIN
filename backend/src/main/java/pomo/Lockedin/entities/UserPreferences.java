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
public class UserPreferences {

    private Long id;
    private Long userId;
    private String selectedPfp = "assets/images/durarara1.jpg";
    private String selectedTheme = "assets/videos/witch.gif";
    private Boolean isVideoBackground = true;
    private Boolean showLiveThemes = true;
    private Boolean navHidden = false;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
