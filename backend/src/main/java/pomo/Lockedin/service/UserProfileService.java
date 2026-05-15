package pomo.Lockedin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dao.UserProfileDao;
import pomo.Lockedin.dto.QuestionnaireStatusDTO;
import pomo.Lockedin.dto.UserProfileDTO;
import pomo.Lockedin.entities.UserProfile;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileDao userProfileDao;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public QuestionnaireStatusDTO getStatus(String email) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return new QuestionnaireStatusDTO("not_started", false);

        Optional<UserProfile> opt = userProfileDao.findByUserId(userId);
        if (opt.isEmpty()) return new QuestionnaireStatusDTO("not_started", false);

        return new QuestionnaireStatusDTO(opt.get().getStatus(), false);
    }

    public void submitQuestionnaire(String email, UserProfileDTO dto) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) throw new RuntimeException("User not found: " + email);

        String rawJson = toJson(dto);
        Optional<UserProfile> existing = userProfileDao.findByUserId(userId);

        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .focusCompletionDifficulty(dto.getFocusCompletionDifficulty())
                .sustainedAttentionDifficulty(dto.getSustainedAttentionDifficulty())
                .distractionFrequency(dto.getDistractionFrequency())
                .sleepHours(dto.getSleepHours())
                .chronotype(dto.getChronotype())
                .dailyFocusTime(dto.getDailyFocusTime())
                .primaryFocusChallenge(dto.getPrimaryFocusChallenge())
                .workEnvironment(dto.getWorkEnvironment())
                .taskBreakdownEase(dto.getTaskBreakdownEase())
                .procrastinationTendency(dto.getProcrastinationTendency())
                .stressLevel(dto.getStressLevel())
                .primaryMotivation(dto.getPrimaryMotivation())
                .status("completed")
                .completedAt(LocalDateTime.now())
                .isPremiumAtCompletion(false)
                .rawJson(rawJson)
                .build();

        if (existing.isEmpty()) {
            userProfileDao.insert(profile);
        } else {
            userProfileDao.update(profile);
        }
    }

    public void skipQuestionnaire(String email) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return;

        Optional<UserProfile> existing = userProfileDao.findByUserId(userId);
        LocalDateTime now = LocalDateTime.now();

        if (existing.isEmpty()) {
            UserProfile profile = UserProfile.builder()
                    .userId(userId)
                    .status("skipped")
                    .skippedAt(now)
                    .isPremiumAtCompletion(false)
                    .build();
            userProfileDao.insert(profile);
        } else {
            userProfileDao.markSkipped(userId, now);
        }
    }

    private String toJson(UserProfileDTO dto) {
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialise questionnaire DTO", e);
            return "{}";
        }
    }
}
