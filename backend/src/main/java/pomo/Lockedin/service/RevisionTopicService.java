package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
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
        return res.map(list -> list.stream()
                    .map(rtoMapper::mapFrom)
                    .collect(Collectors.toList()))
                .orElse(List.of());
    }

    public RevisionTopicDTO createRevisionTopic(RevisionTopicDTO revisionTopicDTO) {

        RevisionTopic revisionTopic = rtoMapper.mapTo(revisionTopicDTO);
        revisionTopicRepo.createRevisionTopic(revisionTopic);
        // Return the same DTO or fetch it again if needed
        return rtoMapper.mapFrom(revisionTopic);
    }

    public void deleteRevisionTopicById(Long id, Long userId) {
        revisionTopicRepo.deleteRevisionTopic(id, userId);
    }

    public int countTopicsByUserId(Long userId) {
        return revisionTopicRepo.countByUserId(userId);
    }
}
