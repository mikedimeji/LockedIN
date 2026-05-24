package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeBlockDTO {
    private Long id;
    private LocalDate date;
    private int startMinute;
    private int endMinute;
    private String type;  // DEEP_WORK | BREAK | SCHEDULE
    private String title;
}
