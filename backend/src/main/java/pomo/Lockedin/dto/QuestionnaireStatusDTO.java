package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuestionnaireStatusDTO {
    private String status; // not_started / skipped / completed
    private boolean isPremium;
}
