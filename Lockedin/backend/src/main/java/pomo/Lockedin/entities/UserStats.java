package pomo.Lockedin.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table("userstats")
public class UserStats {

    @Id
    private Long statsId; // Primary key for the table

    @Column("user_id") // Maps to the foreign key column in the database
    private Long userId; // Foreign key for the User entity

    private float hoursSpentRevisingPerDay = 0; // Default to 0
    private int daysRevisedInARow = 0; // Default to 0
    private float totalHoursRevised = 0; // Default to 0

    // New fields for streak tracking
    private int currentStreak = 0;
    private int longestStreak = 0;
    private LocalDate lastPomodoroDate;
}
