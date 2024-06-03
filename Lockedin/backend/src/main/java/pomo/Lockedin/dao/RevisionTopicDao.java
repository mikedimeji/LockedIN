package pomo.Lockedin.dao;

import pomo.Lockedin.entities.RevisionTopic;

import java.util.List;
import java.util.Optional;

public interface RevisionTopicDao{
    void createRevisionTopic(RevisionTopic revisionTopic);

    Optional<List<RevisionTopic>> getAllRevisionTopicsForUser(Long userId);
}
