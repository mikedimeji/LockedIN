package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RevisionTopicDTO {

    private Long revisionTopicId;
    private Long userId;
    private String title;
    private String description;
    private Integer pomodoroNumber;
}
