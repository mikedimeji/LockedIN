package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StreakDTO {
    private int currentStreak;
    private int longestStreak;
    private LocalDate lastPomodoroDate;
}
