package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FocusInsightsDTO {
    private boolean hasProfile;
    private int focusScore;              // 0–100
    private String focusCategory;       // "Elite Focus" / "Sharp" / "Average" / "Developing" / "Struggling"
    private String recommendedSessionMins;
    private String bestStudyWindow;
    private String challengeAdvice;
    private String procrastinationTip;
    private int weeklySessionGoal;
    private List<String> workflowTips;
}
