package com.intervuai.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:intervuai-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=[REDACTED]
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.flyway.enabled=false"
})
@AutoConfigureMockMvc
class BackendApplicationTests {
	@Autowired MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void contextLoads() {
	}

	@Test
	void loginRouteServesTheFrontendApplicationWithoutLogin() throws Exception {
		mockMvc.perform(get("/login"))
				.andExpect(status().isOk())
				.andExpect(forwardedUrl("/index.html"));
	}

	@Test
	void questionApiReturnsDsaQuestionsRegardlessOfStoredCase() throws Exception {
		MockHttpSession session = register("dsa-user");
		mockMvc.perform(get("/api/question-bank/DSA").session(session))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].interviewType").value("DSA"));
	}

	@Test
	void questionBanksIncludeExpandedJavaAndHrSets() throws Exception {
		MockHttpSession session = register("question-bank-user");
		JsonNode javaQuestions = objectMapper.readTree(mockMvc.perform(get("/api/question-bank/Java").session(session))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		JsonNode hrQuestions = objectMapper.readTree(mockMvc.perform(get("/api/question-bank/HR").session(session))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertTrue(javaQuestions.size() >= 40, "Java question bank should have broad topic coverage");
		assertTrue(hrQuestions.size() >= 50, "HR question bank should have broad behavioral coverage");
	}

	@Test
	void answersAndHistoryAreScopedToTheSignedInUserAndSession() throws Exception {
		MockHttpSession firstUser = register("first-user");
		MockHttpSession secondUser = register("second-user");
		String sessionId = UUID.randomUUID().toString();
		String body = """
				{"interviewType":"HR Interview","question":"Tell me about a time you worked in a team.",
				"answer":"I worked with my team to deliver the project.","topic":"Teamwork & Collaboration",
				"score":7,"sessionId":"%s","feedback":"{\\\"suggestions\\\":[\\\"Add a measurable result.\\\"]}"}
				""".formatted(sessionId);

		mockMvc.perform(post("/api/answers").with(csrf()).session(firstUser).contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.sessionId").value(sessionId));
		mockMvc.perform(get("/api/answers").session(secondUser))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content").isEmpty());
		mockMvc.perform(get("/api/answers").session(firstUser))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content.length()").value(1))
				.andExpect(jsonPath("$.content[0].feedback").exists());
		mockMvc.perform(get("/api/answers/summary").session(firstUser))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalSessions").value(1))
				.andExpect(jsonPath("$.totalAnswers").value(1));
	}

	private MockHttpSession register(String label) throws Exception {
		String email = label + "-" + UUID.randomUUID() + "@example.test";
		String request = """
				{"displayName":"Test User","email":"%s","password":"StrongPass123!"}
				""".formatted(email);
		MvcResult result = mockMvc.perform(post("/api/auth/register").with(csrf())
				.contentType(MediaType.APPLICATION_JSON).content(request))
				.andExpect(status().isOk()).andReturn();
		return (MockHttpSession) result.getRequest().getSession(false);
	}

	private RequestPostProcessor csrf() throws Exception {
		MvcResult result = mockMvc.perform(get("/api/auth/csrf")).andReturn();
		JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
		String token = payload.path("token").asText();
		Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
		return request -> {
			request.setCookies(cookie);
			request.addHeader("X-XSRF-TOKEN", token);
			return request;
		};
	}
}
