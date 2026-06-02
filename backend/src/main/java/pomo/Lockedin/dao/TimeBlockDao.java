package pomo.Lockedin.dao;

import pomo.Lockedin.dto.TimeBlockDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TimeBlockDao {
    List<TimeBlockDTO> getBlocksForDate(Long userId, LocalDate date);
    List<TimeBlockDTO> getBlocksForRange(Long userId, LocalDate from, LocalDate to);
    TimeBlockDTO createBlock(Long userId, TimeBlockDTO block);
    Optional<TimeBlockDTO> updateBlock(Long userId, Long blockId, TimeBlockDTO block);
    boolean deleteBlock(Long userId, Long blockId);
}
