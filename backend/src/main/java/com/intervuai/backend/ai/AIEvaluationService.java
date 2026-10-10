package com.intervuai.backend.ai;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AIEvaluationService {

    private final GroqService groqService;

    public AIEvaluationService(GroqService groqService) {
        this.groqService = groqService;
    }

    public EvaluationResponse evaluateAnswer(String question, String answer) {
        if (answer == null || answer.isBlank()) {
            EvaluationResponse response = new EvaluationResponse();
            response.setScore(0);
            response.setStrengths(List.of());
            response.setWeaknesses(List.of("No answer provided."));
            response.setCorrectAnswer("");
            response.setSuggestions(List.of("Please provide an answer."));
            response.setFollowUpQuestions(List.of());
            response.setRecommendedDifficulty("Easy");
            return response;
        }
        EvaluationResponse response = groqService.evaluate(question, answer);
        response.setScore(Math.max(0, Math.min(10, response.getScore())));
        return response;
    }

    public ResumeEvaluationResponse reviewResume(String resumeText) {
        return groqService.reviewResume(resumeText);
    }

    public String transcribeAudio(MultipartFile audio) {
        return groqService.transcribeAudio(audio);
    }
}
