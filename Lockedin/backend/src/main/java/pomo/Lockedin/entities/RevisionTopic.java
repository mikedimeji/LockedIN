package pomo.Lockedin.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table("revisiontopic")
public class RevisionTopic {

    @Id
    private Long revisionTopicId;
    private Long userId;
    private String title;
    private String description;
    private Integer pomodoroNumber;
}
