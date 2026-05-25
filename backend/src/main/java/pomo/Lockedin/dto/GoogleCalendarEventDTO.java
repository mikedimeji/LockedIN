package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleCalendarEventDTO {
    private String  id;
    private String  title;
    private String  startTime;
    private String  endTime;
    private boolean allDay;
    private int     startMinute; // minutes from midnight (local time)
    private int     endMinute;
}
