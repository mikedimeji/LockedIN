package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import pomo.Lockedin.dao.GoogleCalendarTokenDao;
import pomo.Lockedin.dao.GoogleCalendarTokenDao.GoogleCalendarToken;
import pomo.Lockedin.dto.GoogleCalendarEventDTO;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    @Value("${google.calendar.client-id:}")
    private String clientId;

    @Value("${google.calendar.client-secret:}")
    private String clientSecret;

    @Value("${google.calendar.redirect-uri:}")
    private String redirectUri;

    private final GoogleCalendarTokenDao tokenDao;
    private final UserService userService;
    private final RestTemplate restTemplate = new RestTemplate();

    // state_token → (email, expiresAt)
    private final Map<String, PendingAuth> pending = new ConcurrentHashMap<>();
    private record PendingAuth(String email, long expiresAt) {}

    // ── OAuth ─────────────────────────────────────────────────────────────────

    public String buildAuthUrl(String email) {
        String state = UUID.randomUUID().toString();
        pending.put(state, new PendingAuth(email, System.currentTimeMillis() + 10 * 60_000L));
        return UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id",     clientId)
                .queryParam("redirect_uri",  redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope",         "https://www.googleapis.com/auth/calendar.readonly")
                .queryParam("access_type",   "offline")
                .queryParam("prompt",        "consent")
                .queryParam("state",         state)
                .build().toUriString();
    }

    /** Returns the email of the user who connected, so the caller can trigger achievements. */
    @SuppressWarnings("unchecked")
    public String handleCallback(String code, String state) {
        PendingAuth auth = pending.remove(state);
        if (auth == null || auth.expiresAt() < System.currentTimeMillis()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OAuth state");
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code",          code);
        body.add("client_id",     clientId);
        body.add("client_secret", clientSecret);
        body.add("redirect_uri",  redirectUri);
        body.add("grant_type",    "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> resp = restTemplate.exchange(
                "https://oauth2.googleapis.com/token",
                HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

        Map<String, Object> tokens = resp.getBody();
        if (tokens == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty token response");

        String accessToken  = (String)  tokens.get("access_token");
        String refreshToken = (String)  tokens.get("refresh_token");
        int    expiresIn    = (Integer) tokens.get("expires_in");
        long   expiresAt    = System.currentTimeMillis() + expiresIn * 1000L;

        Long userId = userService.getUserIdByEmail(auth.email());

        // Google only returns a refresh_token on first authorisation.
        // If reconnecting, preserve the existing one rather than overwriting with null.
        if (refreshToken == null) {
            refreshToken = tokenDao.find(userId)
                    .map(GoogleCalendarToken::refreshToken)
                    .orElse(null);
        }

        tokenDao.save(userId, accessToken, refreshToken, expiresAt);
        log.info("Google Calendar connected for user {}", auth.email());
        return auth.email();
    }

    // ── Status / disconnect ───────────────────────────────────────────────────

    public boolean isConnected(String email) {
        Long userId = userService.getUserIdByEmail(email);
        return userId != null && tokenDao.exists(userId);
    }

    public void disconnect(String email) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId != null) tokenDao.delete(userId);
    }

    // ── Fetch events ──────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public List<GoogleCalendarEventDTO> getEventsForDate(String email, LocalDate date, ZoneId zone) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return List.of();

        Optional<GoogleCalendarToken> opt = tokenDao.find(userId);
        if (opt.isEmpty()) return List.of();

        GoogleCalendarToken token = opt.get();
        if (token.expiresAt() < System.currentTimeMillis() + 60_000) {
            token = refreshToken(userId, token);
        }
        String timeMin = date.atStartOfDay(zone).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String timeMax = date.plusDays(1).atStartOfDay(zone).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token.accessToken());

        String url = UriComponentsBuilder
                .fromUriString("https://www.googleapis.com/calendar/v3/calendars/primary/events")
                .queryParam("timeMin",       timeMin)
                .queryParam("timeMax",       timeMax)
                .queryParam("singleEvents",  "true")
                .queryParam("orderBy",       "startTime")
                .build().toUriString();

        try {
            ResponseEntity<Map> resp = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            Map<String, Object> body = resp.getBody();
            List<Map<String, Object>> items = body != null ? (List<Map<String, Object>>) body.get("items") : null;
            if (items == null) return List.of();
            return items.stream().map(i -> mapEvent(i, date, zone))
                    .filter(Objects::nonNull).collect(Collectors.toList());
        } catch (ResponseStatusException e) {
            throw e;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            if (e.getStatusCode().value() == 401) {
                tokenDao.delete(userId);
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google Calendar token expired — please reconnect");
            }
            log.error("Google Calendar API error: {}", e.getMessage());
            return List.of();
        } catch (Exception e) {
            log.error("Error fetching Google Calendar events: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private GoogleCalendarToken refreshToken(Long userId, GoogleCalendarToken token) {
        if (token.refreshToken() == null) {
            tokenDao.delete(userId);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google Calendar token expired — please reconnect");
        }
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("refresh_token", token.refreshToken());
        body.add("client_id",     clientId);
        body.add("client_secret", clientSecret);
        body.add("grant_type",    "refresh_token");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> resp = restTemplate.exchange(
                "https://oauth2.googleapis.com/token",
                HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

        Map<String, Object> tokens = resp.getBody();
        if (tokens == null) return token;

        String newAccess = (String)  tokens.get("access_token");
        int    expiresIn = (Integer) tokens.get("expires_in");
        long   expiresAt = System.currentTimeMillis() + expiresIn * 1000L;
        tokenDao.updateAccessToken(userId, newAccess, expiresAt);
        return new GoogleCalendarToken(userId, newAccess, token.refreshToken(), expiresAt);
    }

    @SuppressWarnings("unchecked")
    private GoogleCalendarEventDTO mapEvent(Map<String, Object> item, LocalDate date, ZoneId zone) {
        String title = (String) item.getOrDefault("summary", "Busy");
        Map<String, String> start = (Map<String, String>) item.get("start");
        Map<String, String> end   = (Map<String, String>) item.get("end");
        if (start == null || end == null) return null;

        boolean allDay = start.containsKey("date") && !start.containsKey("dateTime");

        int startMin = 0, endMin = 24 * 60;
        if (!allDay) {
            startMin = parseMinutes(start.get("dateTime"), date, zone);
            endMin   = parseMinutes(end.get("dateTime"),   date, zone);
        }

        return GoogleCalendarEventDTO.builder()
                .id((String) item.get("id"))
                .title(title)
                .startTime(allDay ? start.get("date") : start.get("dateTime"))
                .endTime  (allDay ? end.get("date")   : end.get("dateTime"))
                .allDay(allDay)
                .startMinute(startMin)
                .endMinute(endMin)
                .build();
    }

    private int parseMinutes(String dateTimeStr, LocalDate date, ZoneId zone) {
        try {
            OffsetDateTime odt = OffsetDateTime.parse(dateTimeStr);
            ZonedDateTime  local = odt.atZoneSameInstant(zone);
            return (int) ChronoUnit.MINUTES.between(date.atStartOfDay(zone), local);
        } catch (Exception e) {
            return 0;
        }
    }
}
