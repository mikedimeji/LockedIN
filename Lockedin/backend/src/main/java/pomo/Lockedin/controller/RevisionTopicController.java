package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.dto.RevisionTopicDTO;
import pomo.Lockedin.service.RevisionTopicService;

import java.util.List;

@RestController
@RequestMapping("/revisiontopics")
@RequiredArgsConstructor
public class RevisionTopicController {

    private final RevisionTopicService revisionTopicService;


    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<RevisionTopicDTO> getRevisionTopics(@RequestParam Long UserId) {

        return revisionTopicService.getRevisionTopicsByUserId(UserId);


    }

}
