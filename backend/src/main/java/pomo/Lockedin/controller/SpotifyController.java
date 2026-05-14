package pomo.Lockedin.controller;

import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/spotify")
public class SpotifyController {

    private static final String CLIENT_ID = "1591f7a8ddd548b7b67b7cc3a7d545f0";
    private static final String CLIENT_SECRET = "d4984e8932b04277b3a5e613e069eef8";
    private static final String TOKEN_URL = "https://accounts.spotify.com/api/token";

    private final RestTemplate restTemplate = new RestTemplate();

    private HttpHeaders spotifyHeaders() {
        String credentials = CLIENT_ID + ":" + CLIENT_SECRET;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes()));
        return headers;
    }

    @PostMapping("/token")
    public ResponseEntity<?> exchangeToken(@RequestBody Map<String, String> body) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("code", body.get("code"));
        params.add("redirect_uri", body.get("redirectUri"));

        try {
            return restTemplate.postForEntity(TOKEN_URL, new HttpEntity<>(params, spotifyHeaders()), Map.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> body) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("refresh_token", body.get("refreshToken"));

        try {
            return restTemplate.postForEntity(TOKEN_URL, new HttpEntity<>(params, spotifyHeaders()), Map.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        }
    }
}
