package pomo.Lockedin.dao;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import pomo.Lockedin.dao.impl.RevisionTopicImpl;
import pomo.Lockedin.dao.impl.UserDaoImpl;
import pomo.Lockedin.entities.User;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class UserDaoImplTests {

    @Mock
    private JdbcTemplate jdbcTemplate;
    @InjectMocks
    private UserDaoImpl userTest;

    @Test
    public void testThatCreateUserGeneratesTheCorrectSql(){
        User user = User.builder()
                .user_Id(1L)
                .email("oladimeji.michael123@gmail.com")
                .username("Razan21")
                .build();
        userTest.createUser(user);

        verify(jdbcTemplate).update(
                eq("INSERT INTO User (UserId, Username, Email) VALUES (?, ?, ?)"),
                eq(1L), eq("Razan21"), eq("oladimeji.michael123@gmail.com")
        );
    }

    @Test
    public void testThatFindsUserByEmail(){

        String tEmail = "oladimeji.michael12345@gmail.com";


        userTest.findUserByEmail(tEmail);


        verify(jdbcTemplate).query(
                eq("SELECT * FROM user WHERE email = ?"),
                ArgumentMatchers.<UserDaoImpl.UserRowMapper>any(),
                eq("oladimeji.michael12345@gmail.com")
        );
    }
}

