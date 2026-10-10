package com.intervuai.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.intervuai.backend.model.InterviewAnswer;
import com.intervuai.backend.model.InterviewSession;
import com.intervuai.backend.model.AppUser;
import com.intervuai.backend.dto.HistorySummaryResponse;
import com.intervuai.backend.repository.InterviewAnswerRepository;
import com.intervuai.backend.repository.InterviewSessionRepository;
import com.intervuai.backend.repository.AppUserRepository;

@Service
public class InterviewAnswerService {

    @Autowired
    private InterviewAnswerRepository repository;

    @Autowired
    private InterviewSessionRepository sessions;

    @Autowired
    private AppUserRepository users;

    @Transactional
    public InterviewAnswer saveAnswer(InterviewAnswer answer, Long userId) {
        AppUser user = users.getReferenceById(userId);
        InterviewSession session = sessions.findByUser_IdAndSessionKey(userId, answer.getSessionId())
                .orElseGet(() -> {
                    InterviewSession created = new InterviewSession();
                    created.setSessionKey(answer.getSessionId());
                    created.setInterviewType(answer.getInterviewType());
                    created.setUser(user);
                    return sessions.save(created);
                });
        InterviewAnswer saved = repository.findFirstByUser_IdAndSession_SessionKeyAndQuestion(userId, answer.getSessionId(), answer.getQuestion())
                .orElseGet(InterviewAnswer::new);
        saved.setUser(user);
        saved.setSession(session);
        saved.setSessionId(answer.getSessionId());
        saved.setInterviewType(answer.getInterviewType());
        saved.setQuestion(answer.getQuestion());
        saved.setTopic(answer.getTopic());
        saved.setAnswer(answer.getAnswer());
        saved.setScore(answer.getScore());
        saved.setFeedback(answer.getFeedback());
        return repository.save(saved);
    }

    public org.springframework.data.domain.Page<InterviewAnswer> getHistory(Long userId, org.springframework.data.domain.Pageable pageable) {
        return repository.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
    }

    public HistorySummaryResponse getSummary(Long userId) {
        return HistorySummaryResponse.from(
                repository.countSessionsByUserId(userId), repository.countByUser_Id(userId), repository.summarizeTopics(userId));
    }
}
