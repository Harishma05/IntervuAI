package com.intervuai.backend.controller;

import java.util.Locale;
import java.util.Map;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.intervuai.backend.model.AppUser;
import com.intervuai.backend.repository.AppUserRepository;
import com.intervuai.backend.security.SessionAuthenticationFilter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.web.csrf.CsrfToken;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AppUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public UserResponse register(@RequestBody AuthRequest request, HttpServletRequest servletRequest) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        String name = request.displayName() == null ? "" : request.displayName().trim();
        String password = request.password() == null ? "" : request.password();
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        }
        if (name.isBlank() || name.length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter your name (up to 80 characters).");
        }
        if (password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a password with at least 8 characters.");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is too long. Use at most 72 UTF-8 bytes.");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setDisplayName(name);
        user.setPasswordHash(passwordEncoder.encode(password));
        user = users.save(user);
        return createSession(user, servletRequest);
    }

    @PostMapping("/login")
    public UserResponse login(@RequestBody AuthRequest request, HttpServletRequest servletRequest) {
        String email = request.email() == null ? "" : request.email().trim();
        AppUser user = users.findByEmailIgnoreCase(email)
                .filter(found -> request.password() != null && passwordEncoder.matches(request.password(), found.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect."));
        return createSession(user, servletRequest);
    }

    @GetMapping("/me")
    public UserResponse currentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Object userId = session == null ? null : session.getAttribute(SessionAuthenticationFilter.USER_ID_ATTRIBUTE);
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue.");
        AppUser user = users.findById(Long.valueOf(userId.toString()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue."));
        return response(user);
    }

    @GetMapping("/csrf")
    public Map<String, String> csrfToken(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return Map.of("message", "Signed out.");
    }

    private UserResponse createSession(AppUser user, HttpServletRequest request) {
        HttpSession previous = request.getSession(false);
        if (previous != null) previous.invalidate();
        HttpSession session = request.getSession(true);
        session.setAttribute(SessionAuthenticationFilter.USER_ID_ATTRIBUTE, user.getId());
        return response(user);
    }

    private UserResponse response(AppUser user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName());
    }

    public record AuthRequest(String email, String password, String displayName) {}
    public record UserResponse(Long id, String email, String displayName) {}
}
