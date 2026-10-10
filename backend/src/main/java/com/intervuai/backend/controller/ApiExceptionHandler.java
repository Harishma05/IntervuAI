package com.intervuai.backend.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.AccessDeniedException;

import com.intervuai.backend.ai.AiProviderException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException exception) {
        String message = exception.getReason() == null ? "Request could not be completed." : exception.getReason();
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("detail", message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst().map(error -> error.getDefaultMessage())
                .orElse("Check the submitted fields and try again.");
        return ResponseEntity.badRequest().body(Map.of("detail", message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, String>> handleMalformedRequest() {
        return ResponseEntity.badRequest().body(Map.of("detail", "The request body is missing or invalid."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> handleBadInput(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("detail",
                exception.getMessage() == null ? "Check the submitted values and try again." : exception.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Map<String, String>> handleAccessDenied() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("detail", "Your security token expired. Refresh the page and try again."));
    }

    @ExceptionHandler(AiProviderException.class)
    ResponseEntity<Map<String, String>> handleAiProvider(AiProviderException exception, HttpServletRequest request) {
        log.warn("AI provider request failed for {}: {}", request.getRequestURI(), exception.getMessage());
        int status = exception.getMessage() != null && exception.getMessage().contains("not configured")
                ? HttpStatus.SERVICE_UNAVAILABLE.value() : HttpStatus.BAD_GATEWAY.value();
        return ResponseEntity.status(status).body(Map.of("detail", exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, String>> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled API error for {}", request.getRequestURI(), exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("detail", "An unexpected server error occurred. Check the backend log and try again."));
    }
}
