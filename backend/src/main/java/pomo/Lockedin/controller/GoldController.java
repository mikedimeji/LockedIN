package pomo.Lockedin.controller;

import lombok.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pomo.Lockedin.dto.GoldBalanceDTO;
import pomo.Lockedin.dto.GoldOperationDTO;
import pomo.Lockedin.dto.PomodoroCompletionDTO;
import pomo.Lockedin.dto.StreakDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.AchievementService;
import pomo.Lockedin.service.GoldService;
import pomo.Lockedin.service.StatsService;
import pomo.Lockedin.service.StreakService;

@RestController
@RequestMapping("/api/home/gold")
@RequiredArgsConstructor
public class GoldController {

    private final GoldService goldService;
    private final StreakService streakService;
    private final AchievementService achievementService;
    private final StatsService statsService;

    /**
     * Get current gold balance for the authenticated user
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public GoldBalanceDTO getGoldBalance() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        int currentGold = goldService.getUserGold(userEmail);
        return new GoldBalanceDTO(currentGold);
    }

    /**
     * Add gold to the user's account (for testing/admin purposes)
     */
    @PostMapping("/add")
    @ResponseStatus(HttpStatus.OK)
    public GoldBalanceDTO addGold(@RequestBody GoldOperationDTO goldOperation) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        try {
            int newBalance = goldService.addGold(userEmail, goldOperation.getAmount());
            return new GoldBalanceDTO(newBalance);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Spend gold from the user's account
     */
    @PostMapping("/spend")
    @ResponseStatus(HttpStatus.OK)
    public GoldBalanceDTO spendGold(@RequestBody GoldOperationDTO goldOperation) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        try {
            int newBalance = goldService.spendGold(userEmail, goldOperation.getAmount());
            return new GoldBalanceDTO(newBalance);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Response class for pomodoro completion that includes gold and streak info
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PomodoroRewardResponse {
        private int currentGold;
        private int currentStreak;
        private int longestStreak;
    }

    /**
     * Award gold for completing pomodoros
     */
    @PostMapping("/pomodoro-reward")
    @ResponseStatus(HttpStatus.OK)
    public PomodoroRewardResponse awardGoldForPomodoros(@RequestBody PomodoroCompletionDTO pomodoroCompletion) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        try {
            int newBalance = goldService.awardGoldForPomodoros(userEmail, pomodoroCompletion.getPomodorosCompleted());
            int currentStreak = streakService.getCurrentStreak(userEmail);
            int longestStreak = streakService.getLongestStreak(userEmail);

            achievementService.checkAndGrantAchievements(userEmail);

            statsService.saveSession(
                    userEmail,
                    pomodoroCompletion.getStartTime(),
                    pomodoroCompletion.getEndTime(),
                    pomodoroCompletion.getDurationMinutes(),
                    pomodoroCompletion.getPomodorosCompleted(),
                    pomodoroCompletion.getPauseCount(),
                    pomodoroCompletion.getSubject()
            );

            return PomodoroRewardResponse.builder()
                    .currentGold(newBalance)
                    .currentStreak(currentStreak)
                    .longestStreak(longestStreak)
                    .build();
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
