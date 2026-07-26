package com.intervuai.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.intervuai.backend.model.InterviewAnswer;
import com.intervuai.backend.repository.InterviewAnswerRepository;

@Service
public class InterviewAnswerService {

    @Autowired
    private InterviewAnswerRepository repository;

    public InterviewAnswer saveAnswer(InterviewAnswer answer) {
        return repository.save(answer);
    }
}