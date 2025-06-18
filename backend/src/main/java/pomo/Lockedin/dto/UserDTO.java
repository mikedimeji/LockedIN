package pomo.Lockedin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pomo.Lockedin.entities.Role;
import pomo.Lockedin.entities.User_Auth;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDTO {

    private Long user_Id;
    private String username;
    private String email;
    private String password;
    private Role role;
}
