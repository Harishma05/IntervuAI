package com.intervuai.backend.dto;

import java.util.List;

import org.springframework.data.domain.Page;

import com.intervuai.backend.controller.AnswerResponse;
import com.intervuai.backend.model.InterviewAnswer;

public record PagedAnswerResponse(List<AnswerResponse> content, int number, int size,
        int totalPages, long totalElements) {
    public static PagedAnswerResponse from(Page<InterviewAnswer> page) {
        return new PagedAnswerResponse(page.getContent().stream().map(AnswerResponse::from).toList(),
                page.getNumber(), page.getSize(), page.getTotalPages(), page.getTotalElements());
    }
}
