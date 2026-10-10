package com.intervuai.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import jakarta.validation.Valid;
import com.intervuai.backend.dto.HistorySummaryResponse;
import com.intervuai.backend.dto.PagedAnswerResponse;

import com.intervuai.backend.model.InterviewAnswer;
import com.intervuai.backend.service.InterviewAnswerService;

@RestController
@RequestMapping("/api/answers")
public class InterviewAnswerController {

    @Autowired
    private InterviewAnswerService service;

    @PostMapping
    public AnswerResponse saveAnswer(@Valid @RequestBody AnswerRequest request, Authentication authentication) {
        InterviewAnswer answer = new InterviewAnswer(request.interviewType(), request.question(), request.answer());
        answer.setSessionId(request.sessionId());
        answer.setTopic(request.topic());
        answer.setScore(request.score());
        answer.setFeedback(request.feedback());
        return AnswerResponse.from(service.saveAnswer(answer, Long.valueOf(authentication.getName())));
    }

    @GetMapping
    public PagedAnswerResponse getHistory(Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.clamp(size, 1, 100);
        return PagedAnswerResponse.from(service.getHistory(Long.valueOf(authentication.getName()),
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    @GetMapping("/summary")
    public HistorySummaryResponse getSummary(Authentication authentication) {
        return service.getSummary(Long.valueOf(authentication.getName()));
    }
}
