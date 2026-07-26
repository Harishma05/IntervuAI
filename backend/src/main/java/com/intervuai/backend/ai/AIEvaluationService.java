package com.intervuai.backend.ai;

import org.springframework.stereotype.Service;

@Service
public class AIEvaluationService {

    public String evaluateAnswer(String question, String answer) {

        if (answer == null || answer.trim().isEmpty()) {
            return "Score: 0/10\n\nFeedback: No answer provided.";
        }

        if (answer.length() > 50) {
            return """
Score: 8/10

Strengths:
✔ Good explanation
✔ Answer is detailed

Areas to Improve:
• Add more technical terms
• Include an example
""";
        }

        return """
Score: 5/10

Strengths:
✔ Attempted the question

Areas to Improve:
• Answer is too short
• Explain in more detail
""";
    }
}