package pomo.Lockedin.dao.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pomo.Lockedin.Mapper.Mapper;
import pomo.Lockedin.dao.impl.RevisionTopicImpl;
import pomo.Lockedin.dto.RevisionTopicDTO;
import pomo.Lockedin.entities.RevisionTopic;
import pomo.Lockedin.service.RevisionTopicService;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RevisionTopicServiceTest {

    @Mock
    private RevisionTopicImpl revisionTopicRepo;

    @Mock
    private Mapper<RevisionTopicDTO, RevisionTopic> rtoMapper;

    @InjectMocks
    private RevisionTopicService revisionTopicService;

    private RevisionTopic revisionTopic1;
    private RevisionTopic revisionTopic2;
    private RevisionTopicDTO revisionTopicDTO1;
    private RevisionTopicDTO revisionTopicDTO2;
    private final Long userId = 1L;

    @BeforeEach
    void setUp() {
        revisionTopic1 = new RevisionTopic(1L, userId, "Java Basics", "Core Java concepts", 5);
        revisionTopic2 = new RevisionTopic(2L, userId, "Spring Boot", "Spring Boot fundamentals", 3);

        revisionTopicDTO1 = new RevisionTopicDTO(1L, userId, "Java Basics", "Core Java concepts", 5);
        revisionTopicDTO2 = new RevisionTopicDTO(2L, userId, "Spring Boot", "Spring Boot fundamentals", 3);
    }

    @Test
    void getRevisionTopicsByUserIdShouldReturnTopics() {
        // Arrange
        List<RevisionTopic> topics = Arrays.asList(revisionTopic1, revisionTopic2);
        when(revisionTopicRepo.getAllRevisionTopicsForUser(userId)).thenReturn(Optional.of(topics));
        when(rtoMapper.mapFrom(revisionTopic1)).thenReturn(revisionTopicDTO1);
        when(rtoMapper.mapFrom(revisionTopic2)).thenReturn(revisionTopicDTO2);

        // Act
        List<RevisionTopicDTO> result = revisionTopicService.getRevisionTopicsByUserId(userId);

        // Assert
        assertEquals(2, result.size());
        assertEquals("Java Basics", result.get(0).getTitle());
        assertEquals("Spring Boot", result.get(1).getTitle());
    }

    @Test
    void getRevisionTopicsByUserIdShouldThrowExceptionWhenNoTopicsFound() {
        // Arrange
        when(revisionTopicRepo.getAllRevisionTopicsForUser(userId)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            revisionTopicService.getRevisionTopicsByUserId(userId);
        });

        assertTrue(exception.getMessage().contains("No Revision Topics Found"));
    }

    @Test
    void createRevisionTopicShouldReturnCreatedTopic() {
        // Arrange
        when(rtoMapper.mapTo(revisionTopicDTO1)).thenReturn(revisionTopic1);
        when(rtoMapper.mapFrom(revisionTopic1)).thenReturn(revisionTopicDTO1);

        // Act
        RevisionTopicDTO result = revisionTopicService.createRevisionTopic(revisionTopicDTO1);

        // Assert
        assertNotNull(result);
        assertEquals("Java Basics", result.getTitle());
        verify(revisionTopicRepo).createRevisionTopic(revisionTopic1);
    }

    @Test
    void deleteRevisionTopicByIdShouldCallRepository() {
        // Act
        revisionTopicService.deleteRevisionTopicById(1L);

        // Assert
        verify(revisionTopicRepo).deleteRevisionTopic(1L);
    }
}
