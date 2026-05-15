package pomo.Lockedin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dao.UserProfileDao;
import pomo.Lockedin.dto.FocusInsightsDTO;
import pomo.Lockedin.dto.QuestionnaireStatusDTO;
import pomo.Lockedin.dto.UserProfileDTO;
import pomo.Lockedin.entities.UserProfile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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

    public FocusInsightsDTO getInsights(String email) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return emptyInsights();

        Optional<UserProfile> opt = userProfileDao.findByUserId(userId);
        if (opt.isEmpty() || !"completed".equals(opt.get().getStatus())) return emptyInsights();

        UserProfile p = opt.get();
        int score = computeFocusScore(p);
        return FocusInsightsDTO.builder()
                .hasProfile(true)
                .focusScore(score)
                .focusCategory(scoreCategory(score))
                .recommendedSessionMins(sessionRecommendation(p.getDailyFocusTime()))
                .bestStudyWindow(studyWindow(p.getChronotype()))
                .challengeAdvice(challengeAdvice(p.getPrimaryFocusChallenge()))
                .procrastinationTip(procrastinationTip(p.getProcrastinationTendency()))
                .weeklySessionGoal(weeklyGoal(p.getDailyFocusTime()))
                .workflowTips(workflowTips(p))
                .build();
    }

    private FocusInsightsDTO emptyInsights() {
        return FocusInsightsDTO.builder().hasProfile(false).build();
    }

    private int computeFocusScore(UserProfile p) {
        return focusScore(p.getFocusCompletionDifficulty())
                + focusScore(p.getSustainedAttentionDifficulty())
                + focusScore(p.getDistractionFrequency())
                + sleepScore(p.getSleepHours())
                + stressScore(p.getStressLevel());
    }

    private int focusScore(String val) {
        if (val == null) return 10;
        return switch (val) {
            case "never"     -> 20;
            case "rarely"    -> 16;
            case "sometimes" -> 12;
            case "often"     -> 6;
            case "very_often"-> 0;
            default -> 10;
        };
    }

    private int sleepScore(String val) {
        if (val == null) return 10;
        return switch (val) {
            case "7_to_8"     -> 20;
            case "9_plus"     -> 16;
            case "5_to_6"     -> 10;
            case "4_or_fewer" -> 2;
            default -> 10;
        };
    }

    private int stressScore(String val) {
        if (val == null) return 10;
        return switch (val) {
            case "none"      -> 20;
            case "mild"      -> 16;
            case "moderate"  -> 10;
            case "high"      -> 5;
            case "burned_out"-> 0;
            default -> 10;
        };
    }

    private String scoreCategory(int score) {
        if (score >= 85) return "Elite Focus";
        if (score >= 68) return "Sharp";
        if (score >= 50) return "Average";
        if (score >= 30) return "Developing";
        return "Struggling";
    }

    private String sessionRecommendation(String val) {
        if (val == null) return "25";
        return switch (val) {
            case "under_1h"  -> "25";
            case "1_to_2h"   -> "45";
            case "2_to_4h"   -> "50";
            case "4h_plus"   -> "90";
            default -> "25";
        };
    }

    private String studyWindow(String val) {
        if (val == null) return "Pick a consistent daily block";
        return switch (val) {
            case "morning"      -> "Morning (9AM – 12PM)";
            case "evening"      -> "Evening (4PM – 8PM)";
            case "no_preference"-> "Pick a consistent daily block";
            default -> "Pick a consistent daily block";
        };
    }

    private String challengeAdvice(String val) {
        if (val == null) return "Define one clear outcome before each session.";
        return switch (val) {
            case "starting"    -> "Use the 2-minute rule: commit to just 2 minutes. Once started, you'll keep going.";
            case "staying"     -> "Set micro-goals within each session and tick them off as you go.";
            case "distractions"-> "Phone in another room, one tab open. Use the ambient sounds to anchor your focus.";
            case "motivation"  -> "Tie each session to your 'why'. Revisit your goal before you start.";
            case "switching"   -> "Write your full task list in order before starting. Never decide mid-session.";
            default -> "Define one clear outcome before each session.";
        };
    }

    private String procrastinationTip(String val) {
        if (val == null) return "Build consistency through small daily wins.";
        return switch (val) {
            case "rarely"       -> "You're self-starting well. Use session reviews to keep improving.";
            case "sometimes"    -> "Temptation bundling: pair your session with something you enjoy, like your playlist.";
            case "often"        -> "Strict Pomodoro: 25 min on, no exceptions, then a full break. No skipping the break either.";
            case "almost_always"-> "Always start with your smallest, easiest task first. Momentum builds from there.";
            default -> "Build consistency through small daily wins.";
        };
    }

    private int weeklyGoal(String val) {
        if (val == null) return 7;
        return switch (val) {
            case "under_1h"  -> 5;
            case "1_to_2h"   -> 10;
            case "2_to_4h"   -> 18;
            case "4h_plus"   -> 28;
            default -> 7;
        };
    }

    private List<String> workflowTips(UserProfile p) {
        List<String> tips = new ArrayList<>();

        // Environment tip
        if (p.getWorkEnvironment() != null) {
            tips.add(switch (p.getWorkEnvironment()) {
                case "home_alone"      -> "You have a great setup for focus. Keep your workspace exclusively for studying — no entertainment there.";
                case "home_with_others"-> "Communicate your session times to others in advance and use headphones as a 'do not disturb' signal.";
                case "office"          -> "Block calendar time and enable focus mode. Co-workers will respect boundaries you make visible.";
                case "varies"          -> "Build a portable focus ritual: same music, same app, same posture. Your brain will learn to switch modes fast.";
                default -> "Designate a consistent physical space for focus work.";
            });
        }

        // Task structure tip
        if (p.getTaskBreakdownEase() != null) {
            tips.add(switch (p.getTaskBreakdownEase()) {
                case "very_difficult", "difficult" -> "Break every task into 5-minute atomic actions before starting. 'Write essay' becomes 'open doc, type first sentence'.";
                case "neutral" -> "Always define ONE clear deliverable before each session. Vague sessions produce vague results.";
                case "easy", "very_easy" -> "Your planning skills are strong. Consider longer deep-work blocks (90 min) to leverage them fully.";
                default -> "Define a clear outcome for every session before you start.";
            });
        }

        // Motivation tip
        if (p.getPrimaryMotivation() != null) {
            tips.add(switch (p.getPrimaryMotivation()) {
                case "adhd_management"   -> "External accountability works best for you. Streaks, timers, and visible progress are your friends.";
                case "procrastination"   -> "Momentum beats motivation. Just start — the feelings of wanting to work follow the action, not the other way around.";
                case "focus_habits"      -> "Consistency beats intensity. Three daily sessions is worth more than one occasional marathon.";
                case "tracking"          -> "Review your stats every week to spot your best days and worst days — then engineer more of the former.";
                case "work_life_balance" -> "Hard stop at your end time. Protecting your rest is what makes the next session's focus possible.";
                default -> "Connect each session to a specific longer-term outcome.";
            });
        }

        if (tips.isEmpty()) {
            tips.add("Complete the profile questionnaire to unlock personalised workflow tips.");
        }

        return tips;
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
