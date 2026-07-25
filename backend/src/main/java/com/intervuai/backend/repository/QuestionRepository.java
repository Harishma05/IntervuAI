package com.intervuai.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.intervuai.backend.model.Question;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByInterviewType(String interviewType);

}