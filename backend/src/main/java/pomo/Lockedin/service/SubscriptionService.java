package pomo.Lockedin.service;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${stripe.price.monthly}")
    private String priceMonthly;

    @Value("${stripe.price.annual}")
    private String priceAnnual;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public String createCheckoutSession(String email, Long userId, String plan) throws StripeException {
        Stripe.apiKey = stripeSecretKey;

        String priceId = "annual".equals(plan) ? priceAnnual : priceMonthly;

        Session session = Session.create(
                SessionCreateParams.builder()
                        .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                        .setCustomerEmail(email)
                        .addLineItem(SessionCreateParams.LineItem.builder()
                                .setPrice(priceId)
                                .setQuantity(1L)
                                .build())
                        .setSuccessUrl(frontendUrl + "/stats?sub=success")
                        .setCancelUrl(frontendUrl + "/stats?sub=cancel")
                        .putMetadata("userId", String.valueOf(userId))
                        .putMetadata("plan", plan)
                        .build()
        );

        return session.getUrl();
    }

    public void handleWebhook(String payload, String sigHeader) {
        Stripe.apiKey = stripeSecretKey;
        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Stripe webhook signature verification failed: {}", e.getMessage());
            throw new RuntimeException("Invalid webhook signature");
        }

        log.info("Stripe webhook received: {}", event.getType());

        switch (event.getType()) {
            case "checkout.session.completed" -> {
                Session session = (Session) event.getDataObjectDeserializer()
                        .getObject().orElse(null);
                if (session != null) handleCheckoutComplete(session);
            }
            case "customer.subscription.updated" -> {
                Subscription sub = (Subscription) event.getDataObjectDeserializer()
                        .getObject().orElse(null);
                if (sub != null) handleSubscriptionUpdate(sub);
            }
            case "customer.subscription.deleted" -> {
                Subscription sub = (Subscription) event.getDataObjectDeserializer()
                        .getObject().orElse(null);
                if (sub != null) cancelSubscription(sub.getCustomer());
            }
            case "invoice.payment_failed" -> {
                // Mark as past_due — access remains until period end
                log.info("Payment failed for customer, marking past_due");
            }
            default -> log.debug("Unhandled Stripe event: {}", event.getType());
        }
    }

    private void handleCheckoutComplete(Session session) {
        Map<String, String> metadata = session.getMetadata();
        if (metadata == null || !metadata.containsKey("userId")) return;

        long userId = Long.parseLong(metadata.get("userId"));
        String plan = metadata.getOrDefault("plan", "monthly");
        String customerId = session.getCustomer();
        String subscriptionId = session.getSubscription();

        LocalDateTime periodEnd = null;
        try {
            Stripe.apiKey = stripeSecretKey;
            Subscription sub = Subscription.retrieve(subscriptionId);
            periodEnd = toLocalDateTime(sub.getCurrentPeriodEnd());
        } catch (StripeException e) {
            log.warn("Could not retrieve subscription details: {}", e.getMessage());
        }

        upsertSubscription(userId, customerId, subscriptionId, plan, "active", periodEnd);
        log.info("User {} activated premium subscription ({})", userId, plan);
    }

    private void handleSubscriptionUpdate(Subscription sub) {
        String customerId = sub.getCustomer();
        String status = sub.getStatus(); // active, past_due, canceled, etc.
        LocalDateTime periodEnd = toLocalDateTime(sub.getCurrentPeriodEnd());

        String mappedStatus = switch (status) {
            case "active", "trialing" -> "active";
            case "past_due"           -> "past_due";
            case "canceled", "unpaid" -> "cancelled";
            default -> "inactive";
        };

        String sql = "UPDATE user_subscriptions SET status = ?, current_period_end = ? WHERE stripe_customer_id = ?";
        jdbcTemplate.update(sql, mappedStatus, periodEnd, customerId);
        log.info("Subscription updated for customer {}: status={}", customerId, mappedStatus);
    }

    private void cancelSubscription(String customerId) {
        String sql = "UPDATE user_subscriptions SET status = 'cancelled' WHERE stripe_customer_id = ?";
        jdbcTemplate.update(sql, customerId);
        log.info("Subscription cancelled for customer {}", customerId);
    }

    public boolean isSubscriptionActive(Long userId) {
        try {
            String sql = "SELECT status FROM user_subscriptions WHERE user_id = ?";
            String status = jdbcTemplate.queryForObject(sql, String.class, userId);
            return "active".equals(status) || "past_due".equals(status);
        } catch (Exception e) {
            return false;
        }
    }

    public String getSubscriptionStatus(Long userId) {
        try {
            String sql = "SELECT status FROM user_subscriptions WHERE user_id = ?";
            String status = jdbcTemplate.queryForObject(sql, String.class, userId);
            return status != null ? status : "inactive";
        } catch (Exception e) {
            return "inactive";
        }
    }

    public String getSubscriptionPlan(Long userId) {
        try {
            String sql = "SELECT plan FROM user_subscriptions WHERE user_id = ?";
            return jdbcTemplate.queryForObject(sql, String.class, userId);
        } catch (Exception e) {
            return null;
        }
    }

    private void upsertSubscription(Long userId, String customerId, String subscriptionId,
                                     String plan, String status, LocalDateTime periodEnd) {
        String sql = """
            INSERT INTO user_subscriptions
                (user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                stripe_customer_id = VALUES(stripe_customer_id),
                stripe_subscription_id = VALUES(stripe_subscription_id),
                plan = VALUES(plan),
                status = VALUES(status),
                current_period_end = VALUES(current_period_end)
            """;
        jdbcTemplate.update(sql, userId, customerId, subscriptionId, plan, status, periodEnd);
    }

    private LocalDateTime toLocalDateTime(Long epochSeconds) {
        if (epochSeconds == null) return null;
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSeconds), ZoneId.systemDefault());
    }
}
