package pomo.Lockedin.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table("user_profile")
public class UserProfile {

    @Id
    private Long id;
    private Long userId;

    // ASRS-v1.1 focus questions
    private String focusCompletionDifficulty;
    private String sustainedAttentionDifficulty;
    private String distractionFrequency;

    // Sleep (B-PSQI)
    private String sleepHours;
    private String chronotype;

    // Work style
    private String dailyFocusTime;
    private String primaryFocusChallenge;
    private String workEnvironment;

    // Executive function (ESQ-R)
    private String taskBreakdownEase;
    private String procrastinationTendency;

    // Context
    private String stressLevel;
    private String primaryMotivation;

    // Metadata
    private String status; // not_started / skipped / completed
    private LocalDateTime skippedAt;
    private LocalDateTime completedAt;
    private Boolean isPremiumAtCompletion;
    private String rawJson;
}
