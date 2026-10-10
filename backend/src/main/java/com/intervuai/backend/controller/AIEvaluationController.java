package com.intervuai.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.intervuai.backend.ai.AIEvaluationService;
import com.intervuai.backend.ai.EvaluationResponse;
import com.intervuai.backend.ai.ResumeEvaluationResponse;
import com.intervuai.backend.service.ResumeFileService;

@RestController
@RequestMapping("/api/ai")
public class AIEvaluationController {

    private final AIEvaluationService aiEvaluationService;
    private final ResumeFileService resumeFileService;

    public AIEvaluationController(AIEvaluationService aiEvaluationService, ResumeFileService resumeFileService) {
        this.aiEvaluationService = aiEvaluationService;
        this.resumeFileService = resumeFileService;
    }

    @PostMapping("/evaluate")
    public EvaluationResponse evaluate(@Valid @RequestBody EvaluationRequest request) {
        return aiEvaluationService.evaluateAnswer(request.question(), request.answer());
    }

    @PostMapping(value = "/review-resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResumeEvaluationResponse reviewResume(@RequestPart("file") MultipartFile file) {
        String resumeText = resumeFileService.extractText(file);
        return aiEvaluationService.reviewResume(resumeText);
    }

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> transcribe(@RequestPart("file") MultipartFile file) {
        return Map.of("text", aiEvaluationService.transcribeAudio(file));
    }

    public record EvaluationRequest(
            @NotBlank @Size(max = 2000) String question,
            @NotBlank @Size(max = 15000) String answer) {}

}
