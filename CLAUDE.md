# CLAUDE.md — ExamForge Engineering Standards

**Permanent instruction set for all coding sessions. Read first, write code second.**

---

## 1. Project Rules

### 1.1 Scope Boundaries (Locked)

| In Scope (v0)                                     | Out of Scope (v0)                                   |
| ------------------------------------------------- | --------------------------------------------------- |
| JEE Main MCQ only                                 | NEET, CUET, CBSE, other formats                     |
| Rule-based parser + manual review                 | AI/LLM extraction (local or cloud)                  |
| Single admin + invited students                   | Public registration, billing, multi-tenant          |
| Admin dashboard, CBT engine, results              | Analytics, topic analysis, difficulty prediction    |
| ₹0 budget: Vercel + Railway + Supabase free tiers | Redis, paid APIs, managed services beyond free tier |

**Rule:** If a feature is not in the PRD (01-PRD.md), it does not exist. Do not implement it. Do not design for it.

### 1.2 Architecture Decisions (Locked)

| ADR     | Decision                                       | Do Not Revisit Without Explicit Approval  |
| ------- | ---------------------------------------------- | ----------------------------------------- |
| ADR-001 | Monorepo: Next.js + FastAPI, deployed together | Splitting repos requires migration plan   |
| ADR-002 | JEE Main only, pluggable parser interface      | Adding formats = new parser plugin only   |
| ADR-003 | **Better Auth** (not Auth.js, not Clerk)       | Auth library changes require ADR update   |
| ADR-004 | Rule-based parser + manual review gate         | Local LLM slot designed in, not built     |
| ADR-005 | Immutable `ExamVersion` snapshots              | Attempts pinned to version forever        |
| ADR-006 | No Redis in v0; exam state in Postgres         | Redis = scale trigger, not v0 requirement |
| ADR-007 | Supabase Postgres only (not Supabase Auth)     | Keep auth vendor-neutral via Better Auth  |

### 1.3 Non-Negotiables

- **No placeholder implementations** — every feature production-ready or explicitly marked TODO with owner/date
- **No duplicate code** — extract shared logic to `packages/` or feature `lib/`
- **No unnecessary abstractions** — solve the problem at hand; generalize when the second use case appears
- **Strict TypeScript** — `strict: true`, no `any` without `// @ts-expect-error` + comment
- **Security by default** — every input validated, every query parameterized, every endpoint authorized

---

## 2. Coding Standards

### 2.1 TypeScript (apps/web)

```typescript
// tsconfig.json enforced rules
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "forceConsistentCasingInFileNames": true,
  "noPropertyAccessFromIndexSignature": false
}
```

**Patterns:**

- Feature-first organization: `src/features/{exams,questions,attempts,auth}/`
- Server-only code in `src/server/` — never imported by client components
- API routes use `Zod` schemas for request validation (never trust client)
- React Server Components by default; `'use client'` only when necessary (interactivity, browser APIs)
- Component props: explicit interfaces, no `React.FC`, children typed as `React.ReactNode`

**Forbidden:**

```typescript
// ❌ Never
any, unknown (without narrowing), @ts-ignore (without comment)
dangerouslySetInnerHTML, eval, Function constructor
console.log in production code (use structured logger)
```

### 2.2 Python (apps/doc-processor)

```toml
# pyproject.toml enforced via ruff + mypy
[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "I", "UP", "B", "C4", "SIM", "TID", "ARG", "PTH", "ERA", "PD", "PGH", "PL", "TRY", "NPY", "RSE", "RET", "FLY", "TCH", "PT", "REF"]

[tool.mypy]
strict = true
warn_unused_ignores = true
disallow_untyped_defs = true
```

**Patterns:**

- Pydantic models for all API boundaries (request/response, parser output)
- `async def` for I/O; sync for CPU-bound parsing/OCR
- Dependency injection via constructor for testability
- Structured logging: `structlog` with correlation IDs

### 2.3 Database (packages/db)

- Prisma schema is **source of truth** — never edit SQL directly
- Migrations: `prisma migrate dev` (local), `prisma migrate deploy` (CI/prod)
- All models: `id` = UUID, `createdAt`/`updatedAt`, soft delete via `deletedAt` where specified
- Enums in Prisma (DB-level) for closed sets: `Role`, `AttemptStatus`, `ParserStatus`, etc.

