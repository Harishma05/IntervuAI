package com.intervuai.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.intervuai.backend.dto.QuestionResponse;
import com.intervuai.backend.model.QuestionBank;
import com.intervuai.backend.service.QuestionBankService;

@RestController
@RequestMapping("/api/question-bank")
public class QuestionBankController {

    @Autowired
    private QuestionBankService questionBankService;

    @GetMapping("/{interviewType}")
    public List<QuestionResponse> getQuestionsByInterviewType(
            @PathVariable String interviewType,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String difficulty) {
        return questionBankService.getQuestions(interviewType, topic, difficulty).stream()
                .map(QuestionResponse::from).toList();

    }

    @GetMapping("/random/{interviewType}")
    public QuestionResponse getRandomQuestion(@PathVariable String interviewType) {
        QuestionBank question = questionBankService.getRandomQuestion(interviewType);
        return question == null ? null : QuestionResponse.from(question);
    }
}
