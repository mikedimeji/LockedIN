package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pomo.Lockedin.dto.TimeBlockDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.AchievementService;
import pomo.Lockedin.service.PremiumService;
import pomo.Lockedin.service.TimeBlockService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final TimeBlockService timeBlockService;
    private final PremiumService premiumService;
    private final AchievementService achievementService;

    private String requirePremium() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!premiumService.isPremium(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Premium required");
        }
        return user.getEmail();
    }

    @GetMapping("/{date}")
    @ResponseStatus(HttpStatus.OK)
    public List<TimeBlockDTO> getBlocks(@PathVariable String date) {
        String email = requirePremium();
        return timeBlockService.getBlocksForDate(email, LocalDate.parse(date));
    }

    @PostMapping("/block")
    @ResponseStatus(HttpStatus.CREATED)
    public TimeBlockDTO createBlock(@RequestBody TimeBlockDTO block) {
        String email = requirePremium();
        TimeBlockDTO created = timeBlockService.createBlock(email, block);
        achievementService.checkScheduleBlockAchievements(email);
        return created;
    }

    @PutMapping("/block/{id}")
    @ResponseStatus(HttpStatus.OK)
    public TimeBlockDTO updateBlock(@PathVariable Long id, @RequestBody TimeBlockDTO block) {
        String email = requirePremium();
        block.setId(id);
        return timeBlockService.updateBlock(email, id, block)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @DeleteMapping("/block/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBlock(@PathVariable Long id) {
        String email = requirePremium();
        timeBlockService.deleteBlock(email, id);
    }
}
