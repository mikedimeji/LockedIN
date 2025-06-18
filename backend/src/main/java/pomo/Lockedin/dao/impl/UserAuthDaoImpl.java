package pomo.Lockedin.dao.impl;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import pomo.Lockedin.dao.UserAuthDao;
import pomo.Lockedin.entities.User_Auth;

@Repository
public class UserAuthDaoImpl implements UserAuthDao {

    private final JdbcTemplate jdcbtemplate;

    public UserAuthDaoImpl(final JdbcTemplate jdcbtemplate) {this.jdcbtemplate = jdcbtemplate;}


    @Override
    public void createUserAuth(User_Auth userAuth) {

        jdcbtemplate.update("INSERT INTO user_auth (AuthenticationId, UserId, Password_hashed, Created_at) VALUES (?, ?, ?, ?)",
                userAuth.getAuthenticationId(), userAuth.getUserId(),userAuth.getCreatedAt(), userAuth.getPasswordHashed());
    }
}
