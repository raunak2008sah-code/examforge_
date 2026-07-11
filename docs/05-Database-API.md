# 05 — Database & API

**ExamForge · Backend Contract — Database Schema + REST API Specification**

Status: ✅ Locked (extends 01-PRD.md, 02-TRD.md, 03-UI-UX.md, 04-Document-Processing.md)
Scope: The complete data model and API surface for the Modular Monolith backend.

---

## 1. Database Philosophy

### 1.1 Why PostgreSQL

| Requirement                                                   | PostgreSQL Fit                                                                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Relational integrity (exams → sections → questions → options) | Strong FK constraints, native transactions                                                                         |
| Locked stack decision (Supabase)                              | Supabase _is_ managed Postgres — no separate justification needed, but reaffirmed here as the system of record     |
| JSON storage alongside relational data                        | Native `jsonb` for parser output snapshots (Sec. 4 of 04-Document-Processing.md) without needing a second database |
| ACID guarantees for exam attempts                             | Prevents lost/partial writes during autosave and submission (Sec. 8)                                               |

### 1.2 Normalization Strategy

- **3NF for core entities** (Users, Exams, Questions, Options, Attempts) — avoids update anomalies, matches "Server is authoritative" principle.
- **Deliberate denormalization only in two places:**
  1. `ExamVersions.snapshotJson` — a frozen `jsonb` copy of the full exam structure at publish time, so a student's attempt is never affected by a later edit to the live exam (see 1.5, Versioning).
  2. `AttemptResponses` stores a copy of `selectedOptionId` even though it's derivable — needed for audit/history even if the option is later edited/deleted.

### 1.3 UUID Policy

- **All primary keys are UUIDv4**, not auto-increment integers.
- Justification:
  - Prevents enumeration attacks on public-ish endpoints (e.g. guessing attempt IDs).
  - Safe to generate client-side or in parser service before DB insert (useful for the async parser job flow in 04-Document-Processing.md, where the Python service and Next.js backend both need to reference the same job ID before either has written a row).
  - No coordination needed across the two runtimes (FastAPI + Prisma/Node) for ID generation.

### 1.4 Soft Delete vs Hard Delete

| Entity Class                                    | Policy                                       | Reasoning                                                                                 |
| ----------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Users, Exams, ExamVersions, Questions, Attempts | **Soft delete** (`deletedAt` timestamp)      | Legal/audit trail — an exam a student already attempted must never structurally disappear |
| Sessions                                        | **Hard delete**                              | Pure ephemeral auth state, no audit value                                                 |
| UploadedFiles                                   | **Soft delete** + async physical cleanup job | Row kept for audit; underlying Storage object purged after retention window (Sec. 10.5)   |
| ParserJobs, ReviewQueue                         | **Soft delete**                              | Needed for parser accuracy evaluation (Sec 15 of 04-Document-Processing.md)               |
| AuditLogs                                       | **Never deleted**                            | Append-only by definition                                                                 |

### 1.5 Versioning Strategy

- An `Exam` is a stable identity (title, owner, metadata). It never holds live question content directly.
- An `ExamVersion` is an **immutable, published snapshot** (mirrors the JSON schema from 04-Document-Processing.md Sec. 10). Editing after publish creates a **new** `ExamVersion` row; it never mutates a published one.
- Attempts are always tied to a specific `ExamVersion.id`, never to the parent `Exam` — this is what makes **version locking** (Sec. 8.5) possible.

```
Exam (1) ───── (N) ExamVersion ───── (N) Attempt
 "identity"        "immutable snapshot"    "locked to one version"
```

### 1.6 Audit Strategy

- A single generic `AuditLog` table (Sec. 3.15) captures **who did what to what, when**, across all sensitive mutations (publish, approve, role change, delete).
- Chosen over per-table history tables for MVP: one table = simpler ₹0-infra footprint, still queryable per-entity via `entityType` + `entityId` columns, extensible later without schema churn.

---

## 2. Entity Relationship Diagram

```
┌───────────┐        ┌───────────┐          ┌───────────┐
│   Role     │ 1    N │   User     │ 1      N │  Session   │
│───────────│◄───────│───────────│◄─────────│───────────│
│ id         │        │ id         │          │ id         │
│ name       │        │ roleId     │          │ userId     │
└───────────┘        │ email      │          │ token      │
                      │ ...        │          │ expiresAt  │
                      └─────┬─────┘          └───────────┘
                            │ 1
                            │ (uploadedBy)
                            │ N
                     ┌──────▼──────┐
                     │ UploadedFile │
                     │─────────────│
                     │ id           │
                     │ storagePath  │
                     │ uploadedBy   │
                     └──────┬──────┘
                            │ 1
                            │ N
                     ┌──────▼──────┐        ┌──────────────┐
                     │  ParserJob   │ 1    N │ ReviewQueue   │
                     │─────────────│◄───────│──────────────│
                     │ id           │        │ id            │
                     │ fileId       │        │ parserJobId   │
                     │ status       │        │ payloadJson   │
                     │ resultJson   │        │ status        │
                     └──────┬──────┘        │ reviewedBy    │
                            │ (on approve)   └──────┬───────┘
                            │ creates                │
                            ▼                        │
                     ┌─────────────┐                 │
                     │    Exam      │◄────────────────┘
                     │─────────────│   (approval creates
                     │ id           │    Exam + first
                     │ ownerId(User)│    ExamVersion)
                     │ title        │
                     └──────┬──────┘
                            │ 1
                            │ N
                     ┌──────▼───────┐
                     │ ExamVersion   │
                     │──────────────│
                     │ id            │
                     │ examId        │
                     │ versionNumber │
                     │ status        │
                     │ snapshotJson  │
                     └──┬───────┬────┘
                        │1      │1
                        │N      │N
              ┌─────────▼──┐ ┌──▼───────┐
              │  Section    │ │ Attempt   │
              │────────────│ │──────────│
              │ id          │ │ id        │
              │ examVersionId│ │ userId   │
              │ name        │ │examVersionId│
              │ order       │ │ status    │
              └──────┬──────┘ └──┬────────┘
                     │1            │1
                     │N            │N
              ┌──────▼──────┐  ┌───▼─────────────┐
              │  Question    │  │ AttemptResponse  │
              │─────────────│  │─────────────────│
              │ id           │◄─│ questionId       │
              │ sectionId    │  │ attemptId        │
              │ statement    │  │ selectedOptionId │
              └──────┬──────┘  └─────────────────┘
                     │1
                     │N
              ┌──────▼──────┐
              │   Option     │
              │─────────────│
              │ id           │
              │ questionId   │
              │ label        │
              │ isCorrect    │
              └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AuditLog    │     │  Settings    │     │Notification  │
│ (references  │     │ (key-value,  │     │  (future)    │
│  any entity   │     │  global)     │     │             │
│  via type+id) │     └─────────────┘     └─────────────┘
└─────────────┘
```

### Cardinality Summary

| Relationship                   | Cardinality          | Notes                                                               |
| ------------------------------ | -------------------- | ------------------------------------------------------------------- |
| Role → User                    | 1:N                  | A user has exactly one role (MVP; no multi-role)                    |
| User → Session                 | 1:N                  | Multiple devices/sessions per user                                  |
| User → UploadedFile            | 1:N                  | Uploader tracked for audit                                          |
| UploadedFile → ParserJob       | 1:N                  | Re-parse creates a new job against same file                        |
| ParserJob → ReviewQueue        | 1:1 (per submission) | One review record per parser run pending approval                   |
| ReviewQueue → Exam/ExamVersion | 1:1 on approval      | Approval action creates Exam (if new) + ExamVersion                 |
| Exam → ExamVersion             | 1:N                  | Full version history retained                                       |
| ExamVersion → Section          | 1:N                  |                                                                     |
| Section → Question             | 1:N                  |                                                                     |
| Question → Option              | 1:N (exactly 4, MVP) |                                                                     |
| ExamVersion → Attempt          | 1:N                  |                                                                     |
| Attempt → AttemptResponse      | 1:N                  |                                                                     |
| Question → AttemptResponse     | 1:N                  | One response per question per attempt (unique constraint, Sec. 3.9) |

