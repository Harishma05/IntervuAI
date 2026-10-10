package com.intervuai.backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intervuai.backend.model.QuestionBank;
import com.intervuai.backend.service.QuestionBankImportService;
import com.intervuai.backend.service.ExcelImportService;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.util.List;

@Component
public class QuestionBankLoader {
    private static final Logger log = LoggerFactory.getLogger(QuestionBankLoader.class);

    private final ExcelImportService excelImportService;
    private final QuestionBankImportService importService;
    private final ObjectMapper mapper = new ObjectMapper();

    public QuestionBankLoader(ExcelImportService excelImportService,
            QuestionBankImportService importService) {
        this.excelImportService = excelImportService;
        this.importService = importService;
    }

    @PostConstruct
    public void loadQuestions() {

        try {
            int dsaCount = excelImportService.importQuestions();
            int hrCount = loadFile("hr_questions.json");
            int javaCount = loadFile("java_questions.json");
            log.info("Question bank ready; imported {} new DSA, {} new HR, and {} new Java questions.",
                    dsaCount, hrCount, javaCount);

        } catch (Exception e) {
            throw new IllegalStateException("Could not initialize the question bank.", e);
        }
    }

    private int loadFile(String fileName) throws Exception {

        try (InputStream inputStream = new ClassPathResource(fileName).getInputStream()) {
            List<QuestionBank> questions = mapper.readValue(
                    inputStream,
                    new TypeReference<List<QuestionBank>>() {}
            );
            return importService.importMissing(questions);
        }
    }
}
