# 02 — Technical Requirements Document (TRD)

**Project:** ExamForge _(temporary name)_
**Status:** Draft v0.1 — for review
**Depends on:** `01-PRD.md` (locked)

---

## 1. Why This Document Exists

The PRD defined _what_ and _for whom_. This document defines _how_: the architecture, stack, data model, and non-functional requirements needed to build v0 (JEE Main, MCQ-only, rule-based parsing, ₹0 budget, solo dev). Every decision below is traceable to a PRD requirement or constraint.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Monorepo (v0)                        │
│                                                               │
│  ┌───────────────────┐        ┌────────────────────────┐   │
│  │   apps/web         │        │  apps/doc-processor     │   │
│  │   Next.js 15       │◄──────►│  Python (FastAPI)       │   │
│  │   - UI (student +   │  HTTP  │  - PDF text extraction  │   │
│  │     admin)          │  (int) │  - JEE Main parser      │   │
│  │   - API routes       │        │  - OCR fallback         │   │
│  │   - Better Auth      │        │  - Validation           │   │
│  └─────────┬───────────┘        └───────────┬─────────────┘   │
│            │                                 │                 │
│            └───────────────┬─────────────────┘                 │
│                             ▼                                   │
│                  ┌────────────────────┐                        │
│                  │  packages/db        │  Prisma schema,       │
│                  │  (shared)            │  shared types         │
│                  └──────────┬──────────┘                        │
└─────────────────────────────┼───────────────────────────────────┘
                               ▼
                     PostgreSQL (Supabase)
                               │
                               ▼
                     Supabase Storage (PDFs)
