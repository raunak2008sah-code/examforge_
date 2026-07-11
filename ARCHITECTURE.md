# ExamForge Architecture & Developer Guide

## Core Concepts

### 1. Draft-First Architecture
ExamForge separates the editing process from the final delivery format.
- When an exam is uploaded and parsed, it exists entirely as a JSON document (`workingJson`) within a `ReviewQueue` record.
- Students/Admins edit this JSON document dynamically via the frontend builder. It autosaves gracefully without creating thousands of relational inserts.
- **Commit Boundary:** When the user clicks "Save" or "Publish", the backend `ExamRepository` uses a massive Prisma `$transaction` to map the `workingJson` into `Exam`, `ExamVersion`, `Section`, `Question`, and `Option` tables.

### 2. Role-Based Access Control (RBAC)
Security is implemented using `better-auth` combined with an internal `authService` wrapper that asserts constraints across layers.
- Roles: `ADMIN`, `REVIEWER`, `STUDENT`.
- Functions like `requireOwnershipFromHeaders` enforce Row-Level Security equivalents at the API layer.
- Ensure all services assert the userId from the authenticated context instead of trusting client payloads.

### 3. Server-Authoritative CBT Engine
The Computer-Based Testing runtime relies on the server to prevent cheating:
- `isCorrect` flags are stripped by `AttemptService` before the JSON reaches the browser.
- The `EvaluationService` calculates scores on the backend.
- The exam timer acts dynamically on the client but the backend enforces the `expiresAt` timestamp (with a small latency grace period) to prevent time-tampering.

## Infrastructure & DevOps

### Microservices
1. **Web (Next.js):** The primary monorepo orchestrator. Handles Authentication, Dashboard UI, CBT Engine, and the API.
2. **Parser (FastAPI):** A highly specialized Python microservice. Separated from Node.js because the Python ecosystem is drastically superior at PDF text extraction (`pdfplumber`) and OCR fallback (`pytesseract`).

### Containerization
The entire stack is containerized for declarative deployment.
- `apps/web/Dockerfile`: Utilizes Next.js standalone output.
- `apps/parser/Dockerfile`: Packages Python along with OS-level binaries for Poppler and Tesseract.
- We rely on `docker-compose.yml` for unified local development orchestrations.

## Observability & Performance
- We use **Zod** to validate complex payloads.
- We use **RateLimiter** to prevent DDoS attempts on high-throughput endpoints like `PUT /api/v1/attempts/[id]/responses`.
- We use **Pino** for structured JSON logging.

## Deployment Checklist
- Set `LOG_LEVEL=info` in production.
- Ensure Database pool size supports up to 60 hits/minute per concurrent student taking an exam.
