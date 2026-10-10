package com.intervuai.backend.dto;

import java.util.List;

import com.intervuai.backend.repository.TopicPerformanceProjection;

public record HistorySummaryResponse(long totalSessions, long totalAnswers, List<TopicPerformance> topics) {
    public static HistorySummaryResponse from(long sessions, long answers,
            List<TopicPerformanceProjection> topics) {
        return new HistorySummaryResponse(sessions, answers, topics.stream()
                .map(topic -> new TopicPerformance(topic.getInterviewType(), topic.getTopic(),
                        topic.getAverageScore(), topic.getAnswerCount()))
                .toList());
    }

    public record TopicPerformance(String interviewType, String topic, Double averageScore, Long answerCount) { }
}
