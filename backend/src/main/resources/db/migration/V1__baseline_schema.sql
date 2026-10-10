-- Idempotent baseline for both a new database and the prototype schema.
-- Existing user data is retained; missing fields and indexes are added in place.

CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS question_bank (
    id BIGSERIAL PRIMARY KEY,
    interview_type VARCHAR(255),
    topic VARCHAR(255),
    difficulty VARCHAR(255),
    title VARCHAR(255),
    companies VARCHAR(255),
    frequency VARCHAR(255),
    problem_statement TEXT,
    expected_answer TEXT,
    expected_approach TEXT,
    key_concepts TEXT,
    sample_input TEXT,
    sample_output TEXT,
    time_complexity VARCHAR(255),
    space_complexity VARCHAR(255),
    tags TEXT
);

ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS interview_type VARCHAR(255);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS difficulty VARCHAR(255);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS companies VARCHAR(255);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS frequency VARCHAR(255);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS problem_statement TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS expected_answer TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS expected_approach TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS key_concepts TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS sample_input TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS sample_output TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS time_complexity VARCHAR(255);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS space_complexity VARCHAR(255);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS tags TEXT;

CREATE TABLE IF NOT EXISTS interview_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_key VARCHAR(80) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES app_users(id),
    interview_type VARCHAR(80) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_interview_session_owner_key UNIQUE (user_id, session_key)
);

CREATE TABLE IF NOT EXISTS interview_answers (
    id BIGSERIAL PRIMARY KEY,
    interview_type VARCHAR(255),
    question VARCHAR(255),
    answer TEXT,
    user_id BIGINT REFERENCES app_users(id),
    session_fk BIGINT REFERENCES interview_sessions(id),
    session_id VARCHAR(255),
    topic VARCHAR(255),
    score INTEGER,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS interview_type VARCHAR(255);
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS question VARCHAR(255);
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS answer TEXT;
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS session_fk BIGINT;
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_answers_user') THEN
        ALTER TABLE interview_answers ADD CONSTRAINT fk_answers_user FOREIGN KEY (user_id) REFERENCES app_users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_answers_session') THEN
        ALTER TABLE interview_answers ADD CONSTRAINT fk_answers_session FOREIGN KEY (session_fk) REFERENCES interview_sessions(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS questions (
    id BIGINT PRIMARY KEY,
    interview_type VARCHAR(255),
    question VARCHAR(255),
    answer VARCHAR(255)
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS interview_type VARCHAR(255);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question VARCHAR(255);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_question_type_topic_difficulty ON question_bank(interview_type, topic, difficulty);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON interview_sessions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_answers_user_created ON interview_answers(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_answers_session_fk ON interview_answers(session_fk);
