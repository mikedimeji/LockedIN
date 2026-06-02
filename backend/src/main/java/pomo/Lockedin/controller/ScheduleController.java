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
import java.util.Set;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final TimeBlockService timeBlockService;
    private final PremiumService premiumService;
    private final AchievementService achievementService;

    private static final Set<String> VALID_TYPES = Set.of("DEEP_WORK", "BREAK", "SCHEDULE");

    private void validateBlock(TimeBlockDTO block) {
        if (block.getStartMinute() < 0 || block.getEndMinute() > 24 * 60)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Block time out of range (0–1440)");
        if (block.getStartMinute() >= block.getEndMinute())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startMinute must be before endMinute");
        if (block.getType() == null || !VALID_TYPES.contains(block.getType()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid block type");
        if (block.getTitle() != null && block.getTitle().length() > 100)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must be 100 characters or fewer");
    }

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
        try { return timeBlockService.getBlocksForDate(email, LocalDate.parse(date)); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date"); }
    }

    @GetMapping("/month")
    @ResponseStatus(HttpStatus.OK)
    public java.util.Map<String, List<TimeBlockDTO>> getMonthBlocks(
            @RequestParam int year, @RequestParam int month) {
        String email = requirePremium();
        if (month < 1 || month > 12)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Month must be 1–12");
        return timeBlockService.getBlocksForMonth(email, year, month);
    }

    @PostMapping("/block")
    @ResponseStatus(HttpStatus.CREATED)
    public TimeBlockDTO createBlock(@RequestBody TimeBlockDTO block) {
        String email = requirePremium();
        validateBlock(block);
        TimeBlockDTO created = timeBlockService.createBlock(email, block);
        achievementService.checkScheduleBlockAchievements(email);
        return created;
    }

    @PutMapping("/block/{id}")
    @ResponseStatus(HttpStatus.OK)
    public TimeBlockDTO updateBlock(@PathVariable Long id, @RequestBody TimeBlockDTO block) {
        String email = requirePremium();
        validateBlock(block);
        block.setId(id);
        return timeBlockService.updateBlock(email, id, block)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @DeleteMapping("/block/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBlock(@PathVariable Long id) {
        String email = requirePremium();
        boolean deleted = timeBlockService.deleteBlock(email, id);
        if (!deleted) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found");
    }
}