```

**Why monorepo, deployed together (per your decision):** one Vercel project for `apps/web`, one small always-on or on-demand host for `apps/doc-processor` (Railway free tier or Render free tier — both support Python + persistent disk for temp files). They share a `packages/db` folder for the Prisma schema and generated types so both sides agree on the data model. If the processor later needs to scale independently (e.g., heavier OCR load), it can be pulled into its own repo without touching `apps/web`, because the only contract between them is an HTTP API + shared schema — not shared runtime code.

**Why not a single Next.js app with parsing in a serverless function:** PDF parsing + OCR (Tesseract, layout libraries) need Python's ecosystem (`pdfplumber`, `PyMuPDF`, `pytesseract`) and can run long enough (large scanned PDFs) to exceed typical serverless function time limits. A separate long-running service avoids fighting the platform.

---

## 3. Repository Structure

```
examforge/
├── apps/
│   ├── web/                      # Next.js 15 (App Router), TypeScript
│   │   ├── src/
│   │   │   ├── app/               # routes: (student)/, (admin)/, api/
│   │   │   ├── features/          # feature-first: exams/, questions/, attempts/, auth/
│   │   │   ├── components/        # shared UI primitives
│   │   │   ├── lib/                # auth client, api client, utils
│   │   │   └── server/             # server-only: services, repositories
│   │   └── package.json
│   │
│   └── doc-processor/             # Python FastAPI service
│       ├── app/
│       │   ├── parsers/
│       │   │   ├── base.py         # ExamParser interface (ABC)
│       │   │   └── jee_main/       # JEE Main parser module
│       │   ├── pipeline/           # orchestration: detect → extract → OCR → parse → validate
│       │   ├── ocr/
│       │   └── api/                # FastAPI routes
│       └── pyproject.toml
│
├── packages/
│   ├── db/                        # Prisma schema (source of truth), migrations
│   └── shared-types/               # types shared between web and processor contract (OpenAPI-generated)
│
├── docs/                          # this documentation set
└── README.md
```

**Rule enforced by this structure:** `apps/web` never talks to Postgres directly for anything the processor owns, and the processor never imports Next.js code. The only integration point is the HTTP API defined in `packages/shared-types` (generated from the FastAPI OpenAPI spec), so the two runtimes can't silently drift.

---

## 4. Hosting & Infrastructure (v0, ₹0 budget)

| Component                   | Choice                                                                     | Why                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend + API (`apps/web`) | Vercel (free tier)                                                         | Native Next.js support, generous free tier, zero config                                                                                      |
| Doc processor               | Railway (free tier) or Render (free tier)                                  | Supports long-running Python processes and persistent-ish disk for temp OCR files; Vercel functions are the wrong shape for this             |
| Database                    | Supabase Postgres (free tier)                                              | Postgres (not a proprietary DB) — portable, matches "minimal vendor lock-in" principle. We use **only** the Postgres part, not Supabase Auth |
| File storage                | Supabase Storage (free tier)                                               | S3-compatible, portable; PDFs and any future images live here, not in the DB                                                                 |
| Secrets                     | Platform env vars (Vercel/Railway dashboards) + local `.env` (git-ignored) | No paid secrets manager needed at this scale                                                                                                 |

**Portability note:** every choice above is a commodity (Postgres, S3-compatible storage, containerizable Python service). If we ever need to leave any single vendor, the migration is "point a connection string elsewhere," not a rewrite. This directly satisfies your "minimal vendor lock-in" principle.

---

## 5. Authentication

### 5.1 Production-Readiness Validation: Better Auth vs. Auth.js

You asked for this to be validated, not assumed. Current findings (mid-2026):

| Criterion                 | Better Auth                                                                                                                          | Auth.js                                                                                                                                                                 | Verdict                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Security**              | Modern primitives, database-backed sessions with immediate revocation; no outstanding red flags found                                | Mature, widely audited by virtue of age; JWT-strategy sessions can't be revoked before expiry without you building a denylist                                           | Even — different tradeoffs, not a Better Auth weakness                                               |
| **Stability**             | v1.0 (late 2024) → v1.6 (May 2026); stable major-version line for over a year                                                        | v5 spent ~2.5 years in beta before the Sep 2025 merger; now frozen there                                                                                                | **Better Auth** — Auth.js v5 is stable but permanently beta-labeled and frozen                       |
| **Community adoption**    | 28,000+ GitHub stars, YC-backed, default recommendation in production SaaS starter kits (MakerKit's Drizzle and Prisma kits ship it) | Historically the largest JS auth library; huge install base from years of prior use                                                                                     | Even — Auth.js has more legacy deployments, Better Auth has current momentum                         |
| **Maintenance activity**  | Actively developed, gaining features in 2026                                                                                         | **In maintenance mode since September 2025** — the original maintainer left in Jan 2025, and the project is now security-patches-only under the Better Auth team itself | **Better Auth**, decisively — the Auth.js team's own guidance for new projects points to Better Auth |
| **Documentation quality** | Current, dedicated guides for Next.js/Prisma/Postgres with working examples                                                          | Extensive due to age, but new-feature docs have stopped                                                                                                                 | **Better Auth** for a greenfield project                                                             |
| **PostgreSQL support**    | Native, via a direct Postgres connection (works on Supabase Postgres without using Supabase Auth)                                    | Native, via adapters                                                                                                                                                    | Even                                                                                                 |
| **Prisma compatibility**  | Official adapter, co-maintained integration guide with Prisma                                                                        | Official adapter                                                                                                                                                        | Even                                                                                                 |
| **Session management**    | Database-backed by default — sessions live in _our_ Postgres, immediate invalidation                                                 | Supports both database and JWT strategies                                                                                                                               | **Better Auth** for our use case — we want revocable sessions, not edge-JWT tradeoffs                |
| **RBAC support**          | Built-in as a first-class plugin                                                                                                     | **Not built in** — requires custom code or an extra library                                                                                                             | **Better Auth**, directly matches our Admin/Student requirement                                      |
| **Extensibility**         | Plugin architecture by design (2FA, passkeys, orgs, RBAC all ship as plugins)                                                        | Extensible via callbacks/adapters, but less structured                                                                                                                  | **Better Auth**                                                                                      |
| **Long-term viability**   | The team that _also_ now maintains Auth.js — i.e., betting on Better Auth is betting on whoever ends up steering both projects       | Frozen; new capabilities will not arrive                                                                                                                                | **Better Auth**                                                                                      |

**One honest gap:** Better Auth's default rate limiter uses an in-memory store that resets on redeploy — fine for v0's validation-scale traffic, but flagged in §9 (Rate Limiting) as something to configure properly (Postgres- or Redis-backed) before any real scale-up. Enterprise SSO (SAML/SCIM) is also still maturing in Better Auth, but that's irrelevant — v0 has no enterprise-SSO requirement.

**Conclusion: no significant production-readiness concerns. Better Auth is confirmed as the authentication library**, not merely tentative. Recommending Auth.js instead would mean building a new production app today on a library its own maintainers are steering people away from.

### 5.2 Authentication Architecture

**Strategy:** email/password, database-backed sessions, RBAC via Better Auth's role plugin. Designed so the _rest of the app_ only depends on a small internal `AuthService` interface — not on Better Auth's API directly — so a future swap stays contained.

```
apps/web/src/features/auth/
├── auth.config.ts        # Better Auth instance: providers, session, plugins
├── auth-service.ts        # Thin internal interface: getSession(), requireRole(), etc.
│                            # Rest of the app imports THIS, never Better Auth directly
├── rbac.ts                 # Role definitions: ADMIN, STUDENT + permission checks
└── audit.ts                 # Auth event logging (login, logout, failed attempt, password change)
```

**Why the `AuthService` indirection matters:** every route, server action, and component that needs "who is this user / are they allowed to do X" calls `authService.getSession()` or `authService.requireRole('ADMIN')`. If Better Auth is ever replaced, only `auth.config.ts` and `auth-service.ts` change — no feature code does. This satisfies your "modular, replaceable" requirement directly.

| Requirement                 | Implementation                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email/password auth         | Better Auth's built-in email/password provider                                                                                                                                                 |
| Password hashing            | Better Auth's default (scrypt) — no custom crypto                                                                                                                                              |
| Session-based auth          | Database-backed sessions in our Postgres `session` table; short-lived session cookie, server-side revocation supported                                                                         |
| RBAC (Admin/Student)        | Better Auth `admin`/roles plugin; role stored on `User`, checked in `AuthService.requireRole()` and enforced again at the API/query layer (never trust the client)                             |
| CSRF protection             | Better Auth's built-in CSRF token validation on state-changing requests, plus `SameSite=Lax` cookies as defense-in-depth                                                                       |
| Secure cookies              | `HttpOnly`, `Secure` (prod), `SameSite=Lax`; short session lifetime with sliding expiration                                                                                                    |
| Session expiration          | Default 7-day sliding window in dev config; configurable per environment                                                                                                                       |
| Remember-me (future)        | Deferred — extends session lifetime via a plugin option, no architecture change needed                                                                                                         |
| Password reset (future)     | Deferred — Better Auth ships this as a built-in flow; needs transactional email (currently out of scope, ₹0 budget — revisit with a free-tier email provider)                                  |
| Email verification (future) | Same as above — built into Better Auth, blocked only on email delivery, not architecture                                                                                                       |
| Audit logging               | Every login success/failure, logout, and role check failure is written to an `AuthAuditLog` table (see §6.5) — never logs passwords, tokens, or secrets, per the master prompt's logging rules |

---

## 6. Data Model (v0)

### 6.1 Design Principles

- **Published exams are immutable.** Editing a published exam creates a new `ExamVersion`; the old version is never mutated.
- **Attempts are pinned to a version.** A `StudentAttempt` always references the exact `ExamVersion` id it was taken against, so a later admin edit can never retroactively change a past attempt's questions or scoring.
- **Parser output is structured, not exam-specific.** Every parser (JEE Main today, NEET/CUET/CBSE later) must emit the same JSON shape, so downstream tables and the review UI don't care which parser produced the data.

### 6.2 Core Entities (simplified)

```
User (id, email, passwordHash*, role[ADMIN|STUDENT], createdAt)
  * managed by Better Auth, not hand-rolled