---

## 3. Database Models

Each model below is described conceptually (Purpose / Fields / Relationships / Constraints / Indexes). Concrete Prisma mapping conventions follow in Section 4.

### 3.1 User

**Purpose:** Core identity record; backs Better Auth.

| Field                 | Type             | Notes                                        |
| --------------------- | ---------------- | -------------------------------------------- |
| id                    | UUID (PK)        |                                              |
| email                 | String           | Unique                                       |
| name                  | String           |                                              |
| passwordHash          | String?          | Nullable if using OAuth-only via Better Auth |
| roleId                | UUID (FK → Role) |                                              |
| isActive              | Boolean          | Default true                                 |
| createdAt / updatedAt | DateTime         |                                              |
| deletedAt             | DateTime?        | Soft delete (1.4)                            |

**Relationships:** 1 Role, N Sessions, N UploadedFiles (as uploader), N Attempts, N AuditLogs (as actor).
**Constraints:** `email` unique (case-insensitive); `roleId` required (no roleless users).
**Indexes:** unique(`email`), index(`roleId`), index(`deletedAt`) for soft-delete filtering.

### 3.2 Role

**Purpose:** RBAC role definitions (Sec. 7).

| Field       | Type               | Notes                                     |
| ----------- | ------------------ | ----------------------------------------- |
| id          | UUID (PK)          |                                           |
| name        | Enum-backed String | `ADMIN`, `REVIEWER`, `STUDENT` (Sec. 4.3) |
| description | String?            |                                           |

**Relationships:** 1:N with User.
**Constraints:** `name` unique.
**Indexes:** unique(`name`).

### 3.3 Session

**Purpose:** Better Auth session tokens.

| Field     | Type             | Notes                        |
| --------- | ---------------- | ---------------------------- |
| id        | UUID (PK)        |                              |
| userId    | UUID (FK → User) |                              |
| token     | String           | Hashed, unique               |
| expiresAt | DateTime         |                              |
| ipAddress | String?          | Security logging (Sec. 14.8) |
| userAgent | String?          |                              |
| createdAt | DateTime         |                              |

**Relationships:** N:1 User.
**Constraints:** `token` unique; cascade delete on User hard-delete (users are soft-deleted in practice, so this is a safety net).
**Indexes:** unique(`token`), index(`userId`), index(`expiresAt`) (for expiry sweep jobs).

### 3.4 UploadedFile

**Purpose:** Metadata for every file uploaded to Supabase Storage (question papers, answer keys).

| Field            | Type             | Notes                                                                                           |
| ---------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| id               | UUID (PK)        |                                                                                                 |
| storagePath      | String           | Path/key inside Storage bucket                                                                  |
| originalFilename | String           | User-supplied name (display only — never used as a path, per 04-Document-Processing.md Sec. 14) |
| mimeType         | String           | Server-verified, not trusted from client                                                        |
| sizeBytes        | Integer          |                                                                                                 |
| checksum         | String           | SHA-256, for dedupe/integrity                                                                   |
| uploadedBy       | UUID (FK → User) |                                                                                                 |
| purpose          | Enum             | `QUESTION_PAPER`, `ANSWER_KEY`                                                                  |
| createdAt        | DateTime         |                                                                                                 |
| deletedAt        | DateTime?        | Soft delete; physical purge handled async (Sec. 10.5)                                           |

**Relationships:** N:1 User, 1:N ParserJob.
**Constraints:** `storagePath` unique.
**Indexes:** index(`uploadedBy`), index(`checksum`) (dedupe lookups).

### 3.5 ParserJob

**Purpose:** Tracks one invocation of the Python parser pipeline (04-Document-Processing.md Sec. 3) against an uploaded file.

| Field                   | Type                      | Notes                                                                         |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| id                      | UUID (PK)                 | Shared between FastAPI service and Next.js backend (1.3)                      |
| fileId                  | UUID (FK → UploadedFile)  |                                                                               |
| answerKeyFileId         | UUID? (FK → UploadedFile) | Optional second file                                                          |
| status                  | Enum                      | `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`                                 |
| resultJson              | Jsonb?                    | Full `ExamDocument` output (04-Document-Processing.md Sec. 10) once completed |
| overallConfidence       | Float?                    | Denormalized from `resultJson` for fast queue sorting                         |
| errorSummary            | String?                   | Populated on `FAILED`                                                         |
| startedAt / completedAt | DateTime?                 |                                                                               |
| createdAt               | DateTime                  |                                                                               |

**Relationships:** N:1 UploadedFile (×2), 1:1 ReviewQueue.
**Constraints:** `status` transitions are enforced at application layer (state machine, Sec. 9.5), not DB-level, but DB check-constrains against the enum values.
**Indexes:** index(`status`), index(`fileId`), index(`overallConfidence`) (queue sort/filter — Sec. 6.6).

### 3.6 ReviewQueue

**Purpose:** The human review workspace — one row per parser output awaiting admin/reviewer action (04-Document-Processing.md Sec. 9).

| Field                 | Type                  | Notes                                                                                 |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| id                    | UUID (PK)             |                                                                                       |
| parserJobId           | UUID (FK → ParserJob) |                                                                                       |
| workingJson           | Jsonb                 | Mutable draft — starts as a copy of `ParserJob.resultJson`, updated as reviewer edits |
| status                | Enum                  | `PENDING`, `IN_REVIEW`, `APPROVED`, `REJECTED`                                        |
| assignedTo            | UUID? (FK → User)     | Reviewer currently editing (optimistic lock, Sec. 9.4)                                |
| reviewedBy            | UUID? (FK → User)     | Who approved/rejected                                                                 |
| reviewedAt            | DateTime?             |                                                                                       |
| createdAt / updatedAt | DateTime              |                                                                                       |
| deletedAt             | DateTime?             |                                                                                       |

**Relationships:** 1:1 ParserJob, N:1 User (×2 roles: assignee, reviewer).
**Constraints:** `parserJobId` unique (one queue entry per job).
**Indexes:** index(`status`), index(`assignedTo`).

### 3.7 Exam

**Purpose:** Stable identity for an exam, independent of its published content (1.5).

| Field                 | Type                     | Notes                                                                    |
| --------------------- | ------------------------ | ------------------------------------------------------------------------ |
| id                    | UUID (PK)                |                                                                          |
| title                 | String                   |                                                                          |
| examType              | Enum                     | `JEE_MAIN` (extensible per 04-Document-Processing.md Sec. 16)            |
| ownerId               | UUID (FK → User)         | Admin who created it                                                     |
| currentVersionId      | UUID? (FK → ExamVersion) | Points to the latest **published** version (nullable if never published) |
| createdAt / updatedAt | DateTime                 |                                                                          |
| deletedAt             | DateTime?                |                                                                          |

**Relationships:** N:1 User (owner), 1:N ExamVersion.
**Constraints:** `currentVersionId`, if set, must reference an ExamVersion with `status = PUBLISHED`.
**Indexes:** index(`ownerId`), index(`examType`).

### 3.8 ExamVersion

**Purpose:** Immutable snapshot of exam content at a point in time (1.5).