### 2.4 Shared Types (packages/shared-types)

- Generated from Prisma + FastAPI OpenAPI spec
- **Single source of truth** for web ↔ processor contract
- Versioned; breaking changes require major version bump

---

## 3. Architecture Rules

### 3.1 Layer Boundaries

```
apps/web (Next.js)
├── src/app/                    # Routes (App Router)
├── src/features/{domain}/      # Feature modules
│   ├── components/             # UI components (client)
│   ├── lib/                    # Client utilities, hooks
│   ├── actions/                # Server Actions (mutations)
│   └── queries/                # Server data fetching (RSC)
├── src/components/             # Shared UI primitives
├── src/lib/                    # Cross-feature: auth-client, api-client, utils
└── src/server/                 # SERVER-ONLY
    ├── services/               # Business logic
    ├── repositories/           # Data access (Prisma)
    └── auth/                   # AuthService interface

apps/doc-processor (FastAPI)
├── app/api/                    # HTTP routes
├── app/pipeline/               # Orchestration
├── app/parsers/                # Plugin implementations
├── app/ocr/                    # OCR engine
└── app/schema/                 # Pydantic models (shared output contract)
```

**Rules:**

- `apps/web/src/server/` **never** imported by client code — enforced by `server-only` package
- `apps/web` talks to `apps/doc-processor` **only** via HTTP API (shared types)
- `apps/doc-processor` **never** imports Next.js code
- Database access **only** via Prisma in `repositories/` — no raw SQL in services

### 3.2 Parser Plugin Interface (Locked)

```python
# apps/doc-processor/app/parsers/base.py
from abc import ABC, abstractmethod
from app.schema.json_schema import ParsedExam, ParsedQuestion

class ExamParser(ABC):
    @abstractmethod
    def detect(self, raw_text: str) -> bool: ...

    @abstractmethod
    def parse(self, raw_text: str) -> ParsedExam: ...

    @abstractmethod
    def confidence(self, parsed: ParsedExam) -> float: ...

    @abstractmethod
    def describe(self) -> ParserMetadata: ...
```

**Adding a format = new module implementing `ExamParser` — zero changes to pipeline/core.**

### 3.3 State Management (Exam Attempt)

| Layer               | Responsibility                                                  |
| ------------------- | --------------------------------------------------------------- |
| Client (React)      | Optimistic UI, local state, keyboard shortcuts                  |
| Server (Next.js)    | `AttemptResponse` upsert per action, server-authoritative timer |
| Database (Postgres) | Source of truth; `expiresAt` drives auto-submit job             |

**Never** trust client timer. **Never** store exam state in Redis (v0).

### 3.4 Versioning Strategy

- `ExamVersion.snapshotJson` = immutable JSON at publish (source of truth for attempts)
- Parser output versioned via `schemaVersion` in JSON
- API versioned via `/api/v1/` prefix — v2 = new route tree

---

## 4. Security Rules

### 4.1 Input Validation (Every Boundary)

| Boundary            | Tool                      | Rule                                     |
| ------------------- | ------------------------- | ---------------------------------------- |
| API route (Next.js) | Zod schema                | Validate body, query, params, headers    |
| Server Action       | Zod schema                | Same as API                              |
| FastAPI endpoint    | Pydantic model            | Validate request/response                |
| Database            | Prisma                    | Parameterized queries only               |
| File upload         | Magic bytes + MIME + size | Never trust extension/Content-Type alone |

### 4.2 Authentication & Authorization

```typescript
// apps/web/src/features/auth/auth-service.ts
// SINGLE AUTHORITY — all auth checks go through this
export const authService = {
  getSession(): Promise<Session | null>,
  requireRole(role: 'ADMIN' | 'REVIEWER' | 'STUDENT'): Promise<Session>,
  requireOwnership(resource: { userId: string }): Promise<void>,
};
```

**Rules:**

- Every API route / Server Action calls `authService.requireRole()` or `requireOwnership()`
- Never trust client-sent role/userId — always re-verify from session
- RBAC enforced at **query layer** (WHERE clauses), not just UI hiding

### 4.3 File Upload Security

