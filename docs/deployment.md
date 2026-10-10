# IntervuAI deployment

For a local Kubernetes setup, follow [the Kubernetes guide](../k8s/README.md). The resources in `k8s/` run the combined frontend/API with an external PostgreSQL database and a Kubernetes Secret for credentials. They do not create a Kubernetes cluster or publish the image to a registry.

## Run locally with Docker

1. Copy `.env.example` to `.env` in the project root.
2. Set a local database password and `GROQ_API_KEY` in `.env`. Never commit `.env`.
3. Run `docker compose up --build` from the project root.
4. Open `http://localhost:3000`.
5. Stop the containers with `docker compose down`. The local database volume remains. Use `docker compose down -v` only when you intentionally want to erase it.

## Free demo deployment: Render + Neon

The production-style demo runs the website and API from the same Render web service. That keeps login and CSRF requests on one website address. The root `Dockerfile` builds the React frontend and packages it with Spring Boot. Render's `render.yaml` describes the service.

Use Neon for PostgreSQL instead of Render's free PostgreSQL: Render free databases expire after 30 days. Neon currently lists 1 GB storage per free project and 100 compute-hours per month, subject to its plan limits. These free plans are for demos and practice, not important user data.

### Set up the database

1. Create a Neon account and a PostgreSQL project.
2. In the Neon project, copy the connection details for the database, username, and password. Keep the password private.
3. Build the JDBC URL in this format: `jdbc:postgresql://<Neon-host>/<database-name>?sslmode=require`. Use the host and database name from Neon. Enter the username and password in their separate fields in Render.

### Deploy the app

1. Push the project to a GitHub repository that you control. Do not include `.env` or secrets.
2. Create a Render account and connect that repository.
3. In Render, create a **Blueprint** from the repository. Render finds `render.yaml` and builds the root `Dockerfile` as a free web service.
4. When Render asks for environment values, enter `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, and `GROQ_API_KEY`. Enter secret values only in the Render dashboard. The blueprint sets secure cookie options automatically.
5. Wait for the first build and deploy to finish, then open the Render service URL. Test account creation, login/logout, question retrieval, AI evaluation, resume review, and history.

### Limits to expect

- A Render free web service sleeps after 15 minutes without requests. The first visit after it sleeps can take about a minute to wake up.
- A free Render PostgreSQL database expires after 30 days, so use Neon for this demo and keep a separate backup of anything you need.
- Neon free projects have storage and compute limits. Usage limits and free-plan terms can change.
- Free hosting is suitable for learning and demos. It does not provide production uptime, backups, or a performance guarantee.
- Render and Neon accounts are not connected from this repository. The project cannot be deployed until you create those accounts and connect a GitHub repository.

## Before using real users or important data

- Choose a paid database plan with backups and verify that you can restore a backup.
- The backend uses versioned Flyway migrations and Hibernate schema validation. Before pointing it at an existing database, take a backup, restore it into a separate database, and review [V1 baseline migration](../backend/src/main/resources/db/migration/V1__baseline_schema.sql) against that copy. The migration is idempotent and baselines pre-existing schemas at version 0; first startup validates the resulting schema instead of silently changing it through Hibernate. Do not skip the copy-and-review step for the existing 208-row database.
- Review the platform's rate limits and configure alerts for health checks, HTTP 5xx errors, AI provider failures, database problems, and usage limits.
- Test registration, login, logout, interviews, resume review, history pagination, and data separation with two accounts and a second device.
- Do not put credentials, resume text, or answer contents in logs. Never place API keys in frontend variables or source control.
