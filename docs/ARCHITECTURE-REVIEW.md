# ExamForge Architecture Review

**Date:** 2025-07-14  
**Documents Reviewed:** 01-PRD.md, 02-TRD.md, 03-UI-UX.md, 04-Document-Processing.md, 05-Database-API.md  
**Status:** Complete Review — Ready for Implementation Approval

---

## 1. Executive Summary

ExamForge is a well-scoped, well-architected project for a solo developer building a JEE Main CBT platform with ₹0 budget constraints. The five documents form a coherent chain from PRD → TRD → UI/UX → Document Processing → Database/API, each layer tracing back to the previous one. The architecture demonstrates strong engineering discipline: modular parser plugins, versioned immutable exams, token-driven theming, security-by-default, and explicit non-goals that prevent scope creep.

**Overall Assessment: READY FOR IMPLEMENTATION** — with the clarifications and risk mitigations documented below.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXAMFORGE MONOREPO (v0)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        apps/web (Next.js 15)                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │  (admin)    │  │  (student)  │  │   (auth)    │  │   (api)     │    │   │
│  │  │  Dashboard  │  │  Dashboard  │  │ Better Auth │  │  REST v1    │    │   │
│  │  │  Upload     │  │  CBT Exam   │  │  RBAC       │  │  Prisma ORM │    │   │
│  │  │  Review     │  │  Results    │  │  Sessions   │  │  Zod Val.   │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │ HTTP (internal)                            │
│  ┌────────────────────────────────┴────────────────────────────────────────┐   │
│  │                     apps/doc-processor (FastAPI)                        │   │
│  │  ┌────────────┐ ┌────────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │  Pipeline  │ │  Parsers   │ │   OCR   │ │  Schema  │ │   API      │  │   │
│  │  │ Orchestr.  │ │  (plugin)  │ │ Tesseract│ │ Pydantic │ │  Routes    │  │   │
│  │  └────────────┘ └────────────┘ └─────────┘ └──────────┘ └────────────┘  │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                            │
│  ┌────────────────────────────────┴────────────────────────────────────────┐   │
│  │                        packages/db (Prisma)                             │   │
│  │  Schema → Migrations → Generated Types (shared by web + doc-processor)  │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                            │
│                                   ▼                                            │
│                    ┌─────────────────────────────┐                            │
│                    │   Supabase (PostgreSQL)     │                            │
│                    │   + Supabase Storage        │                            │
│                    └─────────────────────────────┘                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions (Locked)

| ADR     | Decision                                                               | Rationale                                                                                                |
| ------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ADR-001 | Monorepo, deployed together initially                                  | Solo dev bandwidth; shared `packages/db` keeps schema in sync                                            |
| ADR-002 | JEE Main only, pluggable parser interface                              | Narrow scope proves pipeline; new formats are additive                                                   |
| ADR-003 | **Better Auth** (not Auth.js or Clerk)                                 | Auth.js in maintenance mode; Clerk = vendor lock-in; Better Auth = self-hosted, RBAC, DB-backed sessions |
| ADR-004 | Rule-based parser + manual review fallback; local-LLM slot designed in | ₹0 budget non-negotiable; reliability > automation                                                       |
| ADR-005 | Immutable `ExamVersion` snapshots; attempts pinned to version          | Data integrity — past attempts never retroactively altered                                               |
| ADR-006 | No Redis in v0; exam state in Postgres                                 | Avoids unjustified dependency at validation scale                                                        |
| ADR-007 | Supabase Postgres only (not Supabase Auth)                             | Portable Postgres; auth vendor-neutral via Better Auth                                                   |

---

## 3. Cross-Document Consistency Analysis

### ✅ Strong Consistency Areas

