package pomo.Lockedin.dao.impl;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.RevisionTopicDao;
import pomo.Lockedin.entities.RevisionTopic;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
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
        String sql = "INSERT INTO revisiontopic (user_id, title, description, pomodoro_number) VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, revisionTopic.getUserId());
            ps.setString(2, revisionTopic.getTitle());
            ps.setString(3, revisionTopic.getDescription() != null ? revisionTopic.getDescription() : "");
            ps.setInt(4, revisionTopic.getPomodoroNumber());
            return ps;
        }, keyHolder);
        if (keyHolder.getKey() != null) {
            revisionTopic.setRevisionTopicId(keyHolder.getKey().longValue());
        }
    }

    @Override
    public Optional<List<RevisionTopic>> getAllRevisionTopicsForUser(Long userId) {
        String sql = "SELECT * FROM revisiontopic WHERE user_id = ?";
        List<RevisionTopic> results =  jdbcTemplate.query(sql, new RevisionTopicRowMapper(), userId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results);
    }

    @Override
    public void deleteRevisionTopic(Long id, Long userId) {
        String sql = "DELETE FROM revisiontopic WHERE revision_topic_id = ? AND user_id = ?";
        jdbcTemplate.update(sql, id, userId);
    }

    @Override
    public int countByUserId(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM revisiontopic WHERE user_id = ?", Integer.class, userId);
        return count != null ? count : 0;
    }

    public static class RevisionTopicRowMapper implements RowMapper<RevisionTopic> {
        @Override
        public RevisionTopic mapRow(ResultSet rs, int rowNum) throws SQLException {
            return RevisionTopic.builder()
                    .revisionTopicId(rs.getLong("revision_topic_id"))
                    .userId(rs.getLong("user_id"))
                    .title(rs.getString("title"))
                    .description(rs.getString("description"))
                    .pomodoroNumber(rs.getInt("pomodoro_number"))
                    .build();
        }
    }
}
