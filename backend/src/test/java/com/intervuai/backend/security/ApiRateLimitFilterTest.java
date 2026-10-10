package com.intervuai.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class ApiRateLimitFilterTest {
    @Test
    void limitsRepeatedAuthenticationAttemptsByRemoteAddress() throws Exception {
        ApiRateLimitFilter filter = new ApiRateLimitFilter();
        AtomicInteger passedThrough = new AtomicInteger();

        for (int index = 0; index < 10; index++) {
            MockHttpServletResponse response = sendLogin(filter, passedThrough);
            assertEquals(200, response.getStatus());
        }
        MockHttpServletResponse blocked = sendLogin(filter, passedThrough);

        assertEquals(429, blocked.getStatus());
        assertEquals("60", blocked.getHeader("Retry-After"));
        assertTrue(blocked.getContentAsString().contains("Too many requests"));
        assertEquals(10, passedThrough.get());
    }

    private MockHttpServletResponse sendLogin(ApiRateLimitFilter filter, AtomicInteger passedThrough) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("192.0.2.10");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, (req, res) -> passedThrough.incrementAndGet());
        return response;
    }
}