| Area                 | PRD                         | TRD                        | UI/UX                           | Doc Processing            | DB/API                                   | Status     |
| -------------------- | --------------------------- | -------------------------- | ------------------------------- | ------------------------- | ---------------------------------------- | ---------- |
| **Scope**            | JEE Main, MCQ only          | JEE Main parser only       | JEE Main screens                | JEE Main layouts A-F      | `examType: JEE_MAIN` enum                | ✅ Aligned |
| **Auth**             | Admin + Student             | Better Auth, RBAC          | Role-based nav                  | N/A                       | ADMIN/REVIEWER/STUDENT roles             | ✅ Aligned |
| **Parser Interface** | Pluggable interface         | `ExamParser` ABC           | Review screen agnostic          | `detect/parse/confidence` | N/A (service boundary)                   | ✅ Aligned |
| **Versioning**       | "Published exams immutable" | `ExamVersion.snapshotJson` | Publish screen                  | Immutable JSON output     | `ExamVersion` immutable, attempts pinned | ✅ Aligned |
| **Exam State**       | Timer, palette, auto-submit | Server-authoritative timer | CBT spec with timer             | N/A                       | `Attempt.expiresAt`, auto-submit job     | ✅ Aligned |
| **Offline/Recovery** | "Recoverable by default"    | Postgres upsert per answer | Full offline flow §13           | N/A                       | `AttemptResponse` upsert                 | ✅ Aligned |
| **Security**         | "Security by default"       | Enumerated controls §10    | CSP, no dangerouslySetInnerHTML | PDF validation §14        | RBAC, signed URLs, audit log             | ✅ Aligned |
| **Budget**           | ₹0                          | Free tiers only            | No paid deps                    | Tesseract/Opencv/PyMuPDF  | No Redis, no paid APIs                   | ✅ Aligned |

### ⚠️ Minor Inconsistencies / Gaps

| #   | Issue                                                                                                                                                | Location                             | Severity | Recommendation                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------- |
| 1   | **Role naming**: TRD has `ADMIN`/`STUDENT`; DB/API adds `REVIEWER`                                                                                   | TRD §5.2 vs DB/API §3.2, §7.2        | Low      | Document `REVIEWER` as explicit role in TRD (it exists in UI/UX implicitly via Review Queue access)      |
| 2   | **Upload Wizard steps**: UI/UX says 3 steps; Doc Processing implies 2 files (question + answer key)                                                  | UI/UX §7.3 vs Doc Processing §1.3    | Low      | Clarify: Step 1 = two drop zones (question paper + answer key), not sequential                           |
| 3   | **OCR library**: Doc Processing says `pytesseract`; TRD says `Tesseract`                                                                             | Doc Processing §7.2 vs TRD §7        | Low      | Align terminology — `pytesseract` is the Python wrapper for Tesseract                                    |
| 4   | **Answer key matching**: UI/UX review screen shows "correct-answer selector"; Doc Processing says answer key matching auto-populates `correctOption` | UI/UX §7.4 vs Doc Processing §6.2    | Medium   | Clarify: auto-matched answers are pre-filled but reviewer must confirm; unmatched = null → forced review |
| 5   | **Settings table**: DB/API has `Settings` model; TRD doesn't mention it                                                                              | DB/API §3.14 vs TRD                  | Low      | Add to TRD as configurable thresholds (confidence, timeouts)                                             |
| 6   | **Notification table**: DB/API reserves `Notification` model; not in other docs                                                                      | DB/API §3.16                         | Low      | Mark explicitly as "future, not v0" in all docs                                                          |
| 7   | **Parser callback auth**: DB/API §6.5 mentions service-to-service key; Doc Processing doesn't specify callback                                       | DB/API §6.5, §14.9 vs Doc Processing | Medium   | Document the callback contract in Doc Processing §3.2 (stage: Database)                                  |

---

## 4. Risk Assessment

### 🔴 Critical Risks (Must Mitigate Before Implementation)

