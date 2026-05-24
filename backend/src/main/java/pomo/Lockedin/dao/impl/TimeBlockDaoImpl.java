package pomo.Lockedin.dao.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.TimeBlockDao;
import pomo.Lockedin.dto.TimeBlockDTO;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Slf4j
@Repository
@RequiredArgsConstructor
public class TimeBlockDaoImpl implements TimeBlockDao {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<TimeBlockDTO> ROW_MAPPER = (rs, rowNum) -> TimeBlockDTO.builder()
            .id(rs.getLong("id"))
            .date(rs.getDate("block_date").toLocalDate())
            .startMinute(rs.getInt("start_minute"))
            .endMinute(rs.getInt("end_minute"))
            .type(rs.getString("type"))
            .title(rs.getString("title"))
            .build();

    @Override
    public List<TimeBlockDTO> getBlocksForDate(Long userId, LocalDate date) {
        try {
            String sql = "SELECT id, block_date, start_minute, end_minute, type, title " +
                         "FROM time_blocks WHERE user_id = ? AND block_date = ? ORDER BY start_minute";
            return jdbcTemplate.query(sql, ROW_MAPPER, userId, date);
        } catch (Exception e) {
            log.error("Error fetching time blocks for user {} on {}: {}", userId, date, e.getMessage());
            return List.of();
        }
    }

    @Override
    public TimeBlockDTO createBlock(Long userId, TimeBlockDTO block) {
        String sql = "INSERT INTO time_blocks (user_id, block_date, start_minute, end_minute, type, title) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, userId);
            ps.setDate(2, java.sql.Date.valueOf(block.getDate()));
            ps.setInt(3, block.getStartMinute());
            ps.setInt(4, block.getEndMinute());
            ps.setString(5, block.getType());
            ps.setString(6, block.getTitle() != null ? block.getTitle() : "");
            return ps;
        }, keyHolder);
        block.setId(keyHolder.getKey().longValue());
        return block;
    }

    @Override
    public Optional<TimeBlockDTO> updateBlock(Long userId, Long blockId, TimeBlockDTO block) {
        try {
            String sql = "UPDATE time_blocks SET start_minute = ?, end_minute = ?, type = ?, title = ? " +
                         "WHERE id = ? AND user_id = ?";
            int rows = jdbcTemplate.update(sql,
                    block.getStartMinute(), block.getEndMinute(),
                    block.getType(), block.getTitle() != null ? block.getTitle() : "",
                    blockId, userId);
            if (rows == 0) return Optional.empty();
            block.setId(blockId);
            return Optional.of(block);
        } catch (Exception e) {
            log.error("Error updating time block {} for user {}: {}", blockId, userId, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public boolean deleteBlock(Long userId, Long blockId) {
        try {
            int rows = jdbcTemplate.update(
                    "DELETE FROM time_blocks WHERE id = ? AND user_id = ?", blockId, userId);
            return rows > 0;
        } catch (Exception e) {
            log.error("Error deleting time block {} for user {}: {}", blockId, userId, e.getMessage());
            return false;
        }
    }
}
