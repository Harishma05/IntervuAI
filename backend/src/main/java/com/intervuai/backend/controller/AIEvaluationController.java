package com.intervuai.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.intervuai.backend.ai.AIEvaluationService;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AIEvaluationController {

    @Autowired
    private AIEvaluationService aiService;

    @PostMapping("/evaluate")
    public String evaluate(@RequestBody EvaluationRequest request) {

        return aiService.evaluateAnswer(
                request.getQuestion(),
                request.getAnswer()
        );
    }


    static class EvaluationRequest {

        private String question;
        private String answer;


        public String getQuestion() {
            return question;
        }

        public void setQuestion(String question) {
            this.question = question;
        }


        public String getAnswer() {
            return answer;
        }

        public void setAnswer(String answer) {
            this.answer = answer;
        }
    }
}
