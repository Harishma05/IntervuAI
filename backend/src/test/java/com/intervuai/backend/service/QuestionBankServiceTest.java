package com.intervuai.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.intervuai.backend.model.QuestionBank;
import com.intervuai.backend.repository.QuestionBankRepository;

@ExtendWith(MockitoExtension.class)
class QuestionBankServiceTest {
    @Mock QuestionBankRepository repository;
    @InjectMocks QuestionBankService service;

    @Test
    void retrievesQuestionsCaseInsensitivelyAndFiltersInDatabase() {
        QuestionBank expected = new QuestionBank();
        when(repository.findByInterviewTypeIgnoreCaseAndTopicIgnoreCaseAndDifficultyIgnoreCase(
                "DSA", "Arrays", "Easy")).thenReturn(List.of(expected));

        List<QuestionBank> result = service.getQuestions("DSA", " Arrays ", "Easy");

        assertEquals(List.of(expected), result);
        verify(repository).findByInterviewTypeIgnoreCaseAndTopicIgnoreCaseAndDifficultyIgnoreCase(
                "DSA", "Arrays", "Easy");
    }

    @Test
    void allTopicsAndAnyDifficultyDoNotBecomeLiteralFilters() {
        when(repository.findByInterviewTypeIgnoreCase("HR")).thenReturn(List.of());

        assertEquals(List.of(), service.getQuestions("HR", "All topics", "Any difficulty"));
        verify(repository).findByInterviewTypeIgnoreCase("HR");
    }
}
