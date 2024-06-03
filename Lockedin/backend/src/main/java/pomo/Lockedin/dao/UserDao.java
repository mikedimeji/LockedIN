package pomo.Lockedin.dao;

import pomo.Lockedin.entities.User;

import java.util.Optional;

public interface UserDao {
    void createUser(User user);

    Optional<User> findUserByEmail(String email);
}
