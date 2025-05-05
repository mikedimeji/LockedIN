package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsControllerSummaryDTO {
        private int currentGold;
        private int totalPomodoros;
        private int currentStreak;
        private int longestStreak;
        private double totalHours;
}
