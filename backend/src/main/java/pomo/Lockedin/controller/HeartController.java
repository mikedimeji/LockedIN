package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.entities.UserStats;
import pomo.Lockedin.service.HeartService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/home/hearts")
@RequiredArgsConstructor
public class HeartController {

    private final HeartService heartService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> getHearts() {
        String email = getEmail();
        UserStats stats = heartService.getOrRefillHearts(email);
        return buildResponse(stats);
    }

    @PostMapping("/break")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> breakHeart() {
        String email = getEmail();
        UserStats stats = heartService.breakHeart(email);
        return buildResponse(stats);
    }

    private String getEmail() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getEmail();
    }

    private Map<String, Object> buildResponse(UserStats stats) {
        Map<String, Object> response = new HashMap<>();
        if (stats == null) {
            response.put("heartPoints", 2);
            response.put("streakReset", false);
            return response;
        }
        response.put("heartPoints", stats.getHeartPoints());
        response.put("currentStreak", stats.getCurrentStreak());
        response.put("streakReset", stats.getHeartPoints() == 0);
        response.put("lastHeartRefillDate", stats.getLastHeartRefillDate());
        return response;
    }
}
