package pomo.Lockedin.dao;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import pomo.Lockedin.controller.RevisionTopicController;
import pomo.Lockedin.controller.UserAuthController;
import pomo.Lockedin.service.AuthenticationService;
import pomo.Lockedin.Requests.AuthenticationRequest;
import pomo.Lockedin.Requests.RegisterRequest;
import pomo.Lockedin.entities.AuthenticationResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@SpringBootTest
public class RevisionTopicControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthenticationService authenticationService;

    private String authToken;

    @BeforeEach
    public void setUp() throws Exception {
        // Define a mock token
        String mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

        // Mock the registration and authentication responses
        RegisterRequest registerRequest = RegisterRequest.builder()
                .username("testuser")
                .email("testuser@example.com")
                .password("password123")
                .build();

        AuthenticationResponse registrationResponse = AuthenticationResponse.builder()
                .token(mockToken)
                .build();

        AuthenticationRequest authRequest = AuthenticationRequest.builder()
                .email("testuser@example.com")
                .password("password123")
                .build();

        AuthenticationResponse authResponse = AuthenticationResponse.builder()
                .token(mockToken)
                .build();

        when(authenticationService.register(any(RegisterRequest.class))).thenReturn(registrationResponse);
        when(authenticationService.authenticate(any(AuthenticationRequest.class))).thenReturn(authResponse);

        // Obtain the token from the mocked service
        this.authToken = mockToken;

        // Ensure the token is not null or empty
        assertNotNull(this.authToken);
        assertFalse(this.authToken.isEmpty());  // Ensure token is not empty
    }



    @Test
    public void testGetRevisionTopics() throws Exception {
        mockMvc.perform(get("/revisiontopics")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk());
    }

    @Test
    public void testCreateRevisionTopic() throws Exception {
        String requestBody = "{\"revisionTopicId\":1,\"userId\":1,\"title\":\"Title\",\"description\":\"Description\",\"pomodoroNumber\":5}";

        mockMvc.perform(post("/revisiontopics")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());
    }
}

