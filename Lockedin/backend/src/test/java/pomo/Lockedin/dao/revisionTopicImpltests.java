package pomo.Lockedin.dao;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import pomo.Lockedin.dao.impl.RevisionTopicImpl;
import pomo.Lockedin.entities.RevisionTopic;
import pomo.Lockedin.service.RevisionTopicService;

import java.awt.*;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class revisionTopicImpltests {

    @Mock
    private JdbcTemplate jdbctemplate;

    @InjectMocks
    private RevisionTopicImpl revisionTopicTests;


    @Test
    public void testThatCreatesSingleRevisionTopic(){

        RevisionTopic revisionTopic = RevisionTopic.builder()
                .revisionTopicId(11L)
                .title("Mathamatics")
                .pomodoroNumber(2)
                .description("A Number Of Detailed Math Problems")
                .userId(1L)
                .build();
        revisionTopicTests.createRevisionTopic(revisionTopic);

        verify(jdbctemplate).update(
                eq("INSERT INTO revisiontopic (RevisionTopicId, UserId, Title, Description, Pomodoro_number) VALUES (?, ?, ?, ?, ?)"),
                eq(11L), eq(1L), eq("Mathamatics"), eq("A Number Of Detailed Math Problems"), eq(2)
        );

    }

    @Test
    public void testThatGetsAllUserRevisionTopics(){
        Long UserId = 1L;
        revisionTopicTests.getAllRevisionTopicsForUser(UserId);

        verify(jdbctemplate).query(
                eq("SELECT * FROM revisiontopic WHERE UserId = ?"),
                ArgumentMatchers.<RevisionTopicImpl.RevisionTopicRowMapper>any(),
                eq(1L)

        );



    }



}
