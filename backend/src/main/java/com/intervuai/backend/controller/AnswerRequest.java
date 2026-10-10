package com.intervuai.backend.controller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AnswerRequest(
        @NotBlank @Size(max = 80) String interviewType,
        @NotBlank @Size(max = 2000) String question,
        @NotBlank @Size(max = 20000) String answer,
        @Size(max = 120) String topic,
        @NotNull @Min(0) @Max(10) Integer score,
        @NotBlank @Size(max = 80) String sessionId,
        @Size(max = 16000) String feedback) {
}
