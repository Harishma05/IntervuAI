package com.intervuai.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.intervuai.backend.model.AppUser;
import com.intervuai.backend.model.InterviewAnswer;
import com.intervuai.backend.model.InterviewSession;
import com.intervuai.backend.repository.AppUserRepository;
import com.intervuai.backend.repository.InterviewAnswerRepository;
import com.intervuai.backend.repository.InterviewSessionRepository;

@ExtendWith(MockitoExtension.class)
class InterviewAnswerServiceTest {
    @Mock InterviewAnswerRepository answers;
    @Mock InterviewSessionRepository sessions;
    @Mock AppUserRepository users;
    @InjectMocks InterviewAnswerService service;

    @Test
    void bindsAnswerAndSessionToAuthenticatedUserAndPersistsFeedback() {
        AppUser owner = new AppUser();
        when(users.getReferenceById(42L)).thenReturn(owner);
        when(sessions.findByUser_IdAndSessionKey(42L, "session-a")).thenReturn(Optional.empty());
        when(sessions.save(any(InterviewSession.class))).thenAnswer(call -> call.getArgument(0));
        when(answers.findFirstByUser_IdAndSession_SessionKeyAndQuestion(42L, "session-a", "Tell me about a time"))
                .thenReturn(Optional.empty());
        when(answers.save(any(InterviewAnswer.class))).thenAnswer(call -> call.getArgument(0));

        InterviewAnswer request = new InterviewAnswer("HR Interview", "Tell me about a time", "I did the work.");
        request.setSessionId("session-a");
        request.setScore(7);
        request.setFeedback("{\"suggestions\":[\"Add results\"]}");
        InterviewAnswer saved = service.saveAnswer(request, 42L);

        assertEquals(owner, saved.getUser());
        assertEquals(owner, saved.getSession().getUser());
        assertEquals("session-a", saved.getStoredSessionId());
        assertEquals(request.getFeedback(), saved.getFeedback());
        verify(answers).findFirstByUser_IdAndSession_SessionKeyAndQuestion(42L, "session-a", "Tell me about a time");
    }
}
