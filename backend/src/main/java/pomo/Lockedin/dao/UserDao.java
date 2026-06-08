package pomo.Lockedin.dao;

import pomo.Lockedin.entities.User;

import java.util.Optional;

public interface UserDao {
    void createUser(User user);

    Optional<User> findUserByEmailOrUsername(String identifier);
    void updateUserGold(Long userId, int newGoldAmount);
    int getUserGold(Long userId);
    void incrementUserGold(Long userId, int amount);
    void updatePassword(String email, String encodedPassword);
}
