package pomo.Lockedin.dto;

import lombok.Data;

@Data
public class UserProfileDTO {
    private String focusCompletionDifficulty;
    private String sustainedAttentionDifficulty;
    private String distractionFrequency;
    private String sleepHours;
    private String chronotype;
    private String dailyFocusTime;
    private String primaryFocusChallenge;
    private String workEnvironment;
    private String taskBreakdownEase;
    private String procrastinationTendency;
    private String stressLevel;
    private String primaryMotivation;
}
