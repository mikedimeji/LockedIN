package pomo.Lockedin.dao;

import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.context.SpringBootTest;
import pomo.Lockedin.Mapper.Mapper;
import pomo.Lockedin.dao.impl.RevisionTopicImpl;
import pomo.Lockedin.dto.RevisionTopicDTO;
import pomo.Lockedin.entities.RevisionTopic;
import pomo.Lockedin.service.RevisionTopicService;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@SpringBootTest
public class RevisionTopicServiceTest {

    @InjectMocks
    private RevisionTopicService revisionTopicService;

    @Mock
    private RevisionTopicImpl revisionTopicRepo;

    @Mock
    private Mapper<RevisionTopicDTO, RevisionTopic> rtoMapper;

    @Test
    public void testGetRevisionTopicsByUserId() {
        Long userId = 1L;
        RevisionTopic revisionTopic = new RevisionTopic(1L, userId, "Title", "Description", 5);
        RevisionTopicDTO revisionTopicDTO = new RevisionTopicDTO(1L, userId, "Title", "Description", 5);

        when(revisionTopicRepo.getAllRevisionTopicsForUser(userId))
                .thenReturn(Optional.of(Collections.singletonList(revisionTopic)));
        when(rtoMapper.mapFrom(revisionTopic)).thenReturn(revisionTopicDTO);

        List<RevisionTopicDTO> result = revisionTopicService.getRevisionTopicsByUserId(userId);
        assertEquals(1, result.size());
        assertEquals("Title", result.get(0).getTitle());
    }

    @Test
    public void testCreateRevisionTopic() {
        RevisionTopicDTO revisionTopicDTO = new RevisionTopicDTO(1L, 1L, "Title", "Description", 5);
        RevisionTopic revisionTopic = new RevisionTopic(1L, 1L, "Title", "Description", 5);

        when(rtoMapper.mapTo(revisionTopicDTO)).thenReturn(revisionTopic);
        when(rtoMapper.mapFrom(revisionTopic)).thenReturn(revisionTopicDTO);

        RevisionTopicDTO result = revisionTopicService.createRevisionTopic(revisionTopicDTO);
        assertEquals("Title", result.getTitle());
    }
}


