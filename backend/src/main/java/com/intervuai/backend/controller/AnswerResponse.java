package com.intervuai.backend.controller;

import java.time.Instant;

import com.intervuai.backend.model.InterviewAnswer;

public record AnswerResponse(Long id, String interviewType, String question, String answer,
        Long userId, String sessionId, String topic, Integer score, String feedback, Instant createdAt) {
    public static AnswerResponse from(InterviewAnswer answer) {
        return new AnswerResponse(answer.getId(), answer.getInterviewType(), answer.getQuestion(), answer.getAnswer(),
                answer.getUserId(), answer.getStoredSessionId(), answer.getTopic(), answer.getScore(), answer.getFeedback(), answer.getCreatedAt());
    }
}