```python
# apps/doc-processor/app/pipeline/validation.py
ALLOWED_MIME = {"application/pdf"}
MAX_SIZE = 25 * 1024 * 1024  # 25MB
MAGIC_BYTES = b"%PDF-"

def validate_pdf(file_bytes: bytes) -> ValidationResult:
    # 1. Magic bytes
    # 2. Size limit
    # 3. PDF structure parse (PyMuPDF) — reject corrupted/encrypted
    # 4. Page count <= 60
    # 5. At least one page with question-like content
```

### 4.4 Secrets Management

- `.env` files **never committed** (`.gitignore` enforced)
- `.env.example` maintained with all required keys
- Production secrets: Vercel / Railway / Supabase dashboards only
- Service-to-service auth: shared secret (parser callback), rotated via env

### 4.5 Logging & Audit

```typescript
// Structured logging — never log:
const DENYLIST = ['password', 'token', 'secret', 'hash', 'cookie', 'authorization'];

// Audit log every sensitive mutation:
// EXAM_PUBLISHED, REVIEW_APPROVED, ROLE_CHANGED, ATTEMPT_SUBMITTED, USER_DELETED
```

---

## 5. Development Workflow

### 5.1 Branch Strategy

```
main (protected, deploy to prod)
  │
  ├── feature/{short-description}  (short-lived, 1-3 days)
  │
  └── fix/{issue-description}      (hotfixes only)
```

- **No long-running feature branches** — merge to main daily
- **PR required** for all changes to `main` (even solo)
- **Squash merge** — clean history

### 5.2 Commit Messages

```
<type>(<scope>): <imperative summary>

<body: what & why, not how>

Refs: #<issue-number>
```

**Types:** `feat`, `fix`, `refactor`, `perf`, `security`, `docs`, `test`, `chore`, `build`
**Scopes:** `auth`, `exams`, `questions`, `attempts`, `parser`, `ocr`, `ui`, `db`, `infra`

### 5.3 Local Development

```bash
# One command starts everything
make dev
# Starts: Next.js (3000), FastAPI (8000), Prisma Studio (5555), maildev (1080 if needed)
```

### 5.4 Pre-Commit (Husky + lint-staged)

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.py": ["ruff check --fix", "ruff format"],
  "prisma/schema.prisma": ["prisma format"],
  "*.{json,md,yml}": ["prettier --write"]
}
```

### 5.5 CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
jobs:
  lint-typecheck:
    - eslint, prettier
    - prettier:
    - tsc --noEmit:
    - ruff check:
    - mypy:
  test:
    - vitest (web)
    - pytest (doc-processor)
    - prisma validate:
  build:
    - next build:
    - docker build (doc-processor):
  contract:
    - generate shared types from OpenAPI:
    - verify web types match processor types:
```

---

## 6. Definition of Done (Per Task)

A task is **not complete** until **ALL** apply:

| Category          | Criteria                                                                             |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Functionality** | Feature works end-to-end per spec; edge cases handled                                |
| **Tests**         | Unit tests for logic (≥80% coverage on new code); integration test for API endpoints |
| **Types**         | Zero TypeScript errors; zero mypy errors; shared types generated and match           |
| **Lint**          | Zero ESLint/Ruff warnings on new/modified files                                      |
| **Security**      | Input validated; auth checked; no secrets in code; audit logged if sensitive         |
| **Accessibility** | Keyboard operable; ARIA labels; focus visible; contrast AA+                          |
| **Documentation** | Component/API documented per UI/UX §20 rule #8; README updated if needed             |
| **Performance**   | Meets UI/UX §16 budgets; no N+1 queries; bundle size impact noted                    |
| **Review**        | Self-reviewed against Code Review Checklist (§7); PR approved                        |

**No exceptions.** "I'll fix it later" = not done.

---

## 7. Code Review Checklist

### 7.1 Correctness

- [ ] Does the code do what the spec requires? (Trace to PRD/TRD/UI-UX section)
- [ ] Are edge cases handled? (empty states, errors, race conditions, offline)
- [ ] Is the happy path tested? Are failure paths tested?
- [ ] No logic in components that belongs in services/repositories?

### 7.2 Architecture

- [ ] Layer boundaries respected? (server/client, web/processor, feature/shared)
- [ ] No circular dependencies?
- [ ] Parser plugin interface unchanged? (new parser = new module only)
- [ ] Shared types used for cross-service contracts?

