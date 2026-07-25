package com.intervuai.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.intervuai.backend.model.Question;
import com.intervuai.backend.service.QuestionService;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "http://localhost:5173")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @GetMapping("/{interviewType}")
    public List<Question> getQuestionsByType(@PathVariable String interviewType) {
        return questionService.getQuestionsByType(interviewType);
    }
}