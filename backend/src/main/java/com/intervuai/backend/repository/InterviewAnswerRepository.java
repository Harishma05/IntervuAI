package com.intervuai.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.intervuai.backend.model.InterviewAnswer;

@Repository
public interface InterviewAnswerRepository extends JpaRepository<InterviewAnswer, Long> {

}