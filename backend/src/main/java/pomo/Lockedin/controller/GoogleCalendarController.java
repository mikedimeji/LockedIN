package pomo.Lockedin.controller;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pomo.Lockedin.dto.GoogleCalendarEventDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.AchievementService;
import pomo.Lockedin.service.GoogleCalendarService;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class GoogleCalendarController {

    private final GoogleCalendarService googleCalendarService;
    private final AchievementService achievementService;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    private String email() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getEmail();
    }

    @GetMapping("/auth")
    public Map<String, String> getAuthUrl() {
        return Map.of("url", googleCalendarService.buildAuthUrl(email()));
    }

    /** Public — called by Google's redirect, no JWT present. */
    @GetMapping("/callback")
    public void callback(@RequestParam String code,
                         @RequestParam String state,
                         HttpServletResponse response) throws IOException {
        try {
            String userEmail = googleCalendarService.handleCallback(code, state);
            achievementService.checkGCalAchievement(userEmail);
            response.sendRedirect(frontendUrl + "/schedule?gcal=connected");
        } catch (Exception e) {
            log.error("Google Calendar callback error: {}", e.getMessage());
            response.sendRedirect(frontendUrl + "/schedule?gcal=error");
        }
    }

    @GetMapping("/status")
    public Map<String, Boolean> status() {
        return Map.of("connected", googleCalendarService.isConnected(email()));
    }

    @GetMapping("/events")
    public List<GoogleCalendarEventDTO> events(
            @RequestParam String date,
            @RequestParam(defaultValue = "UTC") String timezone) {
        ZoneId zone;
        try { zone = ZoneId.of(timezone); } catch (Exception e) { zone = ZoneId.of("UTC"); }
        LocalDate localDate;
        try { localDate = LocalDate.parse(date); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date"); }
        return googleCalendarService.getEventsForDate(email(), localDate, zone);
    }

    @DeleteMapping("/disconnect")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disconnect() {
        googleCalendarService.disconnect(email());
    }
}
