package pomo.Lockedin.controller;

import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.dto.PremiumStatusDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.PremiumService;
import pomo.Lockedin.service.SubscriptionService;
import pomo.Lockedin.service.UserService;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PremiumService premiumService;
    private final UserService userService;

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, String>> createCheckout(@RequestBody Map<String, String> body) {
        User user = currentUser();
        String plan = body.getOrDefault("plan", "monthly");
        Long userId = userService.getUserIdByEmail(user.getEmail());

        try {
            String url = subscriptionService.createCheckoutSession(user.getEmail(), userId, plan);
            return ResponseEntity.ok(Map.of("checkoutUrl", url));
        } catch (StripeException e) {
            log.error("Stripe checkout error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not create checkout session"));
        }
    }

    // Stripe calls this — no JWT auth, signature verified inside service
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            subscriptionService.handleWebhook(payload, sigHeader);
            return ResponseEntity.ok("ok");
        } catch (RuntimeException e) {
            log.warn("Webhook error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook error");
        }
    }

    @PostMapping("/change-plan")
    public ResponseEntity<Map<String, String>> changePlan(@RequestBody Map<String, String> body) {
        User user = currentUser();
        Long userId = userService.getUserIdByEmail(user.getEmail());
        String plan = body.getOrDefault("plan", "annual");
        try {
            String status = subscriptionService.changePlan(userId, plan);
            return ResponseEntity.ok(Map.of("status", status));
        } catch (StripeException e) {
            log.error("Stripe change-plan error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not change plan"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/portal")
    public ResponseEntity<Map<String, String>> customerPortal() {
        User user = currentUser();
        Long userId = userService.getUserIdByEmail(user.getEmail());
        try {
            String url = subscriptionService.createPortalSession(userId);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (StripeException e) {
            log.error("Stripe portal error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not open billing portal"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status")
    public PremiumStatusDTO getStatus() {
        return premiumService.getStatus(currentUser().getEmail());
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