### 7.3 Security

- [ ] All inputs validated at boundary (Zod/Pydantic)?
- [ ] Auth/authorization checked server-side?
- [ ] No raw SQL / string interpolation in queries?
- [ ] File uploads validated (magic bytes, size, type)?
- [ ] No secrets in code, logs, or client bundle?
- [ ] Audit log written for sensitive actions?

### 7.4 Quality

- [ ] TypeScript strict mode clean? Python mypy clean?
- [ ] No `any`, `@ts-ignore`, `# type: ignore` without justification comment?
- [ ] DRY — no duplicated logic (check `lib/`, `server/services/`, parser utils)?
- [ ] KISS — no over-engineering, no premature abstraction?
- [ ] SOLID — single responsibility, open/closed for parser plugins?

### 7.5 UI/UX (apps/web)

- [ ] Tokens only — no hardcoded colors/spacing/durations (UI/UX §20 rule #1)?
- [ ] Theme-blind components (UI/UX §20 rule #2)?
- [ ] All 8 interaction states implemented (UI/UX §9)?
- [ ] Accessibility: focus ring, ARIA, keyboard, 200% zoom (UI/UX §12)?
- [ ] Reduced motion respected (UI/UX §3.5)?
- [ ] Component documented per UI/UX §20 rule #8?

### 7.6 Performance

- [ ] No N+1 queries (Prisma `include`/`select` used correctly)?
- [ ] CBT attempt reads from `snapshotJson` not live joins?
- [ ] Bundle size impact acceptable?
- [ ] Animations use `motion-*` tokens, respect `prefers-reduced-motion`?

### 7.7 Maintainability

- [ ] Variable/function names descriptive (no `data`, `info`, `handle`, `util`)?
- [ ] Comments explain _why_, not _what_?
- [ ] Complex logic has unit tests with descriptive names?
- [ ] Migration needed? Prisma migration file included and reviewed?

---

## 8. Tooling Commands

```bash
# Development
make dev              # Start all services
make dev:web          # Next.js only
make dev:processor    # FastAPI only

# Database
make db:push          # Prisma db push (dev)
make db:migrate       # Prisma migrate dev
make db:studio        # Prisma Studio
make db:seed          # Seed dev data

# Code Quality
make lint             # ESLint + Ruff
make typecheck        # tsc + mypy
make format           # Prettier + Ruff format
make test             # Vitest + Pytest
make test:watch       # Watch mode

# Shared Types
make types:generate   # Generate from Prisma + OpenAPI
make types:verify     # Verify web/processor types match

# Build/Deploy
make build            # Production build both apps
make docker:build     # Build doc-processor image
make deploy:preview   # Deploy preview (Vercel/Railway)

# Parser Development
make parser:test      # Run golden-file tests
make parser:golden    # Regenerate golden files (review required!)
```

---

## 9. Reference Documents (Read-Only)

| Document                    | Purpose                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| `01-PRD.md`                 | Product requirements — source of truth for _what_                           |
| `02-TRD.md`                 | Technical requirements — source of truth for _how_                          |
| `03-UI-UX.md`               | Design system, components, flows — source of truth for _look/feel_          |
| `04-Document-Processing.md` | Parser pipeline, OCR, confidence, review — source of truth for _extraction_ |
| `05-Database-API.md`        | Schema, API contracts, transactions — source of truth for _data/API_        |
| `ARCHITECTURE-REVIEW.md`    | Cross-doc analysis, risks, roadmap — context for decisions                  |

**When in doubt, check the spec. Never guess.**

---

## 10. Escalation Path

| Situation                   | Action                                                           |
| --------------------------- | ---------------------------------------------------------------- |
| Spec ambiguity / conflict   | Stop. Ask user. Document decision in ADR log.                    |
| Security concern discovered | Stop. Fix immediately. Document in audit log.                    |
| Performance budget exceeded | Profile first. Optimize. If architectural, escalate.             |
| Scope creep detected        | Reject. Point to PRD non-goals. Create follow-up issue if valid. |
| Blocker > 2 hours           | Ask user. Don't spin.                                            |

---

_This document is the contract. If a practice isn't here, it's not required. If it conflicts with a spec, the spec wins (and this doc needs updating)._
