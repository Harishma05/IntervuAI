package com.intervuai.backend.dto;

import com.intervuai.backend.model.QuestionBank;

/** Public question data for practice; answer keys and evaluator-only fields stay server-side. */
public record QuestionResponse(
        Long id,
        String interviewType,
        String topic,
        String difficulty,
        String title,
        String problemStatement,
        String keyConcepts,
        String sampleInput,
        String sampleOutput) {

    public static QuestionResponse from(QuestionBank question) {
        return new QuestionResponse(
                question.getId(), question.getInterviewType(), question.getTopic(), question.getDifficulty(),
                question.getTitle(), question.getProblemStatement(), question.getKeyConcepts(),
                question.getSampleInput(), question.getSampleOutput());
    }
}
