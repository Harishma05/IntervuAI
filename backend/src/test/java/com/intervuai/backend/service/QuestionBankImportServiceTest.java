package com.intervuai.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import com.intervuai.backend.model.QuestionBank;
import com.intervuai.backend.repository.QuestionBankRepository;

@ExtendWith(MockitoExtension.class)
class QuestionBankImportServiceTest {
    @Mock QuestionBankRepository repository;
    @Mock JdbcTemplate jdbcTemplate;
    @InjectMocks QuestionBankImportService importService;

    @Test
    void skipsExistingAndDuplicateTitlesIgnoringCaseAndNormalizesInterviewType() {
        when(repository.findAll()).thenReturn(List.of(question("dsa", "Two Sum")));

        int imported = importService.importMissing(List.of(
                question("DSA", " two sum "),
                question("dsa", "Valid new question"),
                question("DSA", "VALID NEW QUESTION"),
                question("", "Missing type"),
                question("DSA", " ")));

        assertEquals(1, imported);
        ArgumentCaptor<List<QuestionBank>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertEquals(1, captor.getValue().size());
        assertEquals("DSA", captor.getValue().getFirst().getInterviewType());
        assertEquals("Valid new question", captor.getValue().getFirst().getTitle());
    }

    private QuestionBank question(String type, String title) {
        QuestionBank question = new QuestionBank();
        question.setInterviewType(type);
        question.setTitle(title);
        return question;
    }
}
