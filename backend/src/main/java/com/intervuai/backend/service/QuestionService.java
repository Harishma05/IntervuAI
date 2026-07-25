package com.intervuai.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.intervuai.backend.model.Question;
import com.intervuai.backend.repository.QuestionRepository;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    public List<Question> getQuestionsByType(String interviewType) {
        return questionRepository.findByInterviewType(interviewType);
    }
}