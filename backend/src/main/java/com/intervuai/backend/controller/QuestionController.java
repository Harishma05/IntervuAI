package com.intervuai.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.intervuai.backend.model.Question;
import com.intervuai.backend.service.QuestionService;
import com.intervuai.backend.dto.LegacyQuestionResponse;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @GetMapping("/{interviewType}")
    public List<LegacyQuestionResponse> getQuestionsByType(@PathVariable String interviewType) {
        return questionService.getQuestionsByType(interviewType).stream()
                .map(LegacyQuestionResponse::from).toList();
    }
}
