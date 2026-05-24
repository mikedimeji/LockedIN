package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dao.TimeBlockDao;
import pomo.Lockedin.dto.TimeBlockDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TimeBlockService {

    private final TimeBlockDao timeBlockDao;
    private final UserService userService;

    public List<TimeBlockDTO> getBlocksForDate(String email, LocalDate date) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return List.of();
        return timeBlockDao.getBlocksForDate(userId, date);
    }

    public TimeBlockDTO createBlock(String email, TimeBlockDTO block) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) throw new IllegalArgumentException("User not found");
        return timeBlockDao.createBlock(userId, block);
    }

    public Optional<TimeBlockDTO> updateBlock(String email, Long blockId, TimeBlockDTO block) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return Optional.empty();
        return timeBlockDao.updateBlock(userId, blockId, block);
    }

    public boolean deleteBlock(String email, Long blockId) {
        Long userId = userService.getUserIdByEmail(email);
        if (userId == null) return false;
        return timeBlockDao.deleteBlock(userId, blockId);
    }
}