| Risk                                 | Impact                                                                                             | Likelihood | Mitigation                                                                                                                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1: JEE Main PDF layout variance** | Parser accuracy < 85% → excessive manual review → misses PRD success criteria (≤10-15% correction) | High       | **Before Phase 6:** Obtain 5+ real JEE Main PDFs across years/shifts. Build golden-file test suite (Doc Processing §15). If accuracy < 85% on samples, adjust scope or invest more in layout heuristics. |
| **R2: OCR accuracy on scanned PDFs** | Scanned papers may have 30-50% OCR error rate → most questions flagged → manual review bottleneck  | Medium     | Document Processing §7.4: page-level OCR confidence gate → whole page to manual review. Set realistic expectations: scanned = manual review path.                                                        |
| **R3: Solo dev bandwidth vs. scope** | 10 phases, each non-trivial. Risk of incomplete v0.                                                | High       | **Enforce phase gates.** No phase starts until previous is "done" (tested, reviewed). Use the roadmap in §6 as a commitment device.                                                                      |
| **R4: Better Auth maturity**         | If Better Auth has breaking changes or bugs, auth rewrite needed                                   | Low-Medium | Better Auth v1.x stable since late 2024. Pin version. Abstract behind `AuthService` (TRD §5.2) — already designed for swap.                                                                              |
| **R5: Supabase free tier limits**    | DB size (500MB), bandwidth, concurrent connections may hit limits during validation                | Low        | Monitor in Phase 10. Have migration path to self-hosted Postgres documented (TRD §16).                                                                                                                   |

### 🟡 High Risks (Address in Implementation)

| Risk                                                         | Impact                                                     | Mitigation                                                                                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **R6: Parser confidence thresholds uncalibrated**            | Too high = everything manual; too low = bad data published | Doc Processing §8.2: thresholds are config, not code. Calibrate during Phase 6 with real PDFs.                                     |
| **R7: Timer drift / auto-submit race conditions**            | Student loses time or gets double-submitted                | TRD §8: server-authoritative `expiresAt`; auto-submit job is idempotent; submit is idempotency-keyed (DB/API §5.8, §9.4).          |
| **R8: File upload DoS (large PDFs, many uploads)**           | Resource exhaustion on free tier                           | Doc Processing §14: magic bytes, 25MB limit, page count cap (60), per-page timeouts, concurrency limits.                           |
| **R9: Exam version race (publish while student attempting)** | Student gets wrong version or broken state                 | DB/API §8.5: `Attempt.examVersionId` locked at creation; `Exam.currentVersionId` updated atomically in publish transaction (§9.2). |
| **R10: Supabase Storage signed URL expiry during long exam** | Images fail to load mid-exam                               | Use long-enough TTL (e.g., 4 hours) for exam assets; or generate per-attempt signed URLs at start.                                 |

### 🟢 Medium/Low Risks (Monitor)

| Risk                                                              | Mitigation                                                                         |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **R11: Math rendering (KaTeX) failures**                          | UI/UX §3.2: fallback to raw text; QuestionCard has error boundary.                 |
| **R12: Mobile exam-taking (explicitly tolerated, not supported)** | UI/UX §14: blocking notice with "Continue anyway" — accept UX compromise.          |
| **R13: No email/password reset in v0**                            | PRD §5: explicitly deferred. Admin creates student accounts manually.              |
| **R14: Backup/restore untested**                                  | DB/API §10: Supabase auto-backups; document restore test as P1 post-validation.    |
| **R15: Concurrent parser jobs on free tier**                      | Doc Processing §13.4: stateless, horizontally scalable. Add queue later if needed. |

---

## 5. Improvement Suggestions

### 5.1 Architecture Improvements

| #      | Suggestion                                                              | Effort | Value                                                                                                                                                        |
| ------ | ----------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A1** | **Add a `ParserJob` webhook/callback spec to Doc Processing**           | Low    | Eliminates polling from Next.js; cleaner separation. Document in Doc Processing §3.2 "Database" stage.                                                       |
| **A2** | **Extract `AuthService` interface to `packages/shared-types`**          | Low    | Makes the Better Auth indirection (TRD §5.2) enforceable at type level across web + future services.                                                         |
| **A3** | **Define `ParsedExam` JSON schema as a shared OpenAPI/TypeScript type** | Medium | Currently duplicated: Doc Processing §10 (Pydantic), DB/API expects it in `ParserJob.resultJson` (Jsonb). Single source → generated types for both runtimes. |
| **A4** | **Add correlation IDs across Next.js ↔ FastAPI boundary**              | Low    | Doc Processing §12.2 and DB/API §12.3 both mention `requestId`/`parserJobId` — standardize as `X-Request-ID` header propagated through all service calls.    |
| **A5** | **Make `ExamVersion.snapshotJson` versioned with migration utilities**  | Medium | DB/API §15.4 mentions `schemaVersion` in parser output — ensure `ExamVersion` stores it and read path handles multiple versions.                             |

