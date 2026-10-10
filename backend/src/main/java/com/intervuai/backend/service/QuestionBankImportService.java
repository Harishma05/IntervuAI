package com.intervuai.backend.service;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ConnectionCallback;

import com.intervuai.backend.model.QuestionBank;
import com.intervuai.backend.repository.QuestionBankRepository;

@Service
public class QuestionBankImportService {
    private final QuestionBankRepository repository;
    private final JdbcTemplate jdbcTemplate;

    public QuestionBankImportService(QuestionBankRepository repository, JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Imports only questions whose normalized interview type and title are not already present. */
    @Transactional
    public int importMissing(List<QuestionBank> incoming) {
        serializePostgresImports();
        Set<String> existingKeys = new HashSet<>();
        repository.findAll().forEach(question -> existingKeys.add(key(question)));

        List<QuestionBank> missing = new java.util.ArrayList<>();
        for (QuestionBank question : incoming) {
            if (question.getInterviewType() == null || question.getInterviewType().isBlank()
                    || question.getTitle() == null || question.getTitle().isBlank()) {
                continue;
            }
            String type = question.getInterviewType().trim().toUpperCase(Locale.ROOT);
            question.setInterviewType(type);
            question.setTitle(question.getTitle().trim());
            if (existingKeys.add(key(question))) {
                missing.add(question);
            }
        }

        if (!missing.isEmpty()) {
            repository.saveAll(missing);
        }
        return missing.size();
    }

    private String key(QuestionBank question) {
        return normalize(question.getInterviewType()) + "\u0000" + normalize(question.getTitle());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private void serializePostgresImports() {
        ConnectionCallback<Void> callback = connection -> {
            String product = connection.getMetaData().getDatabaseProductName();
            // PostgreSQL advisory transaction locks serialize app instances during startup imports.
            if (product != null && product.toLowerCase(Locale.ROOT).contains("postgresql")) {
                try (var statement = connection.createStatement()) {
                    statement.execute("select pg_advisory_xact_lock(195164137)");
                }
            }
            return null;
        };
        jdbcTemplate.execute(callback);
    }
}
