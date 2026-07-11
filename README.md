# ExamForge

ExamForge is an open-source, server-authoritative CBT (Computer-Based Testing) platform designed to parse PDFs, build structured interactive exams, and securely evaluate student attempts.

## Core Features
- **Upload & Parse:** Drag-and-drop PDFs, parsed into structured JEE Main exams via a Python FastAPI backend.
- **Draft-First Review Workspace:** Edit parsed output seamlessly before committing to a live database.
- **Server-Authoritative Runtime:** Students cannot cheat; all answers are evaluated server-side.
- **Role-Based Access Control:** Strict segregation between Admins and Students.

## Getting Started

The easiest way to run the application locally is via Docker Compose:

```bash
# 1. Copy the environment template
cp .env.example .env

# 2. Start the database, backend, and parser
docker compose up --build
```

### Documentation
- [Architecture](ARCHITECTURE.md)
- [Local Development Guide](DEVELOPMENT.md)
- [Testing Guide](TESTING.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Beta Readiness Checklist](CHECKLIST.md)
