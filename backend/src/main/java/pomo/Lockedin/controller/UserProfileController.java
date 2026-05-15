package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.dto.QuestionnaireStatusDTO;
import pomo.Lockedin.dto.UserProfileDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.UserProfileService;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping("/questionnaire/status")
    public QuestionnaireStatusDTO getStatus() {
        return userProfileService.getStatus(getEmail());
    }

    @PostMapping("/questionnaire")
    public ResponseEntity<Void> submit(@RequestBody UserProfileDTO dto) {
        userProfileService.submitQuestionnaire(getEmail(), dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/questionnaire/skip")
    public ResponseEntity<Void> skip() {
        userProfileService.skipQuestionnaire(getEmail());
        return ResponseEntity.ok().build();
    }

    private String getEmail() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getEmail();
    }
}
