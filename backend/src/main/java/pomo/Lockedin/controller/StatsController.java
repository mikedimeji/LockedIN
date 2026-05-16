package pomo.Lockedin.controller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.dto.AchievementDTO;
import pomo.Lockedin.dto.FocusInsightsDTO;
import pomo.Lockedin.dto.StatsControllerSummaryDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.AchievementService;
import pomo.Lockedin.service.GoldService;
import pomo.Lockedin.service.PremiumService;
import pomo.Lockedin.service.StatsService;
import pomo.Lockedin.service.StreakService;
import pomo.Lockedin.service.UserProfileService;
import pomo.Lockedin.service.UserService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/home/stats")
@RequiredArgsConstructor
public class StatsController {

    private final GoldService goldService;
    private final StreakService streakService;
    private final StatsService statsService;
    private final PremiumService premiumService;
    private final UserProfileService userProfileService;
    private final AchievementService achievementService;

    /**
     * Get summary statistics for the authenticated user
     */
    @GetMapping("/summary")
    @ResponseStatus(HttpStatus.OK)
    public StatsControllerSummaryDTO getUserStatsSummary() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        // Fetch all the required data
        int currentGold = goldService.getUserGold(userEmail);
        int currentStreak = streakService.getCurrentStreak(userEmail);
        int longestStreak = streakService.getLongestStreak(userEmail);
        int totalPomodoros = statsService.getTotalPomodorosCompleted(userEmail);
        double totalHours = statsService.getTotalHoursRevised(userEmail);

        return StatsControllerSummaryDTO.builder()
                .currentGold(currentGold)
                .totalPomodoros(totalPomodoros)
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .totalHours(totalHours)
                .build();
    }

    /**
     * Get weekly activity data for charts
     */
    @GetMapping("/history")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> getUserStatsHistory(
            @RequestParam(required = false, defaultValue = "week") String timeframe) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Map<String, Object> response = new HashMap<>();

        // Different timeframes will need different data processing
        if ("week".equals(timeframe)) {
            response.put("labels", getDaysOfWeek());
            response.put("pomodoros", statsService.getPomodorosCompletedPerDayLastWeek(userEmail));
            response.put("hours", statsService.getHoursCompletedPerDayLastWeek(userEmail));
            response.put("gold", goldService.getGoldEarnedPerDayLastWeek(userEmail));
        } else if ("month".equals(timeframe)) {
            // Handle month data
            response.put("labels", getDaysOfMonth());
            // Add more month-specific data
        } else if ("year".equals(timeframe)) {
            // Handle year data
            response.put("labels", getMonthsOfYear());
            // Add more year-specific data
        }

        return response;
    }

    /**
     * Get streak timeline data
     */
    @GetMapping("/streak-timeline")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> getStreakTimeline() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        // Get streak history data from service
        List<StatsService.DailyStreakDTO> streakHistory = statsService.getStreakHistory(userEmail, 14); // Last 14 days

        Map<String, Object> response = new HashMap<>();
        response.put("dates", streakHistory.stream().map(dto -> dto.getDate().format(DateTimeFormatter.ofPattern("MM/dd"))).collect(Collectors.toList()));
        response.put("streaks", streakHistory.stream().map(StatsService.DailyStreakDTO::getStreakValue).collect(Collectors.toList()));

        return response;
    }

    /**
     * Get user achievements
     */
    @GetMapping("/achievements")
    @ResponseStatus(HttpStatus.OK)
    public List<AchievementDTO> getUserAchievements() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        // Get achievements from service
        return statsService.getUserAchievements(userEmail);
    }

    /**
     * Get personalized focus insights (premium only)
     */
    @GetMapping("/insights")
    @ResponseStatus(HttpStatus.OK)
    public FocusInsightsDTO getFocusInsights() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        if (!premiumService.isPremium(userEmail)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Premium required");
        }

        return userProfileService.getInsights(userEmail);
    }

    /**
     * Check and grant any achievements the user has earned but not yet received.
     * Called on stats page load so historically-seeded data gets picked up.
     */
    @PostMapping("/achievements/sync")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> syncAchievements() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        achievementService.checkAndGrantAchievements(user.getEmail());
        return Map.of("synced", true);
    }

    /**
     * Get 28-day daily session trend
     */
    @GetMapping("/trend")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> getTrend(
            @RequestParam(defaultValue = "28") int days) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return statsService.getTrend(user.getEmail(), days);
    }

    /**
     * Get focus pattern heatmap (premium only)
     */
    @GetMapping("/heatmap")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> getHeatmap() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = user.getEmail();
        if (!premiumService.isPremium(email)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Premium required");
        }
        int[][] grid = statsService.getHeatmap(email);
        Map<String, Object> response = new HashMap<>();
        response.put("grid", grid);
        response.put("days", List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"));
        response.put("blocks", List.of("Night", "Morning", "Afternoon", "Evening"));
        return response;
    }

    // Helper methods
    private List<String> getDaysOfWeek() {
        return List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
    }

    private List<String> getDaysOfMonth() {
        // Generate days for the current month (simplified)
        List<String> days = new ArrayList<>();
        int daysInMonth = LocalDate.now().lengthOfMonth();
        for (int i = 1; i <= daysInMonth; i++) {
            days.add(String.valueOf(i));
        }
        return days;
    }

    private List<String> getMonthsOfYear() {
        return List.of("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    }
}
