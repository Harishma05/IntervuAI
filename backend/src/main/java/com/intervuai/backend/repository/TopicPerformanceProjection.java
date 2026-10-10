package com.intervuai.backend.repository;

public interface TopicPerformanceProjection {
    String getInterviewType();
    String getTopic();
    Double getAverageScore();
    Long getAnswerCount();
}
