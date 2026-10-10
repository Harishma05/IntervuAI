package com.intervuai.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.intervuai.backend.model.QuestionBank;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {

    List<QuestionBank> findByInterviewTypeIgnoreCase(String interviewType);
    List<QuestionBank> findByInterviewTypeIgnoreCaseAndTopicIgnoreCase(String interviewType, String topic);
    List<QuestionBank> findByInterviewTypeIgnoreCaseAndDifficultyIgnoreCase(String interviewType, String difficulty);
    List<QuestionBank> findByInterviewTypeIgnoreCaseAndTopicIgnoreCaseAndDifficultyIgnoreCase(
            String interviewType, String topic, String difficulty);

    @Query(value = """
        SELECT *
        FROM question_bank
        WHERE lower(interview_type) = lower(?1)
        ORDER BY RANDOM()
        LIMIT 1
        """, nativeQuery = true)
    QuestionBank getRandomQuestion(String interviewType);

}
