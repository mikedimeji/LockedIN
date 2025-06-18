package pomo.Lockedin.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table("user_auth")
public class User_Auth {
    @Id
    private Long authenticationId;
    private Long userId;
    private String passwordHashed;
    private String createdAt;
}
