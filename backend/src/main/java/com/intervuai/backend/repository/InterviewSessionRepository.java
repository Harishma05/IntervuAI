package com.intervuai.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.intervuai.backend.model.InterviewSession;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    Optional<InterviewSession> findByUser_IdAndSessionKey(Long userId, String sessionKey);
    long countByUser_Id(Long userId);
}
