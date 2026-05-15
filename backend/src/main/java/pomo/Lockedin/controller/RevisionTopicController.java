package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pomo.Lockedin.dto.RevisionTopicDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.PremiumService;
import pomo.Lockedin.service.RevisionTopicService;
import pomo.Lockedin.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/home/revisiontopics")
@RequiredArgsConstructor
public class RevisionTopicController {

    private static final int FREE_TOPIC_LIMIT = 3;

    private final RevisionTopicService revisionTopicService;
    private final UserService userService;
    private final PremiumService premiumService;


    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<RevisionTopicDTO> getRevisionTopics() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal(); //retrieves email for jwt claim
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail); // Implement this method in your service

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "UserId not found");
        }

        return revisionTopicService.getRevisionTopicsByUserId(userId);


    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RevisionTopicDTO createRevisionTopic(@RequestBody RevisionTopicDTO revisionTopicDTO) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        // Retrieve the userId using the email
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found for email: " + userEmail);
        }

        revisionTopicDTO.setUserId(userId);

        if (!premiumService.isPremium(userEmail)) {
            int count = revisionTopicService.countTopicsByUserId(userId);
            if (count >= FREE_TOPIC_LIMIT) {
                throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                        "Free plan is limited to " + FREE_TOPIC_LIMIT + " todos. Upgrade to Premium for unlimited.");
            }
        }

        return revisionTopicService.createRevisionTopic(revisionTopicDTO);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRevisionTopic(@PathVariable Long id) {
        revisionTopicService.deleteRevisionTopicById(id);
    }

}
