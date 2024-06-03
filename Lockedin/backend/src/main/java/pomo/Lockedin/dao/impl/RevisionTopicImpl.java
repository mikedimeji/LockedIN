package pomo.Lockedin.dao.impl;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.RevisionTopicDao;
import pomo.Lockedin.entities.RevisionTopic;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;


@Repository
public class RevisionTopicImpl implements RevisionTopicDao {

    private final JdbcTemplate jdbcTemplate;

    public RevisionTopicImpl(JdbcTemplate jdcbtemplate) {
        this.jdbcTemplate = jdcbtemplate;
    }


    @Override
    public void createRevisionTopic(RevisionTopic revisionTopic) {
        String sql = "INSERT INTO revisiontopic (RevisionTopicId, UserId, Title, Description, Pomodoro_number) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,revisionTopic.getRevisionTopicId(), revisionTopic.getUserId(), revisionTopic.getTitle(), revisionTopic.getDescription(), revisionTopic.getPomodoroNumber());

    }

    @Override
    public Optional<List<RevisionTopic>> getAllRevisionTopicsForUser(Long userId) {
        String sql = "SELECT * FROM revisiontopic WHERE UserId = ?";
        List<RevisionTopic> results =  jdbcTemplate.query(sql, new RevisionTopicRowMapper(), userId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results);
    }

    public static class RevisionTopicRowMapper implements RowMapper<RevisionTopic> {
        @Override
        public RevisionTopic mapRow(ResultSet rs, int rowNum) throws SQLException {

            return RevisionTopic.builder()
                    .revisionTopicId(rs.getLong("revisionTopicId"))
                    .userId(rs.getLong("UserId"))
                    .title(rs.getString("title"))
                    .description(rs.getString("description"))
                    .pomodoroNumber(rs.getInt("pomodoroNumber"))
                    .build();
        }
    }


}
