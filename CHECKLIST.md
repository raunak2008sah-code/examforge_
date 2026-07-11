# Beta Readiness Checklist

Prior to releasing ExamForge to an external Closed Beta, the following items must be verified:

## 1. Development & Local Experience
- [x] Docker Compose configured for local development.
- [x] Environment templates (`.env.example`) present and documented.
- [x] Clear `DEVELOPMENT.md` available for onboarding.

## 2. Testing & CI/CD
- [x] Automated testing framework integrated (`vitest`, `pytest`).
- [x] GitHub Actions CI pipeline established on `main`.
- [x] Pre-commit hooks or CI steps for linting and typechecking.

## 3. Deployment & Infrastructure
- [x] Multi-stage `Dockerfile` created for `apps/web` (standalone output).
- [x] Python `Dockerfile` created for `apps/parser` with OS dependencies.
- [x] Managed PostgreSQL instance provisioned with connection pooler.
- [x] Supabase Storage bucket created and Service Key secured.

## 4. Monitoring & Health
- [x] Liveness/Readiness probes (`/health`) active on both services.
- [x] Structured JSON logging (Pino) implemented across the Node.js backend.
- [ ] Log aggregation tool (e.g., Datadog, AWS CloudWatch) configured in production.

## 5. Security & Privacy
- [x] `.env` secrets correctly loaded into CI/CD securely, never hardcoded.
- [x] Roles enforce ownership correctly for every API route.
- [x] No plaintext passwords stored (Better Auth utilized).

## 6. Backup & Recovery
- [ ] Automated daily database backups scheduled.
- [ ] Database point-in-time recovery enabled.
