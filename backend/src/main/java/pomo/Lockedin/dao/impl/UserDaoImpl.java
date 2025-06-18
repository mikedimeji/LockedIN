package pomo.Lockedin.dao.impl;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.UserDao;
import pomo.Lockedin.entities.Role;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.entities.User_Auth;
import lombok.extern.slf4j.Slf4j;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

@Slf4j
@Repository
public class UserDaoImpl implements UserDao {

    private final JdbcTemplate jdbcTemplate;

    public UserDaoImpl(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void createUser(User user) {
        String sql = "INSERT INTO user (user_id, username, email, password, role) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, user.getUser_Id(), user.getUsername(), user.getEmail(), user.getPassword(), user.getRole().toString());
    }

    @Override
    public Optional<User> findUserByEmailOrUsername(String identifier) {
        String sql = "SELECT * FROM user WHERE email = ? OR username = ? LIMIT 1";
        log.debug("Executing query to find user by identifier: {}", identifier);
        try {
            User result = jdbcTemplate.queryForObject(sql, new UserRowMapper(), identifier, identifier);
            return Optional.of(result);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public void updateUserGold(Long userId, int newGoldAmount) {
        String sql = "UPDATE user SET gold = ? WHERE user_id = ?";
        jdbcTemplate.update(sql, newGoldAmount, userId);
        log.debug("Updated gold amount for user ID {}: {}", userId, newGoldAmount);
    }

    @Override
    public int getUserGold(Long userId) {
        String sql = "SELECT gold FROM user WHERE user_id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, Integer.class, userId);
        } catch (Exception e) {
            log.error("Error retrieving gold for user ID {}: {}", userId, e.getMessage());
            return 0; // Default value if not found
        }
    }

    @Override
    public void incrementUserGold(Long userId, int amount) {
        String sql = "UPDATE user SET gold = gold + ? WHERE user_id = ?";
        jdbcTemplate.update(sql, amount, userId);
        log.debug("Incremented gold for user ID {} by {}", userId, amount);
    }


    public static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            return User.builder()
                    .user_Id(rs.getLong("user_id"))
                    .username(rs.getString("username"))
                    .email(rs.getString("email"))
                    .password(rs.getString("password"))
                    .role(Role.valueOf(rs.getString("role"))) // Dynamically map roles
                    .gold(rs.getInt("gold"))
                    .build();
        }
    }
}

