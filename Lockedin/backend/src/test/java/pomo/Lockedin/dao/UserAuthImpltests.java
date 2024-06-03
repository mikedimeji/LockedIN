package pomo.Lockedin.dao;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import pomo.Lockedin.dao.impl.UserAuthDaoImpl;
import pomo.Lockedin.entities.User_Auth;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class UserAuthImpltests {

    @Mock
    private JdbcTemplate jdbctemplate;

    @InjectMocks
    private UserAuthDaoImpl userAuthTest;

    @Test
    public void testThatCreatesUserAuthentication(){
        User_Auth userAuth = User_Auth.builder()
                .authenticationId(123L)
                .userId(1L)
                .createdAt("20/05/2024")
                .passwordHashed("5f4dcc3b5aa765d61d8327deb882cf99")
                .build();
        userAuthTest.createUserAuth(userAuth);

        verify(jdbctemplate).update(
                eq("INSERT INTO user_auth (AuthenticationId, UserId, Password_hashed, Created_at) VALUES (?, ?, ?, ?)"),
                eq(123L), eq(1L), eq("20/05/2024"), eq("5f4dcc3b5aa765d61d8327deb882cf99")
        );
    }

}