Exam (id, ownerId → User, title, examFormat[JEE_MAIN], status[DRAFT|PUBLISHED|ARCHIVED],
      currentVersionId → ExamVersion)

ExamVersion (id, examId → Exam, versionNumber, durationMinutes, markingScheme JSON,
             instructions, publishedAt, isImmutable BOOLEAN DEFAULT true)

Question (id, examVersionId → ExamVersion, orderIndex, text, questionType[MCQ],
          sourceConfidence FLOAT)   -- parser's confidence score, null if manually entered

Option (id, questionId → Question, label, text, isCorrect BOOLEAN)

StudentAttempt (id, studentId → User, examVersionId → ExamVersion, startedAt, submittedAt,
                status[IN_PROGRESS|SUBMITTED|AUTO_SUBMITTED], score, accuracy)

AttemptResponse (id, attemptId → StudentAttempt, questionId → Question,
                 selectedOptionId → Option NULLABLE, markedForReview BOOLEAN, answeredAt)

ParseJob (id, examId → Exam, parserUsed[JEE_MAIN], status[PENDING|SUCCESS|FAILED|NEEDS_REVIEW],
          rawOutput JSON, errorLog TEXT, createdAt)

AuthAuditLog (id, userId NULLABLE, eventType[LOGIN_SUCCESS|LOGIN_FAILURE|LOGOUT|ROLE_DENIED],
              ipAddress, userAgent, createdAt)
