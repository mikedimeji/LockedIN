package pomo.Lockedin.repository;

import org.springframework.data.repository.CrudRepository;
import pomo.Lockedin.entities.User;

public interface UserRepository extends CrudRepository<User, Long> {
}
