package com.intervuai.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.intervuai.backend.model.InterviewAnswer;
import com.intervuai.backend.service.InterviewAnswerService;

@RestController
@RequestMapping("/api/answers")
@CrossOrigin(origins = "http://localhost:5173")
public class InterviewAnswerController {

    @Autowired
    private InterviewAnswerService service;

    @PostMapping
    public InterviewAnswer saveAnswer(@RequestBody InterviewAnswer answer) {
        return service.saveAnswer(answer);
    }
}