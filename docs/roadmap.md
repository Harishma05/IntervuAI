# IntervuAI completion status

## Phase 1 — Core functionality

- [x] Expanded the repository question sources to 53 HR and 48 Java questions, with no duplicate type/title pairs in either file; the DSA workbook has 100 populated rows.
- [x] Import missing records on every start, normalize type/title comparisons, skip duplicates within a source and across sources, and serialize PostgreSQL imports across app instances.
- [x] Retrieve questions by interview type with case-insensitive topic/difficulty filters in the database. This also fixes DSA topics stored with lowercase `dsa`.
- [x] React retrieves question banks from the API and runs the interview/answer/revision flow.
- [x] Secure Judge0 test execution supports Two Sum and Best Time to Buy and Sell Stock in Java, Python, JavaScript, and C++.
- [x] Public question APIs return practice-safe DTOs and keep expected answers and evaluator-only fields on the backend.
- [ ] Audit the user's live PostgreSQL question rows. The repository has not been connected to the user's local database, so the previously reported 208-row database has not been verified or changed.

## Phase 2 — User system

- [x] Registration and login with BCrypt password hashes and session cookies.
- [x] CSRF token validation for browser mutations and explicit configurable CORS origins.
- [x] `app_users`, `interview_sessions`, and `interview_answers` have entity relationships; legacy answers remain readable while new answers are linked to owned sessions.
- [x] Answer writes and history queries are scoped to the authenticated user.

## Phase 3 — AI coaching

- [x] AI answer evaluation, strengths, weaknesses, exemplar answer, and suggestions.
- [x] Follow-up questions and recommended next difficulty.
- [x] Answer feedback is persisted with the user's history.
- [x] Weak-topic analysis is computed from all of that user's saved answers; adaptive question choice uses server-side performance when available and shifts difficulty accordingly.
- [x] Resume-based question generation and resume review.

## Phase 4 — Reliability

- [x] Backend request validation, structured errors, bounded AI request timeouts, and a per-process rate limit for login and AI calls.
- [x] Paginated answer history, topic summary queries, and indexes for common lookups.
- [x] Health, readiness, and metrics endpoints through Spring Actuator.
- [x] Replace Hibernate auto-update with Flyway versioned migration and schema validation; keep a documented backup/review step for the existing database.
- [x] Remove full interview answers from browser local storage; only aggregate topic scores remain there for adaptive question selection.
- [x] Frontend unit tests, backend unit/integration tests, lint, and production build are available.
- [ ] Verify the baseline migration against a backup of the existing 208-row PostgreSQL database before using it with that database; the repository has no connection to it.
- [ ] Measure production response times and database capacity with the intended hosting provider and dataset.

## Phase 5 — Deployment

- [x] Backend/frontend Dockerfiles, local Docker Compose, and a root Dockerfile for a single-origin Render demo are included.
- [x] Render Blueprint and Neon setup instructions are prepared; Render and Neon accounts still need to be connected.
- [ ] Deploy to Render, connect Neon PostgreSQL, and set the Groq key in Render's environment settings.
- [ ] Verify the deployed app on a second device.

## Phase 6 — Multi-user/load verification

- [x] Integration test registers two separate accounts and verifies their history stays isolated.
- [x] Unit test verifies rate limiting behavior.
- [ ] Run concurrent-user and load tests against a deployed instance; no production endpoint or credentials are available in the repository.
