package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pomo.Lockedin.dto.StudyGoalDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.PremiumService;
import pomo.Lockedin.service.StudyGoalService;

import java.util.List;

@RestController
@RequestMapping("/api/home/goals")
@RequiredArgsConstructor
public class StudyGoalController {

    private final StudyGoalService studyGoalService;
    private final PremiumService premiumService;

    private String requirePremium() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!premiumService.isPremium(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Premium required");
        }
        return user.getEmail();
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<StudyGoalDTO> getGoals() {
        String email = requirePremium();
        return studyGoalService.getGoals(email);
    }

    private void validateGoal(StudyGoalDTO dto) {
        if (dto.getSubject() == null || dto.getSubject().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject is required");
        if (dto.getSubject().length() > 100)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject must be 100 characters or fewer");
        if (dto.getWeeklyHoursTarget() == null || dto.getWeeklyHoursTarget() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Weekly hours target must be greater than 0");
        if (dto.getWeeklyHoursTarget() > 168)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Weekly hours target cannot exceed 168 (hours in a week)");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudyGoalDTO createGoal(@RequestBody StudyGoalDTO dto) {
        String email = requirePremium();
        validateGoal(dto);
        return studyGoalService.createOrUpdateGoal(email, dto);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public StudyGoalDTO updateGoal(@PathVariable Long id, @RequestBody StudyGoalDTO dto) {
        String email = requirePremium();
        validateGoal(dto);
        dto.setId(id);
        return studyGoalService.createOrUpdateGoal(email, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGoal(@PathVariable Long id) {
        String email = requirePremium();
        studyGoalService.deleteGoal(email, id);
    }
}
