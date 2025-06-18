package pomo.Lockedin.Mapper.impl;

import pomo.Lockedin.Mapper.Mapper;
import pomo.Lockedin.dto.UserDTO;
import pomo.Lockedin.entities.User;

public class UserMapperImpl implements Mapper<User, UserDTO> {
    @Override
    public UserDTO mapTo(User user) {
        return null;
    }

    @Override
    public User mapFrom(UserDTO userDTO) {
        return null;
    }
}
