package pomo.Lockedin.Mapper.impl;

import lombok.NoArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;
import pomo.Lockedin.Mapper.Mapper;
import pomo.Lockedin.dto.RevisionTopicDTO;
import pomo.Lockedin.entities.RevisionTopic;

@NoArgsConstructor
@Component
public class RevisionTopicMapperimpl implements Mapper<RevisionTopicDTO, RevisionTopic> {


    private ModelMapper modelMapper;


    @Override
    public RevisionTopic mapTo(RevisionTopicDTO revisionTopicDTO) {

       return modelMapper.map(revisionTopicDTO, RevisionTopic.class);

    }

    @Override
    public RevisionTopicDTO mapFrom(RevisionTopic revisionTopic) {

        return modelMapper.map(revisionTopic, RevisionTopicDTO.class);

    }
}