| Field         | Type              | Notes                                                                                                                              |
| ------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| id            | UUID (PK)         |                                                                                                                                    |
| examId        | UUID (FK → Exam)  |                                                                                                                                    |
| versionNumber | Integer           | Sequential per exam (1, 2, 3…)                                                                                                     |
| status        | Enum              | `DRAFT`, `PUBLISHED`, `ARCHIVED`                                                                                                   |
| snapshotJson  | Jsonb             | Full denormalized copy at publish time (1.2) — source of truth for rendering an attempt even if Section/Question rows later change |
| publishedBy   | UUID? (FK → User) |                                                                                                                                    |
| publishedAt   | DateTime?         |                                                                                                                                    |
| createdAt     | DateTime          |                                                                                                                                    |

**Relationships:** N:1 Exam, 1:N Section, 1:N Attempt.
**Constraints:** unique(`examId`, `versionNumber`); `snapshotJson` required once `status = PUBLISHED` (enforced at application layer before the status transition, Sec. 9.2).
**Indexes:** unique(`examId`,`versionNumber`), index(`status`).

### 3.9 Section

**Purpose:** Subject/section grouping within an exam version (mirrors 04-Document-Processing.md Sec. 5.4).

| Field         | Type                    | Notes          |
| ------------- | ----------------------- | -------------- |
| id            | UUID (PK)               |                |
| examVersionId | UUID (FK → ExamVersion) |                |
| name          | String                  | e.g. "Physics" |
| order         | Integer                 | Display order  |

**Relationships:** N:1 ExamVersion, 1:N Question.
**Constraints:** unique(`examVersionId`, `order`).
**Indexes:** index(`examVersionId`).

### 3.10 Question

**Purpose:** A single MCQ question.

| Field         | Type                | Notes                                                         |
| ------------- | ------------------- | ------------------------------------------------------------- |
| id            | UUID (PK)           |                                                               |
| sectionId     | UUID (FK → Section) |                                                               |
| displayNumber | String              | Original printed number (04-Document-Processing.md Sec. 10.4) |
| statement     | Text                |                                                               |
| imageUrls     | String[]            | References into Storage (04-Document-Processing.md Sec. 5.5)  |
| order         | Integer             |                                                               |