### 5.2 Developer Experience Improvements

| #      | Suggestion                                                                         | Effort | Value                                                                            |
| ------ | ---------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| **D1** | **Add `packages/shared-types` with generated types from Prisma + FastAPI OpenAPI** | Medium | Eliminates type drift between web and processor; enables end-to-end type safety. |
| **D2** | **Set up Storybook for UI components (per UI/UX §20 rule #8)**                     | Medium | Enforces component documentation contract; catches token violations early.       |
| **D3** | **Add ESLint rule: "no hardcoded colors/spacing/durations"**                       | Low    | Enforces UI/UX §20 rule #1 at lint time.                                         |
| **D4** | **Create a `make dev` target that starts Next.js + FastAPI + Prisma Studio**       | Low    | Reduces context switching; single command for full stack.                        |
| **D5** | **Add golden-file test runner for parser (Doc Processing §15.2) as a CLI command** | Low    | `make test-parser` runs all golden files; CI gate.                               |

### 5.3 Operational Improvements

| #      | Suggestion                                                                        | Effort | Value                                                                         |
| ------ | --------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| **O1** | **Document runbook: "How to restore from Supabase backup"**                       | Low    | DB/API §10 flags this as P1 post-validation. Do it now while schema is fresh. |
| **O2** | **Add structured logging middleware to both services with shared correlation ID** | Low    | Enables cross-service debugging from day one.                                 |
| **O3** | **Define "Definition of Done" for each phase (test coverage, lint, docs)**        | Low    | Prevents "done but not really done" drift across 10 phases.                   |

---

## 6. Detailed Implementation Roadmap

### Phase Gates

Each phase must meet **Definition of Done** before the next begins:

- [ ] All code compiles, lints, type-checks
- [ ] Unit tests pass (≥80% coverage on new code)
- [ ] Integration tests for happy paths
- [ ] UI components documented in Storybook (per UI/UX §20)
- [ ] No hardcoded design tokens (UI/UX §20 rule #1)
- [ ] Security review checklist passed (TRD §10)
- [ ] Updated `CHANGELOG.md`

---

### Phase 1: Foundation & Monorepo Setup (Week 1)

**Goal:** Runnable monorepo with shared types, auth, and database.

| Task | Details                                                                                                 | Owner |
| ---- | ------------------------------------------------------------------------------------------------------- | ----- |
| 1.1  | Initialize Turborepo monorepo: `apps/web`, `apps/doc-processor`, `packages/db`, `packages/shared-types` | Dev   |
| 1.2  | Configure TypeScript, ESLint, Prettier, Husky pre-commit hooks                                          | Dev   |
| 1.3  | Set up Prisma schema (DB/API §3) in `packages/db`; run initial migration to Supabase                    | Dev   |
| 1.4  | Configure Better Auth in `apps/web` (TRD §5.2): email/password, DB sessions, RBAC plugin                | Dev   |
| 1.5  | Build `AuthService` abstraction (TRD §5.2): `getSession()`, `requireRole()`, `getUser()`                | Dev   |
| 1.6  | Create `packages/shared-types`: export Prisma-generated types + Zod schemas for API contracts           | Dev   |
| 1.7  | Set up FastAPI project in `apps/doc-processor` with basic health endpoint                               | Dev   |
| 1.8  | Configure CI: lint, typecheck, test, build for both apps                                                | Dev   |
| 1.9  | Deploy `apps/web` to Vercel (preview), `apps/doc-processor` to Railway/Render (free tier)               | Dev   |
| 1.10 | Verify end-to-end: login → session → DB read/write                                                      | Dev   |

**Deliverable:** Working monorepo, auth flow, deployed preview environments.

---

### Phase 2: Admin Foundation & File Upload (Week 2)

**Goal:** Admin can upload PDFs; files stored in Supabase Storage; metadata in DB.

| Task | Details                                                                                             | Owner |
| ---- | --------------------------------------------------------------------------------------------------- | ----- |
| 2.1  | Build Admin layout: left rail, header, responsive (UI/UX §5, §7.2)                                  | Dev   |
| 2.2  | Implement `/admin` dashboard: exam list table, empty state, "New Exam" CTA                          | Dev   |
| 2.3  | Build Upload Wizard (UI/UX §7.3): 3-step, two drop zones (question paper + answer key)              | Dev   |
| 2.4  | Client-side PDF validation: magic bytes (`%PDF-`), size limit (25MB)                                | Dev   |
| 2.5  | API: `POST /api/v1/uploads` → store in Supabase Storage, create `UploadedFile` rows (DB/API §6.4)   | Dev   |
| 2.6  | Trigger `ParserJob` creation (status `QUEUED`) on upload completion                                 | Dev   |
| 2.7  | Polling UI for parser job status (stages: Detecting → Extracting → Parsing → Ready)                 | Dev   |
| 2.8  | Service-to-service auth: generate shared secret for FastAPI → Next.js callback (DB/API §6.5, §14.9) | Dev   |

**Deliverable:** Admin uploads PDF → file stored → parser job queued → status polling works.

---

### Phase 3: Document Processing Pipeline Core (Weeks 3-4)

**Goal:** FastAPI service extracts text from PDFs (digital + OCR), classifies pages.

| Task | Details                                                                                                                                   | Owner |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 3.1  | Implement `ValidationStage` (Doc Processing §3.2, §2.3): magic bytes, page count, encryption check, question-like content heuristic       | Dev   |
| 3.2  | Implement `ClassificationStage` (Doc Processing §2.2): per-page digital vs scanned detection via text char count + font presence          | Dev   |
| 3.3  | Implement `OCRStage` (Doc Processing §7): PyMuPDF rasterize → OpenCV preprocess (deskew, denoise, binarize) → Tesseract via `pytesseract` | Dev   |
| 3.4  | Implement `PipelineOrchestrator` (Doc Processing §3.1, §4.4): stage sequencing, error handling, retries (Doc Processing §12.4)            | Dev   |
| 3.5  | Build `ParserJob` status API: `PATCH /api/v1/parser/jobs/:id` (DB/API §6.5) for FastAPI to report progress/result                         | Dev   |
| 3.6  | On `COMPLETED`: Next.js creates `ReviewQueue` row with `workingJson = resultJson` (DB/API §9.5)                                           | Dev   |
| 3.7  | Implement temp file cleanup (Doc Processing §14): per-job temp dir, guaranteed cleanup on success/failure                                 | Dev   |
| 3.8  | Add structured JSON logging with correlation IDs (Doc Processing §12.2, DB/API §12.3)                                                     | Dev   |
| 3.9  | Write unit tests for each stage with golden fixtures (Doc Processing §15)                                                                 | Dev   |

**Deliverable:** PDF → text extraction (digital + OCR) working end-to-end; job status reported to Next.js.

---

### Phase 4: JEE Main Parser Plugin (Weeks 5-6)

**Goal:** Rule-based extraction of questions, options, answer keys → `ParsedExam` JSON.

| Task | Details                                                                                                                           | Owner |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 4.1  | Implement `ExamParser` ABC (Doc Processing §4.1, TRD §7.2) in `apps/doc-processor/app/parsers/base.py`                            | Dev   |
| 4.2  | Build `JEEMainParser.detect()` (Doc Processing §4.3): layout fingerprinting for patterns A-F (§2.1)                               | Dev   |
| 4.3  | Implement `QuestionExtractor` (Doc Processing §5): numbering regex, statement extraction, option extraction, section detection    | Dev   |
| 4.4  | Implement `AnswerKeyExtractor` (Doc Processing §6): table form, grid form, section-wise, separate PDF                             | Dev   |
| 4.5  | Implement answer-key ↔ question matching (Doc Processing §6.2): global/display number mapping, orphan handling                   | Dev   |
| 4.6  | Implement image/table extraction (Doc Processing §5.5, §5.6): PyMuPDF image export → Supabase Storage upload → asset refs in JSON | Dev   |
| 4.7  | Implement `ConfidenceScorer` (Doc Processing §8): per-question factors (OCR, structure, answer match, validation)                 | Dev   |
| 4.8  | Implement `ValidationRules` engine (Doc Processing §11): all 10 rules with severity (error/warning)                               | Dev   |
| 4.9  | Build golden-file test suite (Doc Processing §15): 5+ real JEE Main PDFs covering layouts A-F, digital + scanned                  | Dev   |
| 4.10 | Calibrate confidence thresholds (Doc Processing §8.2) against golden files; document in `Settings`                                | Dev   |

**Deliverable:** JEE Main parser produces `ParsedExam` JSON with confidence scores and validation flags for all golden files.

---

### Phase 5: Admin Review Queue (Week 7)

**Goal:** Admin reviews parser output, edits questions, approves for publish.

| Task | Details                                                                                                              | Owner |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ----- |
| 5.1  | Build Review Queue list (UI/UX §7.4): confidence sort, filter chips, progress bar                                    | Dev   |
| 5.2  | Build Question Review Editor (UI/UX §7.4): stem (KaTeX), 4 options, correct selector, confidence dot, raw OCR toggle | Dev   |
| 5.3  | Inline editing with autosave (UI/UX §11): `PATCH /api/v1/review-queue/:id` updates `workingJson`                     | Dev   |
| 5.4  | "Mark Reviewed" checkbox per question (UI/UX §7.4); progress = reviewed/total                                        | Dev   |
| 5.5  | Validation re-run on edit (Doc Processing §9.3): server re-validates `workingJson` before approve                    | Dev   |
| 5.6  | Approve action (UI/UX §7.4, DB/API §9.5): transaction creates Exam + ExamVersion + Section/Question/Option rows      | Dev   |
| 5.7  | Reject action: marks `ReviewQueue.status = REJECTED`, no Exam created                                                | Dev   |
| 5.8  | "Add Question Manually" button (PRD §8.9, UI/UX §7.4): opens empty editor, appends to `workingJson`                  | Dev   |

**Deliverable:** Admin can review, edit, and approve a parsed paper → published ExamVersion in DB.

---

### Phase 6: Exam Configuration & Publish (Week 8)

**Goal:** Admin configures exam settings and publishes.

| Task | Details                                                                                                                    | Owner |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ----- |
| 6.1  | Build Configure screen (UI/UX §7.5): duration, marks per question, negative marking, instructions (rich text)              | Dev   |
| 6.2  | Store config in `ExamVersion` fields (duration, `markingScheme` JSON, instructions)                                        | Dev   |
| 6.3  | Build Publish screen (UI/UX §7.6): pre-publish checklist (all reviewed, answers resolved, duration set, ≥1 student)        | Dev   |
| 6.4  | Publish transaction (DB/API §9.2): validate → `ExamVersion.status = PUBLISHED` → `Exam.currentVersionId` update → AuditLog | Dev   |
| 6.5  | Student assignment: Admin → Students page (UI/UX §7.12): invite/create student accounts, assign to exam                    | Dev   |
| 6.6  | Unpublish/Archive actions (DB/API §6.8)                                                                                    | Dev   |

**Deliverable:** Fully configured, published exam visible to assigned students.

---

### Phase 7: Student Dashboard & Exam Instructions (Week 9)

**Goal:** Student sees assigned exams, reads instructions, starts attempt.

| Task | Details                                                                                                   | Owner |
| ---- | --------------------------------------------------------------------------------------------------------- | ----- |
| 7.1  | Student Dashboard (UI/UX §7.7): card grid with status (Not Started / Resume / View Result)                | Dev   |
| 7.2  | Instructions Page (UI/UX §7.8): admin instructions + system block (controls, marking scheme, declaration) | Dev   |
| 7.3  | Scroll-to-bottom + checkbox enable "Start Exam" (UI/UX §7.8)                                              | Dev   |
| 7.4  | Theme lock: student picks Light/Dark on instructions page; frozen for attempt (UI/UX §4)                  | Dev   |
| 7.5  | Start Attempt API (DB/API §6.9): `POST /exams/:examId/attempts` → creates `Attempt` with `expiresAt`      | Dev   |
| 7.6  | Single active attempt enforcement (DB/API §8.6): partial unique index, 409 with existing `attemptId`      | Dev   |
| 7.7  | Resume flow: `GET /attempts/:id` returns state + remaining time + question content (from `snapshotJson`)  | Dev   |

**Deliverable:** Student can start/resume a timed attempt with correct exam content.

---

### Phase 8: CBT Exam Engine (Weeks 10-11)

**Goal:** Full CBT interface with timer, palette, navigation, autosave, submit/auto-submit.

| Task | Details                                                                                                                                        | Owner |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 8.1  | CBT Layout (UI/UX §7.9): fixed header (timer + hamburger), question column (~70%), palette rail (~30%)                                         | Dev   |
| 8.2  | Timer component (UI/UX §3.8, §10): server-authoritative `expiresAt`, calm→urgent color swap at 10%, milestone SR announcements                 | Dev   |
| 8.3  | QuestionCard (UI/UX §18): KaTeX rendering, 4 radio options, error boundary fallback to raw text                                                | Dev   |
| 8.4  | Palette rail (UI/UX §7.9, §18): 40px fixed cells, 5 states (not visited, not answered, answered, marked, answered+marked), instant status swap | Dev   |
| 8.5  | Navigation: Previous / Save & Next / Mark for Review & Next / Clear Response (UI/UX §7.9, §17)                                                 | Dev   |
| 8.6  | Keyboard shortcuts (UI/UX §17): 1-4/A-D select, →/← nav, M mark, C clear, G jump, Ctrl+Enter submit                                            | Dev   |
| 8.7  | Autosave: `PATCH /attempts/:id/responses` on every action, debounced, optimistic UI, sync indicator (UI/UX §10, §13)                           | Dev   |
| 8.8  | Offline queue (UI/UX §13): in-memory FIFO, retry with backoff, "Saving…" indicator, submit disabled offline                                    | Dev   |
| 8.9  | Submit confirmation modal (UI/UX §7.10): unanswered count, marked count, two equal-weight buttons                                              | Dev   |
| 8.10 | Auto-submit job (DB/API §8.4): periodic sweep of `IN_PROGRESS` attempts past `expiresAt` → score + `AUTO_SUBMITTED`                            | Dev   |
| 8.11 | Scoring transaction (DB/API §9.4): idempotency-keyed, reads correct answers from `snapshotJson`, computes score                                | Dev   |

**Deliverable:** Student completes a full timed CBT with autosave, offline resilience, and accurate scoring.

---

### Phase 9: Results & Review (Week 12)

**Goal:** Instant results with full answer review.

| Task | Details                                                                                                                               | Owner |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 9.1  | Result Page (UI/UX §7.11): summary card (score, accuracy, time, correct/incorrect/skipped)                                            | Dev   |
| 9.2  | Stacked bar chart (correct/incorrect/skipped) — no celebration animation (UI/UX §3.5)                                                 | Dev   |
| 9.3  | Full review list: filterable (correct/incorrect/skipped/marked), shows question, student answer, correct answer, explanation (if any) | Dev   |
| 9.4  | Admin aggregate results (DB/API §6.10): per-exam stats across all attempts                                                            | Dev   |
| 9.5  | Admin monitor (UI/UX §7.12): live attempt table (polling, no WebSockets per TRD §13.5)                                                | Dev   |

**Deliverable:** Complete result experience for students; monitoring for admin.

---

### Phase 10: Hardening, Testing, Deployment (Weeks 13-14)

**Goal:** Production-ready v0.

| Task  | Details                                                                                                                       | Owner |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | ----- |
| 10.1  | End-to-end test: upload real JEE Main PDF → review → publish → student attempt → result                                       | Dev   |
| 10.2  | Load test CBT: simulate 50 concurrent attempts (target: <150ms autosave, <2s TTI)                                             | Dev   |
| 10.3  | Security audit: run through TRD §10 checklist; `npm audit` / `pip-audit`                                                      | Dev   |
| 10.4  | Accessibility audit: keyboard-only CBT, screen reader (NVDA), 200% zoom, high contrast theme                                  | Dev   |
| 10.5  | Rate limiting: configure Better Auth Postgres-backed limiter (TRD §5.1 gap)                                                   | Dev   |
| 10.6  | Backup restore test: restore Supabase backup to staging, verify data integrity                                                | Dev   |
| 10.7  | Documentation: `README.md`, API docs (OpenAPI), runbooks for deploy/restore                                                   | Dev   |
| 10.8  | Production deploy: Vercel (web), Railway/Render (processor), Supabase (prod project)                                          | Dev   |
| 10.9  | Validation group onboarding: create student accounts, send exam links, collect feedback                                       | Dev   |
| 10.10 | Success criteria verification (PRD §9): ≤15% correction rate, 1+ student completes, score matches hand-check, <30 min publish | Dev   |

**Deliverable:** Validated v0 ready for real users.

---

## 7. Phase Dependencies & Critical Path

```
Phase 1 (Foundation)
    │
    ├─→ Phase 2 (Admin Upload) ──────────────────────┐
    │                                                │
    ├─→ Phase 3 (Doc Processor Core) ───────────────┤
    │                                                │
    └─→ Phase 4 (JEE Main Parser) ◄─────────────────┘
              │
              ▼
         Phase 5 (Review Queue)
              │
              ▼
         Phase 6 (Config & Publish)
              │
              ▼
         Phase 7 (Student Dashboard)
              │
              ▼
         Phase 8 (CBT Engine) ──────────► Phase 9 (Results)
              │                                │
              └────────────────────────────────┘
                              │
                              ▼
                        Phase 10 (Hardening)
```

**Critical Path:** 1 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10  
(Phase 2 can run in parallel with 3 after 1 is done)

---

## 8. Open Questions Requiring Your Decision

| #      | Question                                                   | Options                                                                | Recommendation                                                                                                            |
| ------ | ---------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Q1** | **Exact JEE Main sample PDFs for parser development**      | You provide 5+ PDFs / I use public samples                             | **You provide** — real papers from your target year/shift ensure parser matches actual layout. Public samples may differ. |
| **Q2** | **Transactional email provider for future password reset** | Resend (free tier), SendGrid (free tier), Mailgun (trial), self-hosted | **Resend** — generous free tier (3k/mo), React email templates, good DX. Decide now so Phase 1 can set up DNS.            |
| **Q3** | **Validation group size & timeline**                       | 5 students, 2 weeks / 10 students, 1 week / other                      | Define **now** — affects Phase 10 scheduling and any load-test targets.                                                   |
| **Q4** | **Exam duration for validation tests**                     | Full 3-hour JEE Main / Shortened 1-hour / Configurable                 | **Configurable** (already in schema). Use 1-hour for validation to get faster feedback cycles.                            |
| **Q5** | **Institutional branding in v0?**                          | No / Admin logo upload only / Full theme tokens                        | **No** — per PRD non-goals and UI/UX §4. Institutional theme is future.                                                   |

---

## 9. Approval Checklist

Before implementation begins, please confirm:

- [ ] **PRD scope (JEE Main, MCQ-only, admin+invited students) is final**
- [ ] **TRD architecture (monorepo, Better Auth, Supabase, no Redis) is approved**
- [ ] **UI/UX specification (tokens, components, CBT layout, offline flow) is approved**
- [ ] **Document Processing pipeline (stages, parser interface, confidence, review) is approved**
- [ ] **Database schema and API contracts are approved**
- [ ] **Risk R1 acknowledged: you will provide 5+ real JEE Main PDFs before Phase 4**
- [ ] **Risk R3 acknowledged: phase gates will be enforced; no parallel phase starts**
- [ ] **Open questions Q1-Q5 answered above**

---

## 10. Next Steps

Upon your approval:

1. **I will create a `TODO.md`** with the phase-by-phase task list from §6 as trackable items.
2. **Begin Phase 1** — monorepo setup, Prisma schema, Better Auth, shared types, CI, deploy previews.
3. **Schedule a check-in** at the end of Phase 1 to verify foundation before moving to parallel Phase 2/3.

---

_This review is complete. The architecture is sound, risks are identified with mitigations, and the roadmap is actionable. Awaiting your approval to proceed._
