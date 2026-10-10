package com.intervuai.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.intervuai.backend.model.InterviewAnswer;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface InterviewAnswerRepository extends JpaRepository<InterviewAnswer, Long> {
    Page<InterviewAnswer> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUser_Id(Long userId);

    @Query(value = "select count(distinct coalesce(nullif(session_id, ''), 'legacy-' || cast(id as varchar))) "
            + "from interview_answers where user_id = :userId", nativeQuery = true)
    long countSessionsByUserId(@Param("userId") Long userId);

    @Query("select a.interviewType as interviewType, coalesce(a.topic, 'General') as topic, "
            + "avg(a.score) as averageScore, count(a) as answerCount "
            + "from InterviewAnswer a where a.user.id = :userId and a.score is not null "
            + "group by a.interviewType, a.topic")
    java.util.List<TopicPerformanceProjection> summarizeTopics(@Param("userId") Long userId);
    Optional<InterviewAnswer> findFirstByUser_IdAndSession_SessionKeyAndQuestion(Long userId, String sessionKey, String question);

}
