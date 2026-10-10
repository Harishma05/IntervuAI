package com.intervuai.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.intervuai.backend.model.QuestionBank;
import com.intervuai.backend.repository.QuestionBankRepository;

@Service
public class QuestionBankService {

    @Autowired
    private QuestionBankRepository questionBankRepository;

    // Get all questions for a particular interview type
    public List<QuestionBank> getQuestionsByInterviewType(String interviewType) {

        return questionBankRepository.findByInterviewTypeIgnoreCase(interviewType);

    }

    public List<QuestionBank> getQuestions(String interviewType, String topic, String difficulty) {
        boolean hasTopic = topic != null && !topic.isBlank() && !topic.equalsIgnoreCase("All topics");
        boolean hasDifficulty = difficulty != null && !difficulty.isBlank() && !difficulty.equalsIgnoreCase("Any difficulty");
        if (hasTopic && hasDifficulty) {
            return questionBankRepository.findByInterviewTypeIgnoreCaseAndTopicIgnoreCaseAndDifficultyIgnoreCase(
                    interviewType, topic.trim(), difficulty.trim());
        }
        if (hasTopic) return questionBankRepository.findByInterviewTypeIgnoreCaseAndTopicIgnoreCase(interviewType, topic.trim());
        if (hasDifficulty) return questionBankRepository.findByInterviewTypeIgnoreCaseAndDifficultyIgnoreCase(interviewType, difficulty.trim());
        return questionBankRepository.findByInterviewTypeIgnoreCase(interviewType);
    }

    // Get one random question
    public QuestionBank getRandomQuestion(String interviewType) {

    return questionBankRepository.getRandomQuestion(interviewType);

}
}
