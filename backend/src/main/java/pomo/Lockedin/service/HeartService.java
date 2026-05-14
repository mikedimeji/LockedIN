package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dao.UserStatsDao;
import pomo.Lockedin.entities.UserStats;

import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class HeartService {

    private final UserStatsDao userStatsDao;
    private final UserService userService;

    public UserStats getOrRefillHearts(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) throw new RuntimeException("User not found: " + userEmail);

        Optional<UserStats> opt = userStatsDao.getUserStatsByUserId(userId);

        UserStats stats;
        if (opt.isEmpty()) {
            stats = UserStats.builder()
                    .userId(userId)
                    .heartPoints(2)
                    .lastHeartRefillDate(LocalDate.now())
                    .currentStreak(0)
                    .longestStreak(0)
                    .build();
            userStatsDao.createUserStats(stats);
            return stats;
        }

        stats = opt.get();
        LocalDate today = LocalDate.now();

        if (stats.getLastHeartRefillDate() == null || stats.getLastHeartRefillDate().isBefore(today)) {
            stats.setHeartPoints(2);
            stats.setLastHeartRefillDate(today);
            userStatsDao.updateHearts(userId, 2, today);
        }

        return stats;
    }

    public UserStats breakHeart(String userEmail) {
        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) throw new RuntimeException("User not found: " + userEmail);

        UserStats stats = getOrRefillHearts(userEmail);
        if (stats == null) return null;

        int newHeartPoints = Math.max(0, stats.getHeartPoints() - 1);
        stats.setHeartPoints(newHeartPoints);
        userStatsDao.updateHearts(userId, newHeartPoints, stats.getLastHeartRefillDate());

        if (newHeartPoints == 0) {
            stats.setCurrentStreak(0);
            userStatsDao.updateStreak(userId, 0, stats.getLongestStreak());
        }

        return stats;
    }
}
