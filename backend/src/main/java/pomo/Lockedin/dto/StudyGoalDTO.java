package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StudyGoalDTO {
    private Long id;
    private String subject;
    private Double weeklyHoursTarget;
    private double weeklyHoursCompleted;
}
