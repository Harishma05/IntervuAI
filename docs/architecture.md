# IntervuAI Architecture

## Project Overview

IntervuAI is an AI-powered interview preparation platform.

The application conducts mock interviews,
evaluates user answers, identifies weak areas,
and provides personalized feedback.

---

## System Components

### Frontend

Technology:
- React.js

Responsibility:
- User interface
- Interview screen
- Dashboard
- Results display


### Backend

Technology:
- Spring Boot

Responsibility:
- REST APIs
- Authentication
- Business logic
- Communication between frontend, database, and AI


### Database

Technology:
- PostgreSQL

Responsibility:
- Store users
- Store interview sessions
- Store questions and answers
- Store performance history


### AI Service

Technology:
- Python
- LLM API

Responsibility:
- Answer evaluation
- Feedback generation
- Question selection