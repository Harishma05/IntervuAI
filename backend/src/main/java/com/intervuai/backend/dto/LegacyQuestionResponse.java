package com.intervuai.backend.dto;

import com.intervuai.backend.model.Question;

/** Public representation of the legacy question API without its stored answer key. */
public record LegacyQuestionResponse(Long id, String interviewType, String question) {
    public static LegacyQuestionResponse from(Question question) {
        return new LegacyQuestionResponse(question.getId(), question.getInterviewType(), question.getQuestion());
    }
}
