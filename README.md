# IntervuAI

IntervuAI is a full-stack, AI-powered interview preparation platform with a React/Vite frontend, Spring Boot API, and PostgreSQL. Students can create accounts, practise HR or technical interviews by topic and difficulty, get AI feedback, review resume-based questions, and track performance over time.

## Requirements

- Node.js and npm
- Java 25
- PostgreSQL
- A Groq API key for answer evaluation, speech transcription, and resume review
- An isolated Judge0 CE service for DSA code execution (optional; currently enabled for Two Sum and Best Time to Buy and Sell Stock)

## Configure the backend

Create a PostgreSQL database named `intervuai`, then set these environment variables before starting Spring Boot:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | JDBC connection URL | `jdbc:postgresql://localhost:5432/intervuai` |
| `DATABASE_USERNAME` | Database user | `postgres` |
| `DATABASE_PASSWORD` | Database password | Empty |
| `GROQ_API_KEY` | Groq API key used for evaluations | Required for AI feedback |
| `CODE_RUNNER_URL` | Private Judge0 CE base URL | Empty disables code execution |
| `CODE_RUNNER_AUTH_TOKEN` | Judge0 API authentication token | Empty if runner authentication is not enabled |
| `CODE_RUNNER_AUTH_USER` | Judge0 authorization token | Empty unless required by your runner |

The question bank is populated from the DSA workbook and the HR and Java JSON files. Every startup imports missing questions only, comparing interview type and title without case sensitivity; existing records are retained. DSA retrieval is case-insensitive. Public question APIs omit expected answers and evaluation-only fields so the browser does not receive answer keys before a response is submitted.

From PowerShell, for example:

```powershell
$env:DATABASE_PASSWORD = [REDACTED]
$env:GROQ_API_KEY = [REDACTED]
cd backend
.\mvnw.cmd spring-boot:run
```

## Start the frontend

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

The frontend uses `/api` and the Vite development server proxies those requests to `http://localhost:8080`.

## Interview flow

Create an account or sign in, then choose HR, Java, or DSA, a topic, and difficulty. Sessions use structured questions, AI feedback, and answer coaching. HR practice spans introductions, motivation, strengths, teamwork, adaptability, communication, and work style; it supports optional spoken answers with a text transcript. Answers and scores are saved to PostgreSQL per account and available from **My history**. Topic scores identify weak areas and guide future practice toward them.

The Resume Review option accepts PDF, DOCX, or TXT resumes (up to 5 MB) and returns a readiness score, strengths, gaps, concrete suggestions, and tailored HR questions that can be practised in an interview session. Extracted resume text is sent to Groq for analysis and is not stored by IntervuAI. Scanned image-only PDFs are not supported yet. Voice recordings are sent to Groq for transcription; IntervuAI stores the answer text and score, not the audio recording. Interview answers and feedback are saved to PostgreSQL for the signed-in user's history; the browser keeps only aggregate skill scores for adaptive practice, not full answer text.

DSA includes secure-runner integrations for Two Sum and Best Time to Buy and Sell Stock. Code is sent to a separate Judge0 CE service; Spring Boot does not execute submitted code. See [docs/code-execution.md](docs/code-execution.md) before configuring a runner. Other DSA challenges continue to use AI review until their execution adapters and test cases are added.

## Automated checks

```powershell
cd frontend
npm test
npm run lint
npm run build

cd ..\backend
.\mvnw.cmd test
```

Backend tests use an isolated in-memory database; they do not require PostgreSQL or a Groq key.