```

**Versioning flow, concretely:** Admin publishes → `ExamVersion v1` created, `isImmutable=true`. Students attempt against `v1`. Admin later edits a question → system creates `ExamVersion v2` (copy-on-write from v1 + the edit), `Exam.currentVersionId` moves to v2, `v1` is untouched. All existing `StudentAttempt` rows still point at `v1` and will always score against `v1`'s questions/answers, even if `v2` fixes an error. New attempts start against `v2`.

### 6.3 Why Prisma

Type-safe queries matching our TypeScript-first stack, first-class Postgres support, official Better Auth adapter, and mature migration tooling — no evaluation needed here, this is a low-risk, high-consensus choice at this scale.

---

## 7. Document Processing Pipeline & Parser Architecture

### 7.1 Layered Pipeline (per your decision — no cloud/paid AI in v0)

```
Digital PDF (question paper + answer key)
        │
        ▼
Is it a digital PDF or scanned image?
        │
   ┌────┴────┐
   ▼         ▼
Digital    Scanned
   │         │
   │         ▼
   │       OCR (Tesseract, local/free)
   │         │
   └────┬────┘
        ▼
  Rule-Based Parser (format-specific, e.g. JEEMainParser)
        │
        ▼
   Successful? (confidence threshold met, structure validates)
        │
   ┌────┴────┐
  YES        NO
   │           │
   ▼           ▼
Generate    Manual Review & Correction (admin UI)
  Test           │
   │              ▼
   └────────► Publish
```

**Explicitly designed for a future local-LLM fallback slot** (Ollama or similar), inserted _between_ "Rule-Based Parser" and "Manual Review" without touching the frontend, database, or the parser interface below — because that fallback would just be another implementation of the same `ExamParser` contract, invoked when the rule-based parser's confidence is below threshold.

### 7.2 Parser Plugin Interface

```python
# apps/doc-processor/app/parsers/base.py
from abc import ABC, abstractmethod

class ExamParser(ABC):
    """Every exam-format parser (JEE Main, NEET, CUET, CBSE, ...) implements this.
    Adding a new format = new module implementing this interface.
    Existing parsers are never modified to support a new format."""

    @abstractmethod
    def detect(self, raw_text: str) -> bool:
        """Cheap check: does this look like this parser's format?"""

    @abstractmethod
    def parse(self, raw_text: str) -> ParsedExam:
        """Returns the shared structured output — same shape for every parser."""

    @abstractmethod
    def confidence(self, parsed: ParsedExam) -> float:
        """0.0–1.0. Below the configured threshold → routed to manual review."""
```

```python
# Shared output contract every parser must produce
class ParsedExam(BaseModel):
    questions: list[ParsedQuestion]
    parser_name: str
    warnings: list[str]

class ParsedQuestion(BaseModel):
    order_index: int
    text: str
    options: list[ParsedOption]
    correct_option_label: str | None   # None if answer key didn't resolve — forces review
    confidence: float
