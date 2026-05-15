package pomo.Lockedin.service;


import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import pomo.Lockedin.dao.impl.RevisionTopicImpl;
import pomo.Lockedin.dao.impl.UserDaoImpl;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.entities.User_Auth;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserDaoImpl userRepo;


    public Long getUserIdByEmail(String userEmail) {
        Optional<User> userOptional = userRepo.findUserByEmailOrUsername(userEmail);
        return userOptional.map(User::getUser_Id).orElse(null);
    }

    public String getUsernameByEmail(String userEmail) {
        return userRepo.findUserByEmailOrUsername(userEmail)
                .map(User::getUsername)
                .orElse(null);
    }

}
