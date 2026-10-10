package com.intervuai.backend.controller;

import com.intervuai.backend.service.CodeExecutionService;
import com.intervuai.backend.service.CodeExecutionService.CodeRunResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/code")
public class CodeExecutionController {
    private final CodeExecutionService codeExecutionService;

    public CodeExecutionController(CodeExecutionService codeExecutionService) {
        this.codeExecutionService = codeExecutionService;
    }

    @PostMapping("/run")
    public CodeRunResult run(@Valid @RequestBody CodeRunRequest request) {
        return codeExecutionService.run(request.questionId(), request.language(), request.code());
    }

    public record CodeRunRequest(
            @NotNull Long questionId,
            @NotBlank @Size(max = 30) String language,
            @NotBlank @Size(max = 12000) String code) { }
}
