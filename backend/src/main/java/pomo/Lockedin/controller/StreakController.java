package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.dto.StreakDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.entities.UserStats;
import pomo.Lockedin.service.StreakService;
import pomo.Lockedin.dao.UserStatsDao;
import pomo.Lockedin.service.UserService;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/home/streak")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;
    private final UserStatsDao userStatsDao;
    private final UserService userService;

    /**
     * Get the current streak information for the authenticated user
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public StreakDTO getStreakInfo() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        Optional<UserStats> userStatsOpt = userStatsDao.getUserStatsByUserId(userId);

        if (userStatsOpt.isPresent()) {
            UserStats stats = userStatsOpt.get();
            return StreakDTO.builder()
                    .currentStreak(stats.getCurrentStreak())
                    .longestStreak(stats.getLongestStreak())
                    .lastPomodoroDate(stats.getLastPomodoroDate())
                    .build();
        } else {
            // Return default values if no stats exist yet
            return StreakDTO.builder()
                    .currentStreak(0)
                    .longestStreak(0)
                    .build();
        }
    }

    /**
     * Update streak when a pomodoro is completed
     */
    @PostMapping("/update")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> updateStreak() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        int updatedStreak = streakService.updateStreakOnPomodoroCompletion(userEmail);

        Map<String, Object> response = new HashMap<>();
        response.put("currentStreak", updatedStreak);
        response.put("message", "Streak updated successfully");

        return response;
    }
}
