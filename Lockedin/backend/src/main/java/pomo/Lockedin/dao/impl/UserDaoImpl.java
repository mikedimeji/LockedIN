package pomo.Lockedin.dao.impl;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.UserDao;
import pomo.Lockedin.entities.Role;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.entities.User_Auth;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;


@Repository
public class UserDaoImpl implements UserDao {

    private final JdbcTemplate jdcbtemplate;


    public UserDaoImpl(final JdbcTemplate jdcbtemplate) {
        this.jdcbtemplate = jdcbtemplate;
    }

    @Override
    public void createUser(User user) {

        String sql = "INSERT INTO User (UserId, Username, Email, password) VALUES (?, ?, ?, ?)";
        jdcbtemplate.update(sql, user.getUser_Id(), user.getUsername(), user.getEmail(), user.getPassword(), user.getRole());

    }

    @Override
    public Optional<User> findUserByEmail(String email) {
        String sql = "SELECT * FROM user WHERE email = ? LIMIIT 1";
        try{
            User results = jdcbtemplate.queryForObject(sql,new UserRowMapper(),email);
            return Optional.of(results);

        } catch (Exception e){
            return Optional.empty();
        }
    }


    public static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {

            User_Auth userAuth = User_Auth.builder()
                    .passwordHashed(rs.getString("password")) // Replace "password" with the actual column name for password
                    .build();

            return User.builder()
                    .user_Id(rs.getLong("userId"))
                    .username(rs.getString("username"))
                    .email(rs.getString("email"))
                    .password(rs.getString("password"))
                    .role(Role.USER)
                    .build();
        }
    }

}