**Relationships:** N:1 Section, 1:N Option, 1:N AttemptResponse.
**Constraints:** unique(`sectionId`, `order`); exactly 4 Options enforced at application layer (DB-level "exactly N children" isn't natively expressible in Postgres without triggers — deliberately kept as an app-layer validation rule, Sec. 11, to avoid trigger complexity against the "Minimal Dependencies" principle).
**Indexes:** index(`sectionId`).

### 3.11 Option

**Purpose:** One answer choice for a Question.

| Field      | Type                 | Notes                                                   |
| ---------- | -------------------- | ------------------------------------------------------- |
| id         | UUID (PK)            |                                                         |
| questionId | UUID (FK → Question) |                                                         |
| label      | Enum                 | `A`, `B`, `C`, `D`                                      |
| text       | Text                 |                                                         |
| isCorrect  | Boolean              | Exactly one `true` per question (app-enforced, Sec. 11) |

**Relationships:** N:1 Question.
**Constraints:** unique(`questionId`, `label`).
**Indexes:** index(`questionId`).

### 3.12 Attempt

**Purpose:** One student's sitting of one exam version (Sec. 8).

| Field          | Type                    | Notes                                                     |
| -------------- | ----------------------- | --------------------------------------------------------- |
| id             | UUID (PK)               |                                                           |
| userId         | UUID (FK → User)        |                                                           |
| examVersionId  | UUID (FK → ExamVersion) | Locked at creation (1.5, 8.5)                             |
| status         | Enum                    | `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `ABANDONED` |
| startedAt      | DateTime                |                                                           |
| submittedAt    | DateTime?               |                                                           |
| expiresAt      | DateTime                | Computed at start from exam duration setting              |
| score          | Float?                  | Computed on submit                                        |
| lastAutosaveAt | DateTime?               |                                                           |

**Relationships:** N:1 User, N:1 ExamVersion, 1:N AttemptResponse.
**Constraints:** **Single active attempt per (user, examVersion)** — partial unique index on `(userId, examVersionId)` WHERE `status = 'IN_PROGRESS'` (enforces "single active session," Sec. 8.6).
**Indexes:** index(`userId`), index(`examVersionId`), index(`status`), the partial unique index above.

### 3.13 AttemptResponse

**Purpose:** A student's answer to one question within an attempt.

| Field            | Type                 | Notes                                   |
| ---------------- | -------------------- | --------------------------------------- |
| id               | UUID (PK)            |                                         |
| attemptId        | UUID (FK → Attempt)  |                                         |
| questionId       | UUID (FK → Question) |                                         |
| selectedOptionId | UUID? (FK → Option)  | Nullable = unanswered                   |
| answeredAt       | DateTime?            |                                         |
| markedForReview  | Boolean              | Default false (UI feature, 03-UI-UX.md) |

**Relationships:** N:1 Attempt, N:1 Question, N:1 Option.
**Constraints:** unique(`attemptId`, `questionId`) — exactly one response row per question per attempt, upserted on each answer change (supports autosave, Sec. 8.2).
**Indexes:** unique(`attemptId`,`questionId`), index(`questionId`).

### 3.14 Settings

**Purpose:** Global key-value configuration (thresholds, durations) editable by Admin without a deploy.

| Field     | Type              | Notes                              |
| --------- | ----------------- | ---------------------------------- |
| key       | String (PK)       | e.g. `confidence.threshold.medium` |
| value     | Jsonb             | Typed per key at application layer |
| updatedBy | UUID? (FK → User) |                                    |
| updatedAt | DateTime          |                                    |

**Relationships:** N:1 User (updater).
**Constraints:** `key` primary key (inherently unique).
**Indexes:** none beyond PK — small table, always fully cached (Sec. 13.6).

### 3.15 AuditLog

**Purpose:** Append-only record of sensitive actions (1.6).

| Field      | Type              | Notes                                                        |
| ---------- | ----------------- | ------------------------------------------------------------ |
| id         | UUID (PK)         |                                                              |
| actorId    | UUID? (FK → User) | Nullable for system-initiated actions (e.g. auto-submit)     |
| action     | String            | e.g. `EXAM_PUBLISHED`, `REVIEW_APPROVED`, `ROLE_CHANGED`     |
| entityType | String            | e.g. `ExamVersion`                                           |
| entityId   | UUID              |                                                              |
| metadata   | Jsonb             | Action-specific context (before/after values where relevant) |
| createdAt  | DateTime          |                                                              |

**Relationships:** N:1 User (nullable).
**Constraints:** none (append-only; no updates/deletes ever performed).
**Indexes:** index(`entityType`,`entityId`), index(`actorId`), index(`createdAt`) (time-range queries).

### 3.16 Notification _(future — schema reserved, not built at MVP)_

**Purpose:** In-app/email notifications (review-ready, exam-published, attempt-graded).

| Field     | Type             | Notes |
| --------- | ---------------- | ----- |
| id        | UUID (PK)        |       |
| userId    | UUID (FK → User) |       |
| type      | String           |       |
| payload   | Jsonb            |       |
| readAt    | DateTime?        |       |
| createdAt | DateTime         |       |

**Relationships:** N:1 User. **Not wired into any API endpoint at MVP** (Sec. 16).

---

## 4. Prisma Design

### 4.1 Naming Conventions

| Element            | Convention                              | Example                                            |
| ------------------ | --------------------------------------- | -------------------------------------------------- |
| Model names        | PascalCase, singular                    | `ExamVersion`, not `exam_versions`                 |
| Field names        | camelCase                               | `createdAt`, `examVersionId`                       |
| Table names (DB)   | snake_case plural, via `@@map`          | `Model ExamVersion` → `@@map("exam_versions")`     |
| Foreign key fields | `<relatedModel>Id`                      | `sectionId`, `roleId`                              |
| Enums              | PascalCase type, SCREAMING_SNAKE values | `enum AttemptStatus { IN_PROGRESS SUBMITTED ... }` |

**Justification:** Prisma-idiomatic camelCase/PascalCase in the schema layer, translated to conventional Postgres snake_case at the physical layer via `@@map`/`@map` — keeps generated TypeScript types ergonomic while keeping the raw SQL layer conventional for any future direct-SQL tooling (e.g. Supabase dashboard, analytics).

### 4.2 Cascade Rules

| Relationship                              | On Parent Delete                                | Reasoning                                                            |
| ----------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| User → Session                            | `onDelete: Cascade`                             | Sessions are worthless without the user                              |
| ExamVersion → Section → Question → Option | `onDelete: Restrict` (soft delete used instead) | Never hard-cascade exam content — audit/history requirement (1.4)    |
| Attempt → AttemptResponse                 | `onDelete: Cascade`                             | Responses have no independent meaning without the attempt            |
| ParserJob → ReviewQueue                   | `onDelete: Restrict`                            | A completed job's review record must survive independently for audit |
| UploadedFile → ParserJob                  | `onDelete: Restrict`                            | Never silently orphan job history by deleting the source file row    |

### 4.3 Enums (declared once, reused across models)

```
enum RoleName      { ADMIN REVIEWER STUDENT }
enum FilePurpose   { QUESTION_PAPER ANSWER_KEY }
enum ParserStatus  { QUEUED PROCESSING COMPLETED FAILED }
enum ReviewStatus  { PENDING IN_REVIEW APPROVED REJECTED }
enum ExamVersionStatus { DRAFT PUBLISHED ARCHIVED }
enum AttemptStatus { IN_PROGRESS SUBMITTED AUTO_SUBMITTED ABANDONED }
enum OptionLabel   { A B C D }
```

**Justification for DB-level enums over free-text + app validation:** these are closed, rarely-changing sets central to state-machine logic (Sec. 9) — a DB constraint is a second line of defense against a bug writing an invalid status, cheap to add, costly to skip.

### 4.4 Transactions

Prisma's interactive transactions (`prisma.$transaction`) are used wherever a single business operation touches multiple tables and must be all-or-nothing. See Section 9 for the specific transaction boundaries (Create Exam, Publish, Start Attempt, Submit Attempt, Parser Approval, Version Creation) — each documented there with its exact statement sequence, since transaction _design_ is a business-logic concern, not just a Prisma mechanism.

---

## 5. API Philosophy

### 5.1 REST Conventions & Versioning

- All routes under `/api/v1/` — a version bump (`/api/v2/`) is the escape hatch for breaking changes, so `v1` clients never break silently (important once mobile clients exist).
- Resource-oriented URLs, plural nouns: `/exams`, `/attempts`, `/uploads` — never verbs in the path (`/getExams` ❌).

### 5.2 HTTP Methods

| Method   | Usage                                                                                   |
| -------- | --------------------------------------------------------------------------------------- |
| `GET`    | Read, always safe/idempotent, never mutates                                             |
| `POST`   | Create a new resource, or trigger a non-idempotent action (e.g. `/attempts/:id/submit`) |
| `PATCH`  | Partial update of an existing resource                                                  |
| `PUT`    | Not used at MVP (no full-replace semantics needed)                                      |
| `DELETE` | Soft delete (1.4) — never a physical row removal for entities in the soft-delete class  |

### 5.3 Status Codes

| Code | Meaning in ExamForge                                                        |
| ---- | --------------------------------------------------------------------------- |
| 200  | Success (read/update)                                                       |
| 201  | Resource created                                                            |
| 202  | Accepted — async job queued (e.g. parser submission)                        |
| 204  | Success, no body (e.g. delete)                                              |
| 400  | Validation error (malformed request)                                        |
| 401  | Not authenticated                                                           |
| 403  | Authenticated but not authorized (RBAC/ownership failure)                   |
| 404  | Resource not found (or soft-deleted — see 5.7)                              |
| 409  | Conflict (e.g. duplicate active attempt, version mismatch)                  |
| 422  | Semantically invalid (e.g. publish attempted with unresolved review errors) |
| 429  | Rate limited                                                                |
| 500  | Unexpected server error                                                     |

### 5.4 Pagination

- Cursor-based (`?cursor=<id>&limit=20`) for all list endpoints, not offset-based.
- **Justification:** offset pagination degrades and can skip/duplicate rows under concurrent writes (e.g. ReviewQueue actively being written to by the parser service); cursor pagination is stable regardless of concurrent inserts.

### 5.5 Filtering & Sorting

- Filtering via query params scoped to indexed fields only (e.g. `?status=PENDING`, `?examType=JEE_MAIN`) — prevents accidental full-table-scan filters being exposed as an API contract.
- Sorting via `?sort=createdAt:desc` — default sort always defined per endpoint (never "undefined order").

### 5.6 Validation

- All request bodies validated against a schema (e.g. Zod) at the API boundary **before** touching Prisma — "never trust client input" (Sec. 11) applies uniformly regardless of how trusted the caller seems (even Admin-role requests are fully validated).

### 5.7 Soft-Delete Visibility

- All `GET` queries default to excluding `deletedAt IS NOT NULL` rows — a soft-deleted resource returns `404`, identical to a truly-missing one, so clients can't distinguish "never existed" from "deleted" (avoids leaking deletion history through the read API; that history is only visible via `AuditLog` to Admins).

### 5.8 Idempotency

- State-changing `POST` actions that could plausibly be retried by a flaky client (`/attempts/:id/submit`, `/review-queue/:id/approve`) accept an `Idempotency-Key` header; the server stores the key with the result for a rolling window and returns the original result on retry instead of re-executing — critical for **Submit Attempt**, where a double-submit must never double-score or corrupt state.

---

## 6. API Endpoints

_Auth column values: `Public`, `Authenticated` (any logged-in role), `Student`, `Reviewer`, `Admin` (role-gated — see Sec. 7.4 Permission Matrix for the full grid)._

### 6.1 Authentication

| Endpoint                | Method | Auth          | Purpose                                                                                    |
| ----------------------- | ------ | ------------- | ------------------------------------------------------------------------------------------ |
| `/api/v1/auth/register` | POST   | Public        | Create account (student self-serve; admin-created accounts also supported per 03-UI-UX.md) |
| `/api/v1/auth/login`    | POST   | Public        | Establish session via Better Auth                                                          |
| `/api/v1/auth/logout`   | POST   | Authenticated | Revoke current session                                                                     |
| `/api/v1/auth/session`  | GET    | Authenticated | Return current user + role (for frontend hydration)                                        |

**Example detail — Login:**

- **Request:** `{ email, password }`
- **Response (200):** `{ user: { id, name, role }, sessionExpiresAt }` (session cookie set via `Set-Cookie`, not returned in body — avoids token exposure to JS, Sec. 14.7)
- **Errors:** `400` malformed body, `401` invalid credentials, `429` too many attempts (Sec. 14.4)

### 6.2 Users (self-service)

| Endpoint           | Method | Auth          | Purpose                  |
| ------------------ | ------ | ------------- | ------------------------ |
| `/api/v1/users/me` | GET    | Authenticated | Get own profile          |
| `/api/v1/users/me` | PATCH  | Authenticated | Update own name/password |

### 6.3 Admin — User Management

| Endpoint                  | Method | Auth  | Purpose                                    |
| ------------------------- | ------ | ----- | ------------------------------------------ |
| `/api/v1/admin/users`     | GET    | Admin | List users (paginated, filterable by role) |
| `/api/v1/admin/users/:id` | PATCH  | Admin | Change role, activate/deactivate           |
| `/api/v1/admin/users/:id` | DELETE | Admin | Soft-delete user                           |

### 6.4 Uploads

| Endpoint              | Method | Auth           | Purpose                                                                                                           |
| --------------------- | ------ | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/api/v1/uploads`     | POST   | Admin/Reviewer | Upload question paper (and optional answer key); returns `UploadedFile` record(s) + triggers `ParserJob` creation |
| `/api/v1/uploads/:id` | GET    | Admin/Reviewer | Get file metadata                                                                                                 |
| `/api/v1/uploads/:id` | DELETE | Admin          | Soft-delete file                                                                                                  |

**Detail — Create Upload:**

- **Request:** `multipart/form-data` — `file` (question paper), `answerKeyFile?` (optional)
- **Response (202):** `{ uploadedFileId, parserJobId, status: "QUEUED" }` — async, matches 04-Document-Processing.md's background-job design (Sec. 13.4)
- **Errors:** `400` invalid file (fails magic-byte/size check per 04-Document-Processing.md Sec. 14), `413` too large, `415` wrong MIME type

### 6.5 Parser (internal-facing — called by the FastAPI service, not the frontend)

| Endpoint                  | Method | Auth                   | Purpose                                                          |
| ------------------------- | ------ | ---------------------- | ---------------------------------------------------------------- |
| `/api/v1/parser/jobs/:id` | PATCH  | Service-to-service key | Parser service reports job status/result back to Next.js backend |

**Detail:**

- **Request:** `{ status, resultJson?, errorSummary? }`
- **Response (200):** `{ jobId, status }` — on `COMPLETED`, backend automatically creates the corresponding `ReviewQueue` row (Sec. 9.5)
- **Authentication:** shared-secret service key (not a user session) — see Sec. 14.9

### 6.6 Review Queue

| Endpoint                           | Method | Auth           | Purpose                                                              |
| ---------------------------------- | ------ | -------------- | -------------------------------------------------------------------- |
| `/api/v1/review-queue`             | GET    | Reviewer/Admin | List pending items, sortable by `confidence`, filterable by `status` |
| `/api/v1/review-queue/:id`         | GET    | Reviewer/Admin | Get full working JSON for editing                                    |
| `/api/v1/review-queue/:id`         | PATCH  | Reviewer/Admin | Save edits to `workingJson`                                          |
| `/api/v1/review-queue/:id/approve` | POST   | Reviewer/Admin | Validate + approve → creates/updates Exam + ExamVersion (Sec. 9.5)   |
| `/api/v1/review-queue/:id/reject`  | POST   | Reviewer/Admin | Mark rejected, no Exam created                                       |

**Detail — Approve:**

- **Request:** `{}` (idempotency key required, Sec. 5.8)
- **Response (200):** `{ examId, examVersionId, status: "PUBLISHED" }`
- **Errors:** `422` if unresolved validation errors remain (04-Document-Processing.md Sec. 11 hard errors) — server re-validates `workingJson` itself, never trusts a client-side "all clear"

### 6.7 Exams

| Endpoint            | Method | Auth          | Purpose                                                  |
| ------------------- | ------ | ------------- | -------------------------------------------------------- |
| `/api/v1/exams`     | GET    | Authenticated | List exams (students see only published; admins see all) |
| `/api/v1/exams/:id` | GET    | Authenticated | Get exam identity + current published version summary    |
| `/api/v1/exams/:id` | PATCH  | Admin         | Update exam metadata (title) — does not touch content    |
| `/api/v1/exams/:id` | DELETE | Admin         | Soft-delete exam (and cascՠ-soft-deletes versions)       |

### 6.8 Exam Versions

| Endpoint                                            | Method | Auth  | Purpose                                                 |
| --------------------------------------------------- | ------ | ----- | ------------------------------------------------------- |
| `/api/v1/exams/:examId/versions`                    | GET    | Admin | List all versions (draft/published/archived) of an exam |
| `/api/v1/exams/:examId/versions/:versionId`         | GET    | Admin | Full snapshot content                                   |
| `/api/v1/exams/:examId/versions/:versionId/publish` | POST   | Admin | Promote a `DRAFT` version to `PUBLISHED` (Sec. 9.2)     |
| `/api/v1/exams/:examId/versions/:versionId/archive` | POST   | Admin | Retire an old version                                   |

### 6.9 Attempts

| Endpoint                         | Method | Auth          | Purpose                                                                |
| -------------------------------- | ------ | ------------- | ---------------------------------------------------------------------- |
| `/api/v1/exams/:examId/attempts` | POST   | Student       | Start a new attempt on the exam's current published version (Sec. 9.3) |
| `/api/v1/attempts/:id`           | GET    | Student (own) | Resume — get current state + remaining time                            |
| `/api/v1/attempts/:id/responses` | PATCH  | Student (own) | Autosave a single response (upsert)                                    |
| `/api/v1/attempts/:id/submit`    | POST   | Student (own) | Finalize attempt, compute score (Sec. 9.4)                             |

**Detail — Start Attempt:**

- **Request:** `{}`
- **Response (201):** `{ attemptId, examVersionId, expiresAt, sections: [...] }` (question content, **without** `isCorrect` flags — server never leaks answers to the client, Sec. 11.4)
- **Errors:** `409` if an `IN_PROGRESS` attempt already exists for this user+version (Sec. 8.6) — response includes the existing `attemptId` so the frontend can redirect to Resume instead

**Detail — Autosave Response:**

- **Request:** `{ questionId, selectedOptionId | null, markedForReview? }`
- **Response (200):** `{ savedAt }`
- **Errors:** `409` if attempt is not `IN_PROGRESS` (e.g. already submitted or expired) — Sec. 8.2

**Detail — Submit:**

- **Request:** `{}` + `Idempotency-Key` header
- **Response (200):** `{ attemptId, status: "SUBMITTED", score }`
- **Errors:** `409` already submitted (idempotent replay returns original result instead of erroring, per Sec. 5.8)

### 6.10 Results

| Endpoint                        | Method | Auth                  | Purpose                                                                                          |
| ------------------------------- | ------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| `/api/v1/attempts/:id/result`   | GET    | Student (own) / Admin | Full scored breakdown (per-question correct/incorrect, if exam settings allow answer visibility) |
| `/api/v1/exams/:examId/results` | GET    | Admin                 | Aggregate results across all attempts for an exam                                                |

### 6.11 Settings

| Endpoint                      | Method | Auth  | Purpose                                              |
| ----------------------------- | ------ | ----- | ---------------------------------------------------- |
| `/api/v1/admin/settings`      | GET    | Admin | List all config key-values                           |
| `/api/v1/admin/settings/:key` | PATCH  | Admin | Update a single setting (e.g. confidence thresholds) |

### 6.12 Health

| Endpoint         | Method | Auth   | Purpose                                           |
| ---------------- | ------ | ------ | ------------------------------------------------- |
| `/api/v1/health` | GET    | Public | Liveness check (DB reachable, no secrets exposed) |

---

## 7. Authentication Flow

### 7.1 Better Auth + Sessions (sequence)

```
Client                         Next.js (Better Auth)         PostgreSQL
  │  POST /auth/login               │                              │
  │─────────────────────────────────►│                              │
  │                                  │  verify passwordHash          │
  │                                  │──────────────────────────────►│
  │                                  │◄──────────────────────────────│
  │                                  │  create Session row           │
  │                                  │──────────────────────────────►│
  │  Set-Cookie: session=<token>     │                              │
  │◄─────────────────────────────────│                              │
  │  GET /api/v1/exams (cookie sent) │                              │
  │─────────────────────────────────►│                              │
  │                                  │  lookup Session by token       │
  │                                  │  → attach req.user + role      │
  │                                  │──────────────────────────────►│
  │  200 response                    │                              │
  │◄─────────────────────────────────│                              │
```

- Session token is an **httpOnly, secure, sameSite=strict cookie** — never accessible to client-side JS (mitigates XSS token theft, Sec. 14).

### 7.2 RBAC — Roles

| Role       | Description                                                                            |
| ---------- | -------------------------------------------------------------------------------------- |
| `ADMIN`    | Full system access: manage users, publish exams, view all results, edit settings       |
| `REVIEWER` | Upload papers, work the Review Queue, approve/reject — cannot manage users or settings |
| `STUDENT`  | Attempt published exams, view own results only                                         |

### 7.3 Authorization Strategy

Two layers, both always enforced server-side (never trust client-side route guards alone):

1. **Role check** — does this role have access to this endpoint at all? (static, per Sec. 7.4 matrix)
2. **Ownership check** — for object-scoped actions (e.g. `GET /attempts/:id`), does `req.user.id` own this resource, or does the role bypass ownership (Admin)? Enforced at the query layer (`WHERE userId = req.user.id` unless Admin).

### 7.4 Permission Matrix

| Action                     |  Admin   | Reviewer |    Student    |
| -------------------------- | :------: | :------: | :-----------: |
| Upload question paper      |    ✅    |    ✅    |      ❌       |
| View Review Queue          |    ✅    |    ✅    |      ❌       |
| Approve/Reject review item |    ✅    |    ✅    |      ❌       |
| Publish exam version       |    ✅    |    ❌    |      ❌       |
| Manage users/roles         |    ✅    |    ❌    |      ❌       |
| Edit settings              |    ✅    |    ❌    |      ❌       |
| Start/attempt exam         |   ❌\*   |   ❌\*   |      ✅       |
| View own attempt/result    | ✅ (any) |    ❌    | ✅ (own only) |
| View aggregate results     |    ✅    |    ❌    |      ❌       |

_\* Admins/Reviewers are not blocked by role from attempting exams in principle, but MVP scope treats exam-taking as a Student-only flow; not exposed in Admin/Reviewer UI (03-UI-UX.md)._

---

## 8. Exam Attempt Flow

### 8.1 Attempt Lifecycle (state machine)

```
        POST /attempts
              │
              ▼
       ┌─────────────┐
       │ IN_PROGRESS  │◄──────────────┐
       └──────┬───────┘               │ PATCH /responses
              │                       │ (autosave, repeatable)
     ┌────────┼────────┐              │
     │        │        │              │
POST /submit  │   expiresAt reached   │
     │        │        │              │
     ▼        │        ▼              │
┌──────────┐  │  ┌───────────────┐    │
│ SUBMITTED │  │  │ AUTO_SUBMITTED │   │
└──────────┘  │  └───────────────┘    │
              │                       │
     user abandons (closes tab,      │
     never returns) ─────────────────┘
              │
              ▼
       ┌────────────┐
       │ ABANDONED   │  (set by a periodic sweep job, not user action)
       └────────────┘
```

### 8.2 Autosave

- Every answer selection triggers `PATCH /attempts/:id/responses` — an **upsert** on the unique `(attemptId, questionId)` constraint (3.13), so retries/double-clicks are naturally idempotent without extra idempotency-key plumbing.
- Frontend debounces rapid changes (e.g. user flipping between options quickly) but always flushes on question-navigation or tab-blur (03-UI-UX.md concern; noted here for contract completeness — the API itself must tolerate high-frequency calls).

### 8.3 Resume

- `GET /attempts/:id` returns current `AttemptResponse` rows merged with the frozen question content from `ExamVersion.snapshotJson` — a resumed attempt always renders identically to how it started, even if the live `Exam`/`Section`/`Question` rows were edited afterward (this is the entire reason snapshotJson exists, 1.5).

### 8.4 Submit / Auto-Submit

- **Manual submit:** explicit `POST /attempts/:id/submit` from the student.
- **Auto-submit:** a scheduled sweep (cron-style job, no Redis needed — see 13.6) finds `IN_PROGRESS` attempts past `expiresAt` and transitions them to `AUTO_SUBMITTED`, scoring whatever responses exist at that moment. Same scoring transaction as manual submit (Sec. 9.4) — only the trigger differs.

### 8.5 Version Locking

- `Attempt.examVersionId` is set once at creation and never changes. Even if the `Exam.currentVersionId` moves to a newer version while a student is mid-attempt, their attempt continues against the version they started — prevents "the exam changed under me" bugs and matches the Reliability principle.

### 8.6 Single Active Session (per exam)

- Enforced by the partial unique index (3.12): a user cannot have two `IN_PROGRESS` attempts on the **same exam version** simultaneously (e.g. opening the exam in two browser tabs).
- **Conflict handling:** the second `POST /attempts` call gets `409` with the existing `attemptId` — frontend redirects to Resume rather than erroring opaquely.
- Multi-tab editing of the _same_ attempt (two tabs open on one resumed attempt) is handled at the autosave layer: last-write-wins per question (each `PATCH` is an independent upsert), acceptable at MVP scope since conflicting simultaneous edits to the _same question_ from the _same user_ is a rare, low-stakes edge case (not a multi-user document).

---

## 9. Transactions

Each of the following is executed as a single Prisma `$transaction` — all statements succeed together or none do.

### 9.1 Create Exam (via Review Approval — see 9.5, they're the same transaction in practice at MVP)

### 9.2 Publish Exam Version

```
BEGIN
  1. Lock target ExamVersion row (status must be DRAFT)
  2. Re-validate snapshotJson against hard validation rules
     (04-Document-Processing.md Sec. 11) — server-side, never trust
     a stale client-side "looks good"
  3. UPDATE ExamVersion SET status = 'PUBLISHED', publishedAt = now(),
     publishedBy = :adminId
  4. UPDATE Exam SET currentVersionId = :versionId
  5. INSERT AuditLog (action = 'EXAM_PUBLISHED', ...)
COMMIT
```

**Why transactional:** steps 3–4 must never be split — an Exam pointing at a non-published version, or a published version with no parent pointer update, are both corrupt states.

### 9.3 Start Attempt

```
BEGIN
  1. SELECT Exam.currentVersionId (must be non-null → exam is published)
  2. Check no existing IN_PROGRESS attempt for (userId, versionId)
     (relies on partial unique index as the hard guarantee; this
     SELECT is a friendly pre-check to return a clean 409 message)
  3. INSERT Attempt (status = IN_PROGRESS, expiresAt = now() + duration)
  4. INSERT AuditLog (action = 'ATTEMPT_STARTED')
COMMIT
```

### 9.4 Submit Attempt

```
BEGIN
  1. Lock Attempt row (must be IN_PROGRESS)
  2. Fetch all AttemptResponses + correct Options from snapshotJson
  3. Compute score
  4. UPDATE Attempt SET status = 'SUBMITTED' (or 'AUTO_SUBMITTED'),
     submittedAt = now(), score = :computed
  5. INSERT AuditLog (action = 'ATTEMPT_SUBMITTED')
COMMIT
```

**Why transactional + idempotency-keyed (5.8):** scoring must happen exactly once; a network retry re-hitting this endpoint must not re-score or overwrite a settled result.

### 9.5 Parser Approval (Review Queue → Published Exam)

```
BEGIN
  1. Lock ReviewQueue row (status must be PENDING or IN_REVIEW)
  2. Re-run full validation rule set against workingJson
     (fail whole transaction with 422 if hard errors remain)
  3. INSERT Exam (if this is a new paper) OR reuse existing examId
     (if this review item is a re-parse/edit of an existing exam)
  4. INSERT ExamVersion (status = PUBLISHED, snapshotJson = workingJson,
     versionNumber = previousMax + 1)
  5. INSERT Section / Question / Option rows from workingJson
     (relational copies, in addition to the jsonb snapshot — enables
     normal relational querying/reporting per 1.2)
  6. UPDATE Exam SET currentVersionId = :newVersionId
  7. UPDATE ReviewQueue SET status = 'APPROVED', reviewedBy, reviewedAt
  8. INSERT AuditLog (action = 'REVIEW_APPROVED')
COMMIT
```

**Why transactional:** this is the highest-fan-out write in the system (one review approval creates potentially 100+ rows across Section/Question/Option) — a partial failure here must roll back completely rather than leave a half-created exam visible to students.

### 9.6 Version Creation (editing a previously-published exam)

- Follows the same shape as 9.5 steps 3–6, triggered from `/exams/:examId/versions` admin edit flow rather than the Review Queue — always creates a **new** `ExamVersion`, never mutates a published one (1.5).

---

## 10. File Storage

### 10.1 StorageService Abstraction

A thin internal interface (conceptual, not code) sits between the application and Supabase Storage, so the storage provider is swappable without touching business logic:

| Method                                | Responsibility                                              |
| ------------------------------------- | ----------------------------------------------------------- |
| `upload(file, path) -> StorageRef`    | Store bytes, return a reference (path/key)                  |
| `getSignedUrl(ref, expiresIn) -> URL` | Time-limited access URL (never permanently public, Sec. 14) |
| `delete(ref) -> void`                 | Physical removal                                            |
| `exists(ref) -> bool`                 | Integrity check                                             |

### 10.2 Supabase Implementation (current)

- Buckets separated by purpose: `question-papers/`, `answer-keys/`, `question-images/` — separate access policies per bucket rather than one flat bucket (least-privilege at the storage layer, Sec. 14).
- All access via **signed URLs** generated server-side on demand — the frontend never holds a long-lived direct storage credential.

### 10.3 Future Providers

- The abstraction (10.1) means a future move to S3/R2 (e.g. for institution-scale storage, Sec. 16) is a new implementation of the same interface — no API contract or Prisma schema change required, since `UploadedFile.storagePath` is provider-agnostic (just a string key).

### 10.4 Metadata Storage

- Physical bytes live in Storage; **all queryable metadata** (uploader, purpose, checksum, size) lives in Postgres (`UploadedFile`, 3.4) — Storage is never queried for "which files did user X upload," keeping that fast and relationally joinable.

### 10.5 Cleanup

- Soft-deleted `UploadedFile` rows are picked up by a scheduled sweep job after a configurable retention window (e.g. 30 days) which calls `StorageService.delete()` and then hard-removes the row — gives an undo window while still eventually reclaiming storage.

### 10.6 Security

- Covered in depth in 04-Document-Processing.md Sec. 14 (upload-time checks); at the storage layer specifically: bucket policies deny public listing, signed URLs are short-lived (minutes, not hours), and `originalFilename` is display-only metadata, never part of the actual storage path (path traversal prevention, consistent with 04-Document-Processing.md Sec. 14).

---

## 11. Validation

### 11.1 Layered Validation (defense in depth)

```
Client-side validation (UX only — never trusted)
        ↓
API-layer schema validation (Zod/equivalent) — shape, types, required fields
        ↓
Business rule validation — cross-field logic (e.g. exactly one isCorrect option)
        ↓
Database constraints — final backstop (unique, FK, enum, NOT NULL)
```

**Principle:** each layer assumes the one before it might have been bypassed (direct API calls, malicious clients) — "never trust client input" applies at every layer, not just the outermost one.

### 11.2 Key Business Rules (beyond DB constraints)

| Rule                                                                  | Enforced At                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Exactly 4 Options per Question, exactly 1 `isCorrect`                 | Application layer, checked before allowing Publish (9.2) and Approval (9.5)     |
| ExamVersion cannot move from `PUBLISHED` back to `DRAFT`              | Application-layer state machine guard                                           |
| Attempt cannot receive responses once not `IN_PROGRESS`               | Application layer (checked in 9.4-adjacent PATCH handler)                       |
| ReviewQueue cannot be approved with unresolved hard validation errors | Application layer, re-validated server-side even if client UI shows "all clear" |
| Settings values are type-checked against an expected schema per key   | Application layer (jsonb is flexible at the DB, so typing is enforced above it) |

---

## 12. Error Handling

### 12.1 Standard Error Response Format

```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [
      { "field": "email", "issue": "must be a valid email address" }
    ],
    "requestId": "uuid-for-support-correlation"
  }
}
```

### 12.2 Error Categories → HTTP Status

| Category                                       | Status | Example `code`                                                                                |
| ---------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Validation error                               | 400    | `VALIDATION_ERROR`                                                                            |
| Auth required                                  | 401    | `UNAUTHENTICATED`                                                                             |
| Forbidden (role/ownership)                     | 403    | `FORBIDDEN`                                                                                   |
| Not found / soft-deleted                       | 404    | `NOT_FOUND`                                                                                   |
| Conflict (duplicate attempt, version mismatch) | 409    | `CONFLICT`                                                                                    |
| Business rule failure                          | 422    | `UNPROCESSABLE` (e.g. `PUBLISH_BLOCKED_VALIDATION_ERRORS`)                                    |
| Rate limited                                   | 429    | `RATE_LIMITED`                                                                                |
| Unexpected                                     | 500    | `INTERNAL_ERROR` (message deliberately generic to the client; full detail server-logged only) |

### 12.3 Logging

- Every error response is logged server-side with `requestId`, `userId` (if authenticated), stack trace (500s only), and the same structured-log approach described in 04-Document-Processing.md Sec. 12.2 — the two services (parser + backend) share a common log-correlation convention via `requestId`/`parserJobId` so an issue can be traced across the Next.js ↔ FastAPI boundary.

### 12.4 Partial Failures

- Bulk operations (e.g. bulk-deleting uploaded files) return a per-item result array rather than an all-or-nothing status, so a client can see exactly which items succeeded/failed — matches the "fail small, not big" principle from 04-Document-Processing.md Sec. 12.1.

---

## 13. Performance

### 13.1 Indexes

- All FKs indexed by default via Prisma relation fields; additional indexes called out per-model in Section 3 for query patterns beyond simple FK lookups (status filters, partial unique constraints).

### 13.2 Query Optimization / N+1 Prevention

- All list endpoints returning nested relations (e.g. Exam with Sections/Questions) use Prisma's `include`/`select` to fetch in a single query rather than looping — enforced as a code-review checklist item (Sec. 6 of this doc + general engineering practice), since Prisma makes N+1 easy to introduce accidentally via lazy relation access in a loop.
- Attempt-taking reads (`GET /attempts/:id`) read from `ExamVersion.snapshotJson` (a single jsonb column) rather than joining live Section/Question/Option tables — deliberate performance + correctness win (also serves the version-locking guarantee, 8.5).

### 13.3 Pagination

- Covered in 5.4 — cursor-based, indexed on the cursor column (`createdAt` + `id` composite for stable ordering).

### 13.4 Connection Pooling

- Supabase's pooled connection endpoint (PgBouncer-backed) is used for the Next.js backend's Prisma client, since serverless/edge-adjacent Next.js deployments can otherwise exhaust direct Postgres connections under load — standard practice for this stack combination.

### 13.5 Caching Strategy (without Redis)

Per locked ₹0-budget/minimal-dependency constraints, no Redis at MVP. Instead:

| Data                                      | Caching Approach                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Settings` table                          | Loaded once at process start + in-memory cache, invalidated on `PATCH /admin/settings` (small table, low write frequency)                              |
| Published exam metadata (title, duration) | HTTP-layer caching via standard `Cache-Control` headers on the `GET /exams` list (short TTL, e.g. 60s) — safe since exam metadata changes infrequently |
| Attempt state                             | **Never cached** — always read live from DB; correctness (no lost autosaves, no stale timers) matters more than the marginal read-latency win here     |

**Justification:** an in-process/HTTP-cache-header approach covers the actual hot paths (settings, exam listings) without adding an operational dependency — Redis remains a clean future upgrade (Sec. 16) once scale actually demands it.

### 13.6 Expected Scale (MVP target)

| Metric                   | Target                                                 |
| ------------------------ | ------------------------------------------------------ |
| Concurrent exam attempts | Low hundreds (single-institution / early-access scale) |
| Questions per exam       | ~75–90 (JEE Main format)                               |
| Review Queue throughput  | Tens of papers/week                                    |
| DB size (Year 1)         | Low GB range — well within Supabase free/starter tier  |

---

## 14. Security

| Concern                     | Control                                                                                                                                                           | Notes                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **RBAC**                    | Enforced server-side on every route (Sec. 7.3–7.4)                                                                                                                | Never relies on frontend route guards alone                                                                                                  |
| **Ownership checks**        | Query-scoped `WHERE userId = req.user.id` unless role bypasses (Admin)                                                                                            | Applies to Attempts, own-profile edits                                                                                                       |
| **CSRF**                    | SameSite=strict cookies + CSRF token on state-changing requests from browser contexts                                                                             | Cookie-based sessions are the CSRF-relevant surface; API-key-authenticated service-to-service calls (Sec. 6.5) are exempt (not cookie-based) |
| **Rate limiting**           | Applied per-IP and per-user on auth endpoints (login, register) and on `POST /uploads`                                                                            | Mitigates credential-stuffing and upload-flooding (ties into 04-Document-Processing.md resource-exhaustion protections)                      |
| **Audit logs**              | Every sensitive mutation logged (Sec. 3.15)                                                                                                                       | Append-only, queryable by Admin only                                                                                                         |
| **Secrets**                 | DB connection strings, service-to-service API key (Sec. 6.5), Storage credentials — all in environment variables, never committed or returned in any API response | Standard 12-factor practice                                                                                                                  |
| **Session security**        | httpOnly, secure, sameSite cookies; server-side expiry enforcement independent of client-reported time (Sec. 7.1)                                                 |                                                                                                                                              |
| **File permissions**        | Storage buckets deny public listing/read; access only via short-lived signed URLs (Sec. 10.2, 10.6)                                                               |                                                                                                                                              |
| **Least privilege**         | Reviewer role cannot manage users/settings; Student role cannot see other students' attempts or any `isCorrect` flags before submission (Sec. 6.9)                | RBAC + field-level response shaping, not just endpoint-level gating                                                                          |
| **Service-to-service auth** | Parser callback endpoint (6.5) uses a shared secret / signed request, not a user session — scoped to that single endpoint only                                    | Prevents the FastAPI service from acquiring broader API access than it needs                                                                 |

---

## 15. Migration Strategy

### 15.1 Prisma Migrations

- Standard `prisma migrate dev` / `migrate deploy` workflow; every schema change ships as a reviewed, named migration file committed to the monorepo — no manual/ad-hoc schema edits against the Supabase instance.

### 15.2 Schema Evolution

- Additive changes (new nullable column, new table) are low-risk and deployed independently of application code changes where possible.
- Breaking changes (column removal/type change) follow an **expand → migrate data → contract** sequence across multiple deploys, never a single destructive migration against a live table with data.

### 15.3 Backward Compatibility

- API versioning (`/api/v1/`) is the primary compatibility boundary (5.1); the database schema itself is internal and can evolve underneath a stable API version as long as endpoint contracts don't change shape.

### 15.4 Exam Version Migrations

- Because `ExamVersion.snapshotJson` is the durable source of truth for already-published exams, a future change to the **live** JSON schema (04-Document-Processing.md Sec. 10.6 `schemaVersion`) does not require rewriting historical snapshots — the read path for attempts checks `schemaVersion` and applies the correct rendering/scoring logic per version, exactly analogous to how the parser output itself is versioned.

---

## 16. Future

| Area                    | Direction                                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Analytics**           | Aggregate performance dashboards (per-question difficulty, section-wise accuracy) — additive read-only queries against existing Attempt/AttemptResponse data, no schema change required to start          |
| **Institution support** | Introduce an `Institution` model above `User` (multi-tenancy); `Exam.ownerId` scoping extends to `Exam.institutionId`                                                                                     |
| **Multiple admins**     | Already supported by current RBAC (Role is many-Users) — "future" here really means institution-scoped admin boundaries, not a schema gap                                                                 |
| **Payments**            | New `Subscription`/`Order` models, isolated from core exam schema                                                                                                                                         |
| **Public APIs**         | A distinct `/api/public/v1/` surface with API-key auth and its own, more conservative rate limits — kept separate from the internal `/api/v1/` to avoid coupling external contracts to internal evolution |
| **Redis**               | Slot in as a cache layer per Sec. 13.5's identified hot paths, and as a proper job queue for ParserJob dispatch once throughput exceeds what a simple DB-status-polling approach handles well             |
| **Search**              | Full-text search over questions/exams — Postgres `tsvector` first (no new infra), Elasticsearch only if scale later demands it                                                                            |
| **WebSockets**          | Real-time Review Queue collaboration (live "who's editing what") and live attempt-timer sync — additive, doesn't change the REST contract for existing clients                                            |

---

## Cross-Functional Review Notes

**As Database Architect:** Snapshot-based versioning (1.5, 3.8) is the single most important design decision in this document — it decouples "what a student attempted" from "what the exam currently looks like," which is the only way to make version locking (8.5) and safe editing (9.6) both work without special-casing.

**As Backend Engineer:** The transaction boundaries in Section 9 are deliberately explicit and step-numbered rather than described abstractly — this is meant to be directly translatable into `prisma.$transaction([...])` blocks during implementation with minimal reinterpretation.

**As API Designer:** Cursor pagination (5.4) and mandatory `Idempotency-Key` on submit/approve actions (5.8) were chosen specifically because this system has two genuinely retry-prone flows (autosave under flaky mobile networks, and exam submission at time-pressure deadlines) — generic REST advice doesn't always mandate idempotency keys, but this domain does.

**As Security Engineer:** The service-to-service auth boundary for the parser callback (6.5, 14) was added as a deliberate gap-fill — an internal-only endpoint that accepts writes to `ParserJob` status must not be reachable via a normal user session, and must not be a wide-open unauthenticated endpoint either.

**As DevOps Engineer:** No Redis / no new infra dependency at MVP (13.5) keeps the ₹0-budget deployment story intact (Supabase + a single Next.js + a single FastAPI container) — future infra (Sec. 16) is scoped to slot in without a rearchitecture.

**As QA Engineer:** The single-active-attempt constraint (3.12, 8.6) is enforced at the database level (partial unique index), not just application logic — meaning a race condition (two near-simultaneous `POST /attempts` calls) fails safely at the DB layer even if an application-layer race-condition bug slipped through; this is exactly the kind of guarantee that's cheap to test for (concurrent-request test case) and expensive to get wrong in production.

**Improvements made during review:** made the parser-callback authentication explicit as its own security boundary rather than assuming it inherits normal session auth; clarified that `Question`/`Option` "exactly 4" and "exactly 1 correct" constraints are intentionally application-layer (not DB triggers) to stay within the Minimal Dependencies principle, with the tradeoff stated explicitly; added the partial unique index detail for single-active-attempt so it's a testable, DB-enforced guarantee rather than an application-only convention; clarified that Review Approval (9.5) writes both the `jsonb` snapshot and normalized relational rows, since both are needed (fast attempt reads vs. relational reporting) and this wasn't obvious from the ERD alone.
