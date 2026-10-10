package com.intervuai.backend.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Lightweight per-process protection for login attempts and paid AI provider calls. */
public class ApiRateLimitFilter extends OncePerRequestFilter {
    private static final long WINDOW_NANOS = 60_000_000_000L;
    private static final int MAX_TRACKED_KEYS = 20_000;
    private static final int AUTH_LIMIT = 10;
    private static final int AI_LIMIT = 12;
    private static final int CODE_RUN_LIMIT = 5;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        boolean authAttempt = "POST".equals(method)
                && (path.equals("/api/auth/login") || path.equals("/api/auth/register"));
        boolean aiRequest = "POST".equals(method) && path.startsWith("/api/ai/");
        boolean codeRunRequest = "POST".equals(method) && path.equals("/api/code/run");
        if (!authAttempt && !aiRequest && !codeRunRequest) {
            chain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String actor = (aiRequest || codeRunRequest) && authentication != null && authentication.isAuthenticated()
                ? authentication.getName() : request.getRemoteAddr();
        String bucket = (authAttempt ? "auth:" : codeRunRequest ? "code:" : "ai:") + actor;
        int limit = authAttempt ? AUTH_LIMIT : codeRunRequest ? CODE_RUN_LIMIT : AI_LIMIT;
        long now = System.nanoTime();
        if (!allow(bucket, now, limit)) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"detail\":\"Too many requests. Wait a minute and try again.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private synchronized boolean allow(String key, long now, int limit) {
        if (windows.size() >= MAX_TRACKED_KEYS && !windows.containsKey(key)) {
            windows.entrySet().removeIf(entry -> now - entry.getValue().startedAt >= WINDOW_NANOS);
            // Refuse new buckets while a burst of distinct actors fills the bounded tracker.
            if (windows.size() >= MAX_TRACKED_KEYS) return false;
        }
        Window updated = windows.compute(key, (ignored, current) -> {
            if (current == null || now - current.startedAt >= WINDOW_NANOS) return new Window(now, 1);
            return new Window(current.startedAt, current.count + 1);
        });
        return updated.count <= limit;
    }

    private record Window(long startedAt, int count) { }
}
