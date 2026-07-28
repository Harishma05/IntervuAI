package com.intervuai.backend.ai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.intervuai.backend.config.GeminiConfig;

@Service
public class GeminiService {

    @Autowired
    private RestClient restClient;

    @Autowired
    private GeminiConfig geminiConfig;

    public String evaluate(String question, String answer) {

        String apiKey = geminiConfig.getApiKey();

        // We'll use this in the next step
        System.out.println("Gemini API Key Loaded: " + (apiKey != null));

        return "Gemini Service Ready";
    }
}