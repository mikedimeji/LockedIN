package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pomo.Lockedin.dto.PremiumStatusDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.PremiumService;

@RestController
@RequestMapping("/api/profile/premium")
@RequiredArgsConstructor
public class PremiumController {

    private final PremiumService premiumService;

    @GetMapping
    public PremiumStatusDTO getStatus() {
        String email = getEmail();
        return premiumService.getStatus(email);
    }

    @PostMapping("/unlock")
    public PremiumStatusDTO unlock() {
        String email = getEmail();
        try {
            return premiumService.unlock(email);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, e.getMessage());
        }
    }

    private String getEmail() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getEmail();
    }
}
