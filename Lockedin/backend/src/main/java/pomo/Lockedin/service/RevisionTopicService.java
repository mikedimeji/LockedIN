package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import pomo.Lockedin.Mapper.Mapper;
import pomo.Lockedin.dao.impl.RevisionTopicImpl;
import pomo.Lockedin.dto.RevisionTopicDTO;
import pomo.Lockedin.entities.RevisionTopic;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RevisionTopicService {

    private final RevisionTopicImpl revisionTopicRepo;

    private final Mapper<RevisionTopicDTO, RevisionTopic> rtoMapper;

    public List<RevisionTopicDTO> getRevisionTopicsByUserId(Long UserId){
        //convert from DTO to RevisionTopicObject
        //Call impl layer for backend call
        //return List of all DTO'S through mapper conversion

        Optional<List<RevisionTopic>> res = revisionTopicRepo.getAllRevisionTopicsForUser(UserId);
        if (res.isPresent()){
            return res.get().stream()
                    .map(rtoMapper::mapFrom)
                    .collect(Collectors.toList());
        } else {
            throw new RuntimeException("No Revision Topics Found For User Id: " + UserId);
        }
    }

}
