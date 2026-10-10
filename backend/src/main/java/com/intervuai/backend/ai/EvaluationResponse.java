package com.intervuai.backend.ai;

import java.util.List;

public class EvaluationResponse {

    private int score;
    private List<String> strengths;
    private List<String> weaknesses;
    private String correctAnswer;
    private List<String> suggestions;
    private List<String> followUpQuestions;
    private String recommendedDifficulty;

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public List<String> getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(List<String> weaknesses) {
        this.weaknesses = weaknesses;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }

    public List<String> getFollowUpQuestions() { return followUpQuestions; }
    public void setFollowUpQuestions(List<String> followUpQuestions) { this.followUpQuestions = followUpQuestions; }
    public String getRecommendedDifficulty() { return recommendedDifficulty; }
    public void setRecommendedDifficulty(String recommendedDifficulty) { this.recommendedDifficulty = recommendedDifficulty; }
}