```

v0 ships exactly one implementation: `apps/doc-processor/app/parsers/jee_main/`. NEET/CUET/CBSE are new sibling folders later, each implementing `ExamParser`, registered in a small parser registry — no changes to the pipeline, API routes, database schema, or frontend review UI, because they all consume `ParsedExam`.

---

## 8. State Management (Exam-Taking Session)

Given "minimal dependencies" and "₹0 budget," we deliberately avoid adding Redis for v0:

| Concern                                                                           | Approach                                                                                                                                                                                                    | Why                                                                                 |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| In-progress attempt state (selected answers, marked-for-review, current question) | Written incrementally to `AttemptResponse` rows in Postgres on every "Save & Next"                                                                                                                          | Postgres is already provisioned; avoids a second stateful dependency for v0's scale |
| Client-side responsiveness during the exam                                        | Local React state + optimistic UI, synced to server on each navigation action (see §9)                                                                                                                      | Feels instant to the student; server remains source of truth                        |
| Timer                                                                             | Server-authoritative `startedAt` + `durationMinutes` from `ExamVersion`; client renders a countdown from these, but **auto-submit is enforced server-side** on submit/poll, not trusted to the client clock | Prevents a student from manipulating their local clock to gain time                 |

**Explicit non-decision for now:** if concurrent load ever makes per-keystroke Postgres writes a bottleneck, Redis becomes justified — but introducing it in v0 to solve a problem we don't have yet would violate the "avoid unnecessary technical debt" and "minimal dependencies" principles.

---

## 9. Attempt Resilience (Autosave & Recovery)

Real exam conditions must survive a refresh, tab close, or flaky connection without losing a student's answers.

| Failure mode                                                      | Mitigation                                                                                                                                                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser refresh / accidental close mid-exam                       | Every answer/navigation action is persisted to `AttemptResponse` server-side immediately (not just on final submit); reopening the exam resumes from server state                                          |
| Brief network drop                                                | Client queues the last action in memory and retries with backoff; UI shows a non-alarming "syncing" indicator rather than failing silently                                                                 |
| Timer expiry while tab is closed                                  | Server-side auto-submit job checks `startedAt + durationMinutes` independent of any client being connected — a closed tab still gets auto-submitted and scored                                             |
| Duplicate/out-of-order writes (e.g., retry after a slow response) | Each `AttemptResponse` write is an upsert keyed on `(attemptId, questionId)` — last-write-wins is safe here since only the student can write their own attempt, and only one browser tab is expected in v0 |

This is intentionally simpler than a full offline-first/conflict-resolution system — appropriate for v0's validation scale, and easy to harden later without a schema change.

---

## 10. Security Architecture

Security is designed in from the start, per your explicit requirement, not bolted on.

| Area                     | v0 Implementation                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AuthN/AuthZ**          | Better Auth + `AuthService` indirection (§5.2); every server action/API route re-checks role server-side, never trusts client-sent role claims                                                                                                                     |
| **RBAC**                 | Two roles (`ADMIN`, `STUDENT`) enforced at the query/service layer, not just UI hiding                                                                                                                                                                             |
| **File upload handling** | Accept only `application/pdf` (MIME **and** file-signature/magic-byte check, not extension alone); size limit (e.g., 20MB); stored in Supabase Storage under a random, non-guessable key — never the original filename; never served from a public/executable path |
| **Input validation**     | All API boundaries validated with Zod (web) / Pydantic (processor) schemas — forms, query params, JSON bodies, uploaded file metadata                                                                                                                              |
| **SQL injection**        | Prisma parameterized queries exclusively; no raw string-interpolated SQL                                                                                                                                                                                           |
| **XSS**                  | React's default escaping; question/option text rendered as text, not `dangerouslySetInnerHTML`; Content-Security-Policy header set                                                                                                                                 |
| **CSRF**                 | Better Auth CSRF tokens on state-changing requests + `SameSite=Lax` cookies                                                                                                                                                                                        |
| **Rate limiting**        | Configurable per environment: relaxed in dev, enforced in prod on login, upload, and API routes; Better Auth's default in-memory limiter is fine for v0 traffic, but noted as a pre-scale upgrade item (§5.1)                                                      |
| **Secrets management**   | Environment variables only, `.env.example` maintained, `.env` git-ignored, platform dashboards (Vercel/Railway) for prod secrets — no paid secrets manager needed at this scale                                                                                    |
| **Audit logging**        | `AuthAuditLog` table (§6.2) for auth events; never logs passwords, tokens, or session secrets                                                                                                                                                                      |
| **Backup/recovery**      | Supabase's automatic daily Postgres backups (free tier) as the v0 baseline; documented as a P1 item to formalize (retention policy, restore test) once real user data exists                                                                                       |
| **Dependency security**  | `npm audit` / `pip-audit` run before each dependency addition and periodically; prefer well-maintained, popular packages per the master prompt's dependency-evaluation rule                                                                                        |
| **Security headers**     | CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or CSP `frame-ancestors`), `Referrer-Policy` — set via Next.js middleware                                                                                                                         |
| **Error handling**       | Centralized error boundary; generic messages to the client, full detail only in server logs; no stack traces leaked to users                                                                                                                                       |
| **Logging**              | Structured server logs; explicit denylist enforced in the logging utility itself (passwords, tokens, secrets, full session cookies never logged)                                                                                                                   |
| **Password hashing**     | Better Auth default (scrypt) — not hand-rolled                                                                                                                                                                                                                     |
| **Session security**     | `HttpOnly`, `Secure` (prod), `SameSite=Lax` cookies; database-backed sessions with server-side revocation                                                                                                                                                          |

---

## 11. Architecture Decision Record (ADR) Log

| #       | Decision                                                                                                  | Alternatives considered                            | Rationale                                                                                                                                                                                                                                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-001 | Monorepo, Next.js + Python service, deployed together initially                                           | Fully separate repos/services from day one         | Solo dev bandwidth; shared `packages/db` keeps schema in sync; can split later without a rewrite since the only contract is HTTP                                                                                                                                                                                                   |
| ADR-002 | v0 targets JEE Main only, via a pluggable parser interface                                                | Build for 4 formats in parallel                    | Narrow scope proves the pipeline before multiplying parsing work; new formats are additive, not modifying existing code                                                                                                                                                                                                            |
| ADR-003 | Authentication: **Better Auth**                                                                           | Auth.js, Clerk                                     | Auth.js is in maintenance mode since Sep 2025 (own maintainers now steer new projects to Better Auth); Clerk means hosted data + vendor lock-in against explicit "own your data" principle; Better Auth gives built-in RBAC, database-backed revocable sessions, self-hosted on our own Postgres, MIT-licensed, actively developed |
| ADR-004 | Layered document-processing pipeline with an explicit (unbuilt) local-LLM fallback slot, no cloud/paid AI | Cloud AI (OpenAI/Gemini/etc.) as primary extractor | ₹0 budget constraint is non-negotiable; rule-based parser + mandatory manual-review fallback is reliable now; local-LLM slot designed in without committing to build it yet                                                                                                                                                        |
| ADR-005 | Published exams are immutable; edits create new `ExamVersion` rows; attempts pin to a version             | Mutate exam/questions in place                     | Guarantees a student's scored attempt can never be silently altered by a later admin correction — data integrity requirement from the PRD                                                                                                                                                                                          |
| ADR-006 | No Redis in v0; exam-attempt state persisted directly to Postgres                                         | Redis-backed session/state store                   | Avoids an unjustified second stateful dependency at validation scale; can be introduced later if load demands it                                                                                                                                                                                                                   |
| ADR-007 | Database: Supabase **Postgres only** (not Supabase Auth)                                                  | Supabase Auth, self-hosted Postgres elsewhere      | Postgres is portable and free-tier available; avoiding Supabase Auth keeps auth vendor-neutral per Better Auth's own design (data lives in our schema regardless of host)                                                                                                                                                          |

---

## 12. Open Items Carried Forward

- Specific rate-limit store upgrade (Postgres- or Redis-backed) before any real scale-up beyond validation traffic — noted in §5.1 and §10, not a v0 blocker.
- Transactional email provider selection, needed before password-reset/email-verification (both explicitly deferred, future work).
- Exact JEE Main sample PDFs to build/test the parser against — needed before `04-Document-Processing.md` gets specific about extraction rules.
- Backup retention/restore-test policy — flagged as a P1 hardening item, not a v0 blocker.

---

_This document is complete pending your review. Once approved, we move to `03-UI-UX.md`._
