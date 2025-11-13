// UserPreferencesDTO.java
package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserPreferencesDTO {
    private String selectedPfp;
    private String selectedTheme;
    private Boolean isVideoBackground;
    private Boolean showLiveThemes;
    private Boolean navHidden;
}
