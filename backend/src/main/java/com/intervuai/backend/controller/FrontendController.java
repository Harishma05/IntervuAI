package com.intervuai.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Serves the React single-page application on direct visits to client-side routes. */
@Controller
public class FrontendController {
    @GetMapping({"/login", "/register", "/interview", "/session", "/results", "/resume-review", "/history"})
    public String forwardToApplication() {
        return "forward:/index.html";
    }
}
