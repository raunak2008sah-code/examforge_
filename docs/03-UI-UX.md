# 03 — UI/UX Specification

**Project:** ExamForge _(temporary name)_
**Status:** Draft v0.2 — expanded for implementation readiness
**Depends on:** `01-PRD.md` (locked), `02-TRD.md` (locked)
**Scope:** JEE Main, MCQ-only, single admin, invited students (per PRD §3)

---

## 1. UX Principles

The fundamental interaction philosophy every decision below must trace back to:

| Principle                    | Statement                                                                                                                     | Test to apply when in doubt                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Disappearing interface       | The UI's job is to be forgotten within the first exam attempt                                                                 | "Would a student remember this element, or only the question?"                 |
| Server truth, client comfort | The client is always allowed to _feel_ instant; it is never allowed to _be_ authoritative                                     | "If the server disagreed with what's on screen right now, who would be right?" |
| Stability over novelty       | A control's position, label, and behavior never change once a student has learned it                                          | "Did anything move that the student didn't move themselves?"                   |
| One decision at a time       | Every screen asks the user to do exactly one thing                                                                            | "Could this screen be split into two without losing anything?"                 |
| Recoverable by default       | Nothing the student does — refresh, close, lose signal — should ever require support intervention                             | "Does this fail safe, silently, and resumably?"                                |
| Honest states                | Every screen tells the truth about what is happening (loading, empty, broken, offline) rather than hiding it behind a spinner | "Would a confused user know what to do next from this screen alone?"           |
| Accessibility is not a mode  | Keyboard, screen-reader, and high-contrast paths are the same paths everyone uses, not a parallel "accessible version"        | "Does this only work with a mouse?"                                            |

These principles resolve every ambiguity in the sections that follow; where a later rule seems to conflict with one of these, the principle wins.

---

## 2. Design Philosophy

**Guiding principle:** the interface disappears. Students notice questions, not chrome.

| Principle                         | What it means here                                                         | What it rules out                              |
| --------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------- |
| Calm authority                    | Looks like infrastructure a serious exam runs on                           | Playful illustration, mascots, marketing gloss |
| Reading comfort first             | Every choice is filtered through "is this legible at hour 2.5?"            | Trend-driven color/motion choices              |
| Zero surprise                     | Controls stay where the student last saw them                              | Reflowing layouts, adaptive/AI-suggested UI    |
| Server is truth, UI is optimistic | UI reflects intent instantly, reconciles silently                          | Blocking spinners on every click               |
| One idea per screen               | Admin review, exam config, and CBT are three distinct modes, never blended | Dashboards that try to do everything at once   |

**Reference points:** Linear (density + restraint), Stripe (form and data clarity), Apple (typographic hierarchy), Notion (calm neutrals), Vercel (dark-mode discipline). **Explicitly not:** NTA/government CBT portals (dense, small, harsh contrast, tiny click targets) — the workflow stays familiar, the visual language does not.

---

## 3. Design Token System

All visual values in the product are tokens, not hardcoded values — this is what makes §4's theming and §20's implementation rules possible. Tokens are grouped by concern below.

### 3.1 Color Tokens

Backgrounds avoid pure white; text avoids pure black. All pairs meet WCAG AA at minimum; primary text pairs meet AAA.

| Token                 | Light                                                   | Dark      | Usage                                           |
| --------------------- | ------------------------------------------------------- | --------- | ----------------------------------------------- |
| `bg-canvas`           | `#F7F6F3`                                               | `#15171A` | Page background                                 |
| `bg-surface`          | `#FFFFFF` (small elevated cards only, never full-bleed) | `#1C1F23` | Cards, panels, modals                           |
| `bg-sunken`           | `#EFEEEA`                                               | `#111315` | Palette rail, sidebars                          |
| `text-primary`        | `#1E2124`                                               | `#EDEBE7` | Body, question text (contrast ≈14.8:1 / 13.9:1) |
| `text-secondary`      | `#54595F`                                               | `#A6ACB3` | Meta text, helper copy                          |
| `border-subtle`       | `#E4E2DC`                                               | `#2A2D31` | Dividers, input borders                         |
| `brand-primary`       | `#2B3A67`                                               | `#7C8FCB` | Primary actions, links, focus ring base         |
| `brand-primary-hover` | `#233056`                                               | `#93A4D6` | Hover/active                                    |
| `accent-amber`        | `#A6790C`                                               | `#D9A441` | Marked-for-review, warnings only                |
| `state-success`       | `#1F7A4D`                                               | `#4FBE86` | Correct, published                              |
| `state-error`         | `#B3261E`                                               | `#E5847C` | Incorrect, destructive, validation errors       |
| `state-info`          | `#3B6EA5`                                               | `#8FB4DE` | Neutral notices, syncing                        |
| `timer-calm`          | `text-secondary` on `bg-sunken`                         | same      | Timer, >10% remaining                           |
| `timer-urgent`        | `#B3261E` on `bg-sunken`                                | `#E5847C` | Timer, final 10% — static swap, never flashing  |

**Question status colors** (fixed semantics, never repurposed): Not visited (`bg-sunken`/`border-subtle`), Not answered (muted `#C75C55`), Answered (`state-success`), Marked (`accent-amber`), Answered+Marked (`accent-amber` fill + success dot). Color is never the only signal — every status also carries a shape/icon per §3.8, and is announced per §12.

### 3.2 Typography Tokens

| Role                            | Typeface                                              | Why                                                  |
| ------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| UI + body                       | **Inter** (variable)                                  | Legible at small sizes, distinguishes `0/O`, `1/I/l` |
| Question / long reading         | **Source Serif 4**, 17–18px, user-toggleable to Inter | Reduces fatigue over 2–3hr sessions                  |
| Numerals — timer, index, scores | **IBM Plex Mono**, tabular figures                    | Fixed-width digits — zero layout shift               |
| Math                            | KaTeX (client-side, no API call)                      | Crisp at any zoom, MathML for screen readers         |

| Token             | Size / line-height       | Use                     |
| ----------------- | ------------------------ | ----------------------- |
| `text-display`    | 28px / 1.3               | Admin page titles       |
| `text-h1`         | 22px / 1.4               | Section headers         |
| `text-h2`         | 18px / 1.4               | Card/panel titles       |
| `text-question`   | 18px / 1.7               | Question stem           |
| `text-body`       | 16px / 1.6               | Default UI, options     |
| `text-meta`       | 14px / 1.5               | Timestamps, helper text |
| `text-mono-timer` | 20px / 1.2, tabular-nums | Countdown               |
| `text-mono-index` | 14px / 1.2, tabular-nums | Palette numbers         |

Line length capped at `65ch` for question text and long-form admin content.

### 3.3 Spacing, Radius, Elevation

| Token         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| `space-1..8`  | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px (4px grid)                                       |
| `radius-sm`   | 6px — buttons, inputs                                                                  |
| `radius-md`   | 10px — cards, modals                                                                   |
| `radius-full` | pill — status chips                                                                    |
| `elevation-0` | none — flat surfaces (default state for most components)                               |
| `elevation-1` | `0 1px 2px rgba(0,0,0,.06)` — cards                                                    |
| `elevation-2` | `0 4px 16px rgba(0,0,0,.10)` — modals/popovers (ceiling — nothing above this anywhere) |

### 3.4 Opacity, Z-Index, Blur

| Token                     | Value                      | Use                                                                                  |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `opacity-disabled`        | 0.45                       | Disabled controls (paired with `cursor: not-allowed`, never opacity alone — see §12) |
| `opacity-hover-overlay`   | 0.06 (light) / 0.10 (dark) | Hover tint over interactive surfaces                                                 |
| `opacity-pressed-overlay` | 0.12 (light) / 0.16 (dark) | Active/pressed tint                                                                  |
| `opacity-scrim`           | 0.40                       | Modal/sheet backdrop                                                                 |
| `blur-scrim`              | 4px                        | Backdrop blur behind modals only — never behind the CBT question column              |
| `z-base`                  | 0                          | Page content                                                                         |
| `z-sticky`                | 10                         | Sticky headers, palette rail                                                         |
| `z-dropdown`              | 20                         | Menus, comboboxes                                                                    |
| `z-overlay-scrim`         | 30                         | Modal/sheet backdrop                                                                 |
| `z-modal`                 | 40                         | Modal/sheet content                                                                  |
| `z-toast`                 | 50                         | Toasts — always above modals so save-confirmation is never hidden                    |
| `z-tooltip`               | 60                         | Tooltips — always topmost                                                            |

### 3.5 Motion Tokens

| Token                 | Value                                                                                         | Use                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `motion-instant`      | 0ms                                                                                           | State that must never animate (timer digits, palette cell status swap) |
| `motion-fast`         | 120ms ease-out                                                                                | Hover, focus, small toggles                                            |
| `motion-base`         | 160ms ease-out                                                                                | Tab changes, dropdown open                                             |
| `motion-modal`        | 180ms ease-out (opacity+scale 0.98→1)                                                         | Modal/sheet enter; exit at `motion-fast`                               |
| `motion-route`        | 100ms fade                                                                                    | Page/route transition — no slide/zoom choreography                     |
| Reduced motion        | All of the above → `0ms`, opacity crossfade only, when `prefers-reduced-motion: reduce`       | No exceptions                                                          |
| Disallowed everywhere | Auto-play animation, parallax, shimmer >400ms, confetti/celebration on exam or result screens | —                                                                      |

### 3.6 Focus Rings & Overlays

| Token                  | Value                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `focus-ring`           | 2px solid `brand-primary`, 2px offset, visible on **every** focusable element without exception |
| `focus-ring-on-dark`   | 2px solid `brand-primary` (dark value), same offset                                             |
| `overlay-scrim-color`  | `#000000` at `opacity-scrim`, blurred at `blur-scrim`                                           |
| `overlay-sheet-radius` | `radius-md`, top corners only (mobile bottom sheets)                                            |

`outline: none` is never shipped without an equivalent-or-stronger visible replacement — this is a lint-enforced rule, see §20.

### 3.7 Scrollbar & Container Widths

| Token                     | Value                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scrollbar-width`         | 10px, thumb `border-subtle`, track transparent — styled consistently cross-browser (`scrollbar-width: thin` + WebKit fallback), never the OS default inside the CBT palette rail |
| `container-admin`         | max-width 1120px, centered, `space-6` side padding                                                                                                                               |
| `container-exam-question` | max-width 65ch content, column itself flexes to ~70% of viewport ≥1280px                                                                                                         |
| `container-form`          | max-width 480px — login, single-field forms                                                                                                                                      |
| `container-modal`         | max-width 520px (confirm dialogs) / 720px (editors)                                                                                                                              |

### 3.8 Icon System

| Decision                                                   | Value                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library                                                    | **Lucide** (open-source, MIT, tree-shakeable, matches Inter's geometric neutrality — no mixed icon styles)                                                                                                                                                                                                                                                                                           |
| Sizes                                                      | `icon-sm` 16px (inline with `text-meta`), `icon-md` 20px (buttons, form fields — default), `icon-lg` 24px (empty states, section headers)                                                                                                                                                                                                                                                            |
| Stroke                                                     | 1.75px consistently — never mix stroke weights on one screen                                                                                                                                                                                                                                                                                                                                         |
| Color                                                      | Icons inherit `currentColor`; never independently colored except semantic status icons (success/error/warning use their state token)                                                                                                                                                                                                                                                                 |
| Semantic mapping (fixed, never reused for another meaning) | `Clock` → timer only · `Circle`/`CircleDot` → palette not-answered/answered · `Flag` → marked for review · `AlertTriangle` → warnings/validation · `AlertOctagon` → destructive/error only · `WifiOff` → offline/sync failure · `Check`/`CheckCircle2` → success/saved · `Lock` → permission denied · `RefreshCw` → syncing/retry (animated only while actually retrying, respecting reduced-motion) |
| Decorative vs. semantic                                    | Decorative icons get `aria-hidden="true"`; semantic/status-only icons (no adjacent text) get an `aria-label`                                                                                                                                                                                                                                                                                         |

---

## 4. Theme Architecture

Themes are **token substitution only** — no component ever branches its logic or markup per theme; every component reads CSS custom properties, and a theme is nothing more than a value map applied at the document root. This is what makes adding a future institutional theme a config change, not a code change.

```
:root[data-theme="light"]     { --bg-canvas: #F7F6F3; --text-primary: #1E2124; ... }
:root[data-theme="dark"]      { --bg-canvas: #15171A; --text-primary: #EDEBE7; ... }
:root[data-theme="exam"]      { extends light; locks font-size scale; disables user-resizable panels }
:root[data-theme="hc"]        { extends light or dark; contrast ratios pushed to AAA everywhere; status
                                  color deltas widened; icons gain outlines }
:root[data-theme="institution-*"] { future — brand-primary + logo swap only, all other tokens inherited }
```

| Theme                        | Purpose                                                                                   | v0 status                                 | Key differences from Light                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Light**                    | Default everywhere                                                                        | Shipped                                   | Baseline (§3.1)                                                                                                                                                                                                                                                                                                                 |
| **Dark**                     | Reduce glare in low-light rooms; admin preference                                         | Shipped (tokens defined end-to-end, §3.1) | Full dark palette, no separate component variants needed                                                                                                                                                                                                                                                                        |
| **Exam Mode**                | Applied automatically during an active attempt, on top of the student's Light/Dark choice | Shipped                                   | Not a color theme — a _behavioral_ overlay: hides all non-exam chrome, disables browser-zoom-breaking layouts (locks to the responsive rules in §14), disables theme-switching mid-attempt (prevents a jarring repaint during a timed session — student picks Light/Dark on the instructions page, it's frozen for the attempt) |
| **High Contrast**            | Accessibility                                                                             | Shipped, manual toggle (§12)              | Wider contrast deltas, thicker focus rings (3px), icons gain outline strokes, status color pairs re-tuned for the most common forms of color-blindness                                                                                                                                                                          |
| **Institutional** _(future)_ | White-label for coaching institutes (PRD "Vision", not v0)                                | Not built                                 | Only `brand-primary` + logo token change; explicitly must not require touching component code — validates the token architecture now                                                                                                                                                                                            |

**Rule:** if implementing any future theme requires editing a component file rather than a token file, the component was built wrong per §20.

---

## 5. Information Architecture

```
ExamForge
├── /login                                (shared, role-detected)
│
├── Admin  (/admin/...)
│   ├── /admin                            Dashboard — exam list
│   ├── /admin/exams/new                  Upload wizard
│   ├── /admin/exams/[id]/review           Parsed-question review/edit
│   ├── /admin/exams/[id]/questions/[qid]  Single-question editor
│   ├── /admin/exams/[id]/configure        Duration, marking, instructions
│   ├── /admin/exams/[id]/publish          Pre-publish checklist + confirm
│   ├── /admin/exams/[id]/monitor          Live attempt status (read-only, v0-lite)
│   ├── /admin/students                    Invited-student management
│   └── /admin/audit-log                   Security/audit trail viewer
│
└── Student  (/...)
    ├── /                                  Dashboard — available exams
    ├── /exams/[id]/instructions           Pre-exam instructions + declaration
    ├── /exams/[id]/attempt                 Full CBT interface (Exam Mode, locked chrome)
    ├── /exams/[id]/submit-confirm          Submit confirmation (modal, not a route in spirit)
    └── /attempts/[attemptId]/result        Score + full review
```

**Navigation model:** Admin uses a persistent left rail (dashboard-style). Student has **no persistent nav during an exam** — Exam Mode (§4) is a locked, full-viewport mode. Outside an exam, students get a single top bar (logo, name, logout).

---

## 6. User Flows

### 6.1 Admin: PDF → Published Test

```
Dashboard ──"New Exam"──> Upload Wizard
   │                         │ (question PDF + answer key PDF)
   │                         ▼
   │                    Processing (async, polled status)
   │                         │
   │              ┌──────────┴──────────┐
   │         confidence OK         confidence LOW
   │              │                      │
   │              ▼                      ▼
   │        Review Screen  <──────  Review Screen
   │        (low-confidence rows sorted first)
   │              │
   │   inline edit / manual add / delete
   │              ▼
   │        Configure (duration, marks, negative marking, instructions)
   │              ▼
   │        Pre-publish checklist (blocking issues must clear)
   │              ▼
   │           Publish ──> Dashboard (status: Published)
```

**Key rule:** Admin can never publish while any question has `correct_option_label = null` or any P0 validation error — Publish stays disabled with an inline reason.

### 6.2 Student: Take the CBT

```
Dashboard (exam card: Not started / Resume / Completed)
      ▼
Instructions page ── scroll to bottom + declaration checkbox ── "Start Exam" enabled
      ▼
CBT Interface (Exam Mode, locked chrome)
   - Answer / Clear / Mark for Review / Save & Next / navigate via palette
   - autosave on every action
      │
      ├── manual Submit ──> Confirm modal (unanswered count) ──> Result
      └── timer hits 0 ──> auto-submit banner (non-dismissable) ──> Result
```

**Recovery sub-flow (any point):** refresh / crash / reopen tab → server returns current attempt state → CBT re-renders exactly where the student left off. No "are you sure" — resuming is the invisible default.

---

## 7. Screen Specifications

### 7.1 Login (`/login`)

Single centered card (`container-form`), on `bg-canvas`. Email + password. No self-registration link. Error states inline below the field, not a toast. Rate-limit lockout shows remaining wait time, not a generic message.

### 7.2 Admin Dashboard (`/admin`)

| Region      | Content                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| Left rail   | Exams, Students, Audit Log                                               |
| Header      | "Exams" + primary button "New Exam"                                      |
| Body        | Table: Title · Status chip · Questions · Last edited · Actions           |
| Empty state | "No exams yet. Upload a question paper to create your first test." + CTA |

### 7.3 Upload Wizard (`/admin/exams/new`)

3-step linear wizard, static label list (no animated stepper):

1. **Files** — two drop zones: Question Paper (required), Answer Key (required). Client-side magic-byte pre-check before upload starts.
2. **Details** — exam title, source/year.
3. **Confirm & Process** — submits, redirects to processing status (stage labels: Detecting layout → Extracting text → Parsing questions → Ready for review — no fake percentage bar).

### 7.4 Review Screen (`/admin/exams/[id]/review`) — most important admin screen

| Region              | Behavior                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Left: question list | Confidence dot per row, low-confidence sorted first (toggle to paper order)                     |
| Right: editor panel | Stem (math-rendered live), 4 options, correct-answer selector, confidence score, raw-OCR toggle |
| Top bar             | Progress "42 of 90 reviewed" · filter chips                                                     |
| Footer              | "Add question manually", "Continue to Configure" (disabled until all reviewed)                  |

Editing never silently "auto-confirms" — a separate explicit "Mark reviewed" checkbox exists per row.

### 7.5 Configure (`/admin/exams/[id]/configure`)

Single-column form, cards: **Timing**, **Marking Scheme** (explicit numeric fields, no hidden defaults), **Instructions** (rich text, shown verbatim to students), **Access** (invited students).

### 7.6 Publish (`/admin/exams/[id]/publish`)

Checklist: all questions reviewed · all have resolved answers · duration/marking set · ≥1 student has access. Publish disabled until all pass. Plain confirmation copy, no dark-pattern friction.

### 7.7 Student Dashboard (`/`)

Card grid (1 col mobile, 2–3 col desktop). Card: title, duration, question count, status button (Start / Resume / View Result). Nothing else competes for attention.

### 7.8 Instructions Page (`/exams/[id]/instructions`)

Admin-authored instructions + fixed system block (controls explained, marking scheme table, declaration checkbox). "Start Exam" disabled until scrolled-to-end + checked. This is also where the student's Light/Dark preference is locked in for the attempt (§4, Exam Mode).

### 7.9 The CBT Interface (`/exams/[id]/attempt`) — the core screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ExamForge · <Exam Title>                    ⏱ 01:42:18   [≡]   │  ← header, 56px, fixed
├───────────────────────────────────────────────┬─────────────────┤
│                                                 │  Question 23/90 │
│   Q23.  <question stem, KaTeX-rendered>        │  ┌─┬─┬─┬─┬─┬─┐  │
│                                                 │  │1│2│3│4│5│6│  │
│   ○ A. option text                             │  ├─┼─┼─┼─┼─┼─┤  │
│   ○ B. option text                             │  │7│8│9│…    │  │
│   ○ C. option text                             │  └─┴─┴─┴─┴─┴─┘  │
│   ○ D. option text                             │  ■Ans12 ■NotAns3│
│                                                 │  ■Marked2 ■NV73│
│  [Clear Response]      [Mark for Review & Next] │                 │
│  [◄ Previous]  [Save & Next ►]                  │                 │
└─────────────────────────────────────────────────┴─────────────────┘
  Left ~70%: question column (container-exam-question)   Right ~30%: fixed palette rail
```

| Region            | Rule                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header            | Fixed, `z-sticky`, never scrolls away. Timer always same pixel position. `[≡]` opens overlay: Instructions (read-only), Submit Exam, high-contrast toggle |
| Question column   | Only the current question — no infinite scroll                                                                                                            |
| Palette rail      | Always visible desktop/laptop/tablet; slide-up sheet on narrow viewports (§14, §15)                                                                       |
| Buttons           | Fixed position, same pixels every question                                                                                                                |
| Syncing indicator | Calm text next to timer: "Saved" / "Saving…" — never a modal                                                                                              |

**Zero layout shift guarantee:** reserved `min-height` for stem area; fixed palette cell size regardless of digit count; tabular-nums timer.

### 7.10 Submit Confirmation

Modal: "You have answered 87 of 90. 3 unanswered, 2 marked for review. Submit exam?" Two equal-weight buttons — **Review Unanswered** / **Submit** — neither styled as destructive.

### 7.11 Result Page (`/attempts/[attemptId]/result`)

Summary card (score, accuracy, time taken, correct/incorrect/unanswered) → simple stacked bar → full filterable review list. No celebratory animation regardless of score (§3.5).

### 7.12 Admin Monitor (`/admin/exams/[id]/monitor`) — v0-lite

Read-only table: student, status, time remaining. Polling, not sockets (no Redis/real-time infra at ₹0, per TRD ADR-006).

---

## 8. Screen States

Every major screen must explicitly design for six states, not just its "happy path." This table is the contract — a screen is not done until every applicable cell is designed.

| Screen              | Empty                                                            | Loading                                                    | Error                                                                                                       | Offline                                                                          | Permission Denied                                                                             | Maintenance                                                                                                               |
| ------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Admin Dashboard     | "No exams yet" + CTA (§7.2)                                      | Skeleton rows, ≤400ms shimmer cap                          | "Couldn't load exams" + Retry button                                                                        | Banner: "You're offline — showing last loaded data", disables New Exam           | N/A (only admins reach this)                                                                  | Full-page notice, no partial UI                                                                                           |
| Upload Wizard       | N/A                                                              | Per-stage label (§7.3), not %; cancellable                 | Per-file inline error ("This doesn't look like a PDF") + keep other file's state                            | Blocks submit, queues nothing (upload isn't safe to queue blind)                 | N/A                                                                                           | Same as above                                                                                                             |
| Review Screen       | "No questions extracted — add manually"                          | Skeleton list matching final row height (no shift on load) | Row-level: "Couldn't load this question" + retry, doesn't block other rows                                  | "Saving paused — reconnecting…" banner, edits kept in memory                     | N/A                                                                                           | Same as above                                                                                                             |
| Configure / Publish | N/A                                                              | Standard field skeletons                                   | Inline per-field validation, one summary banner at top listing all blocking issues                          | Save queued locally, banner shown, publish disabled while offline                | N/A                                                                                           | Same as above                                                                                                             |
| Student Dashboard   | "No exams assigned yet — check back soon" (never "error"-styled) | Skeleton cards                                             | "Couldn't load your exams" + Retry                                                                          | Cached last-known list shown with "offline" badge                                | N/A                                                                                           | Full-page notice with expected return time if known                                                                       |
| Instructions Page   | N/A                                                              | Skeleton text blocks                                       | "Couldn't load instructions" + Retry (blocks Start until resolved — never guess the instructions)           | Blocks entry to exam entirely — starting an exam requires a confirmed connection | If exam not assigned to this student: plain "This exam isn't available to your account"       | Blocks entry, explains exam is temporarily unavailable                                                                    |
| **CBT Attempt**     | N/A                                                              | One-time initial load skeleton only, never mid-attempt     | Non-blocking inline error per action with manual retry (§9); attempt itself never hard-fails                | **See §13 — full dedicated offline flow**, exam continues locally                | If attempt not found/not owned: calm redirect to dashboard with explanation, logged (§ audit) | Not permitted to interrupt an in-progress attempt — maintenance windows are scheduled outside active-exam hours by policy |
| Result Page         | "Result not available yet" if still processing                   | Skeleton summary card                                      | "Couldn't load your result — this does not affect your submitted answers" (critical: never imply data loss) | Cached result shown if previously loaded                                         | If attempt not owned: same as above                                                           | Full-page notice                                                                                                          |
| Admin Monitor       | "No attempts in progress"                                        | Skeleton table                                             | "Couldn't refresh live status" + last-known timestamp shown                                                 | Shows last successful poll + "stale" badge                                       | N/A                                                                                           | Same as above                                                                                                             |

**Cross-cutting rules:**

- Error copy never says "Something went wrong" alone — it always names what failed and what the user can do.
- Loading states never appear for actions already covered by optimistic UI (§9) — only for true first-loads.
- Maintenance mode is a single shared full-page component (`<MaintenanceNotice>`), never screen-specific copy, except the CBT exception above.

---

## 9. Component Interaction States

Every reusable component is designed and documented across the same eight states — a component spec that omits one of these is incomplete per §20.

| State              | Universal rule                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default**        | Uses `elevation-0`/`elevation-1` per §3.3, resting token values                                                                                                   |
| **Hover**          | `opacity-hover-overlay` tint, `motion-fast`; no hover-only functionality (must also work via focus, for keyboard/touch parity)                                    |
| **Focus**          | `focus-ring` token, always visible, never suppressed                                                                                                              |
| **Pressed/Active** | `opacity-pressed-overlay` tint, no scale-transform (avoids perceived layout shift)                                                                                |
| **Disabled**       | `opacity-disabled` + `cursor: not-allowed` **and** `aria-disabled="true"` — opacity alone is never the only signal                                                |
| **Loading**        | Component-local spinner or skeleton, original label retained in an `aria-live` region if it's a button ("Saving…"), never full-screen blocking for a local action |
| **Error**          | `state-error` border/text, inline message directly below/beside the component, never a standalone toast for form-field errors                                     |
| **Success**        | `state-success` accent, momentary (≤2s) unless the success _is_ the persistent state (e.g., a Published chip)                                                     |

**Applied example — `Button` (primary):**

| State    | Visual                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| Default  | `brand-primary` fill, white text, `radius-sm`                                                                |
| Hover    | `brand-primary-hover` fill                                                                                   |
| Focus    | + `focus-ring`                                                                                               |
| Pressed  | `brand-primary-hover` + `opacity-pressed-overlay`                                                            |
| Disabled | `opacity-disabled`, `cursor: not-allowed`, `aria-disabled`                                                   |
| Loading  | Label replaced with spinner + "Saving…" `aria-live="polite"`, button stays disabled to prevent double-submit |
| Error    | N/A at button level (errors surface on the field/form, not the trigger)                                      |
| Success  | Brief `state-success` flash (≤2s) only for actions without a further state to reflect (e.g., "Copied")       |

This same 8-row table is required documentation for: `Button`, `PaletteCell`, `QuestionCard` option rows, `Timer`, `SyncIndicator`, `StatusChip`, `ConfidenceDot`, `Modal`, `InlineEditor` field, `Toast`, and all form inputs (§11).

---

## 10. Micro-interactions

| Element                                    | Interaction                                                                                                                                                           | Detail                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Option selection (radio)                   | Click/tap/keypress → immediate visual fill + border color change, no delay waiting for server ack                                                                     | Optimistic per §9/TRD §8; reconciled silently on server confirmation                                       |
| Palette cell status change                 | Instant color/shape swap, `motion-instant` (no transition)                                                                                                            | A status change reflects a fact (answered/marked) — animating it would suggest ambiguity where none exists |
| Save & Next                                | Button shows no loading spinner for the common case (server round-trip target <150ms, §16); if it exceeds ~400ms, the sync indicator (not the button) shows "Saving…" | Keeps navigation feeling instant even under mild latency                                                   |
| Copy-to-clipboard (admin, e.g. share link) | Icon swaps to `Check` for 1.5s, then reverts                                                                                                                          | `motion-fast` swap, `aria-live="polite"` announcement                                                      |
| Checkbox / toggle                          | `motion-fast` fill transition only, no bounce/spring easing anywhere in the product                                                                                   | Springs read as "playful," inconsistent with §2 tone                                                       |
| Dropdown / select open                     | `motion-base` scale+fade from anchor point                                                                                                                            | Closes on outside click, `Escape`, or selection                                                            |
| Modal open/close                           | `motion-modal` in, `motion-fast` out; backdrop `blur-scrim` fades in parallel                                                                                         | Focus trapped inside while open, returns to trigger element on close                                       |
| Toast appear/dismiss                       | Slide+fade `motion-base` in, auto-dismiss 4s (success) or manual-dismiss only (anything requiring action)                                                             | Never stacks more than 2 — third replaces oldest                                                           |
| Drag-and-drop file upload (wizard)         | Border swaps to `brand-primary` + subtle `bg-sunken` tint on drag-over, reverts on drag-leave                                                                         | No file preview animation — file name + size appears instantly on drop                                     |
| Timer tick                                 | Digit swap only, no crossfade                                                                                                                                         | Consistent with `motion-instant`                                                                           |
| Confidence dot hover (admin)               | Tooltip fade-in `motion-fast` showing exact %                                                                                                                         | Tooltip is supplementary, never the only place the info exists                                             |

---

## 11. Form Design Guidelines

| Rule                                               | Detail                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Label placement                                    | Always above the field, left-aligned, `text-meta` weight-medium — never inside-as-placeholder-only (placeholders disappear on input, violating "recoverable/honest" from §1)                                                                                                                                                                     |
| Required vs. optional                              | Mark optional fields ("(optional)"), not required ones — in this product, most fields are required, so marking the minority reduces noise                                                                                                                                                                                                        |
| Validation timing                                  | Validate on blur for format (email, number ranges), on submit for cross-field/server rules — never on every keystroke (distracting mid-typing)                                                                                                                                                                                                   |
| Error message placement                            | Directly below the field, `state-error` text + icon, field border also swaps to `state-error`                                                                                                                                                                                                                                                    | Never a summary-only error at the top _without_ the inline pairing — both are shown together for scanability |
| Error message content                              | States what's wrong and how to fix it in the field's own terms ("Enter a duration greater than 0" not "Invalid input")                                                                                                                                                                                                                           |
| Numeric fields (marks, duration, negative marking) | Explicit `min`/`step`, no silent clamping — a rejected value shows why, never silently rounds                                                                                                                                                                                                                                                    |
| Multi-step forms (upload wizard, question editor)  | Preserve all field state when navigating back a step — never lose input on back-navigation                                                                                                                                                                                                                                                       |
| Autosave forms (question editor, configure)        | Save-on-blur per field, with the field-level Loading/Success/Error states from §9 — no page-level "Save" button required for these                                                                                                                                                                                                               |
| Explicit-submit forms (login, publish confirm)     | Primary button disabled until the form is valid **and not loading**; label never changes text between states (button says "Publish," not "Publish" → "Publishing" → "Done" — the loading state is communicated via the spinner replacing the label icon area, not by rewriting the verb, to keep the verb consistent throughout the interaction) |
| Destructive actions (delete question, unpublish)   | Require a confirm modal restating what will be lost in plain terms; never a single-click delete                                                                                                                                                                                                                                                  |
| Focus order                                        | Matches visual/DOM order; first invalid field receives focus automatically on failed submit                                                                                                                                                                                                                                                      |

---

## 12. Accessibility

| Requirement              | Implementation                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contrast                 | All text pairs ≥AA; primary reading pairs ≥AAA                                                                                                                                                               |
| Color-blind safety       | Every status uses shape/icon + color, never color-only (§3.1, §3.8)                                                                                                                                          |
| Keyboard navigation      | 100% of CBT and admin flows operable without a mouse; logical tab order                                                                                                                                      |
| Focus states             | `focus-ring` token, never `outline:none` without an equivalent replacement                                                                                                                                   |
| Screen reader            | Semantic HTML (`<fieldset>`/`<legend>` for options), `role="timer"` with milestone-only announcements (5-min marks + urgent-phase entry, never per-second); palette cells expose full state via `aria-label` |
| Zoom                     | Fully usable at 200% browser zoom, no horizontal scroll traps                                                                                                                                                |
| `prefers-reduced-motion` | Respected globally (§3.5)                                                                                                                                                                                    |
| High Contrast theme      | Manual toggle (§4) — re-tuned palette, not just inversion                                                                                                                                                    |
| Math for screen readers  | KaTeX MathML output alongside visual rendering                                                                                                                                                               |
| Disabled controls        | `aria-disabled` + `opacity-disabled`, never `opacity` alone (§9)                                                                                                                                             |

---

## 13. Offline Behavior & Synchronization

Given the exam-hall reality of flaky Wi-Fi/mobile data, offline handling is a first-class flow, not an edge case — expanding on TRD §9's server-side guarantees with the client-side experience.

### 13.1 During an active attempt (highest-stakes case)

```
Action taken (answer/clear/mark/navigate)
        │
        ▼
Optimistic local update (instant, §9/§10)
        │
        ▼
Queued as a pending sync item (in-memory FIFO, keyed by question — new action
for the same question replaces the pending one, not appended)
        │
        ▼
Attempt to send ──success──> Sync indicator: "Saved" (state-success, brief)
        │
      failure/offline
        │
        ▼
Sync indicator: "Saving…" (state-info, persistent, no alarm styling)
        │
        ▼
Retry with backoff (1s, 2s, 4s, 8s, capped at 8s) while connection is down
        │
        ▼
Connection restored ──> flush queue in order ──> "Saved"
```

| Detail                           | Rule                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Student-visible signal           | Never a blocking modal, never "You are offline!" alarm copy — the sync indicator is the single source of truth, consistent tone regardless of duration                                                                                                                                                                                                                   |
| Timer during offline             | Continues rendering client-side from `startedAt`; server remains authoritative for auto-submit per TRD §8 regardless of client connectivity                                                                                                                                                                                                                              |
| Prolonged offline (>30s)         | Sync indicator adds a secondary line: "Your answers are saved on this device and will sync when you're back online" — reassurance, not urgency                                                                                                                                                                                                                           |
| Submit while offline             | Submit is disabled with an explanatory inline note ("Reconnect to submit — your answers are safe") rather than allowed-then-failing, since a submit must be confirmed by the server                                                                                                                                                                                      |
| Tab/browser closed while offline | On reopen, queued-but-unsent actions from `localStorage`-free in-memory state are lost by design (v0 does not persist the queue across a hard close — TRD §9 explicitly scopes this as v0-appropriate); the _last successfully synced_ state is what the server resumes from, and the UI clearly shows the resumed state so the student can redo anything genuinely lost |
| Multiple tabs                    | Out of scope for v0 (TRD §9 assumes one tab) — a second tab is not blocked but is not a supported configuration                                                                                                                                                                                                                                                          |

### 13.2 Outside an active attempt (dashboards, admin)

Read-only cached data shown with a small "offline" badge; all mutating actions (new exam, publish, edit) are disabled with inline explanation rather than silently queued, since these are low-frequency, high-consequence actions that deserve an explicit retry rather than surprise background sync.

---

## 14. Mobile & Exam Device Policy

**Explicit policy: mobile phones are _tolerated_, not a supported exam-taking device in v0.** This must be stated plainly rather than left ambiguous, per PRD's "no mobile app" non-goal and the 2–3 hour reading-ergonomics brief.

| Context                                            | Policy                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin dashboards, student dashboard, result review | Fully responsive down to phone width — these are short, low-frequency interactions (§7 screens)                                                                                                                                                                                                                                                                                                                                                                                 |
| **Taking an exam (`/exams/[id]/attempt`)**         | **Laptop/desktop/tablet (≥768px) only.** On a viewport narrower than 768px, the Instructions page (§7.8) shows a blocking notice before "Start Exam" is enabled: _"This exam is best taken on a larger screen. You can continue on this device, but we recommend a laptop, desktop, or tablet for the full 3-hour session."_ A "Continue anyway" option is provided — never a hard block — since some students may only have a phone available, but the guidance is unambiguous |
| Why tolerated rather than blocked                  | PRD's real users are validation-group students; blocking outright risks losing a legitimate attempt over a device constraint that isn't actually fatal, just uncomfortable — consistent with §1's "recoverable by default"                                                                                                                                                                                                                                                      |
| Why not "supported"                                | The 65ch reading column, fixed 40px palette cells, and 2–3hr ergonomics brief are laptop-tablet-optimized; phone width forces the palette into an overlay (§7.9, §15) and reduces comfort below the bar this spec is designed to — no phone-specific redesign is planned for v0                                                                                                                                                                                                 |
| Orientation                                        | Tablet: both orientations supported; phone: portrait assumed, landscape not specifically tested for v0                                                                                                                                                                                                                                                                                                                                                                          |

---

## 15. Responsive Design

Desktop-first (per brief), degrading gracefully.

| Breakpoint  | Target                 | CBT layout change                                                                          |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| ≥1280px     | Desktop                | Full two-column (question + palette rail), §7.9                                            |
| 1024–1279px | Laptop                 | Same layout, palette rail narrows slightly, cell size unchanged (40px floor)               |
| 768–1023px  | Tablet                 | Palette becomes a collapsible bottom sheet (swipe-up handle, count summary when collapsed) |
| <768px      | Phone (tolerated, §14) | Single column; palette via header button → full-screen overlay; question stays primary     |

Admin screens follow the same steps but phone is explicitly **not optimized** beyond "doesn't break" — admin is a single power user, desktop-first is sufficient per PRD scope.

---

## 16. UI Performance Budget

Perceived speed is part of the "calm" brief — a laggy interface is the opposite of disappearing.

| Metric                                               | Budget                                                                                                      | Why                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Input-to-optimistic-update                           | <50ms                                                                                                       | Feels instant (§9/§10); this is a client-only render, not a network round trip |
| Server round-trip for answer save                    | Target <150ms, sync indicator escalates to "Saving…" past ~400ms                                            | Matches §10's Save & Next rule                                                 |
| Route/page transition                                | ≤100ms fade (`motion-route`)                                                                                | No perceptible "navigation," per §3.5                                          |
| Modal open latency                                   | ≤180ms to fully visible (`motion-modal`)                                                                    | Fast enough to feel responsive, slow enough not to feel abrupt                 |
| Time-to-interactive, CBT attempt screen (first load) | <2s on a typical broadband/4G connection                                                                    | This is the one screen where a slow first load directly costs exam time        |
| Animation duration ceiling                           | 400ms for any single transition, none for anything on a >1s or looping cycle                                | Prevents shimmer/skeleton overstay (§8)                                        |
| Timer tick jitter                                    | 0ms — must not be perceptibly delayed or drift from wall-clock, reconciled against server time on each sync | Trust in the timer is trust in the exam                                        |
| Palette interaction (open/navigate)                  | <16ms per frame (60fps) even at 90-question density                                                         | No dropped frames scrolling/selecting under load                               |

---

## 17. Keyboard Shortcuts

Full keyboard operability is required (§12), not optional. Shortcuts below are the same everywhere the CBT attempt screen is active; there are no shortcut differences between themes.

| Key                                                | Action                                                                                              | Notes                                                                                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Tab` / `Shift+Tab`                                | Move focus forward/backward through options, then action buttons, then palette                      | Standard DOM order, never trapped except inside an open modal                                                                        |
| `1`–`4` or `A`–`D`                                 | Select option 1–4 for the current question                                                          | Works regardless of current focus location while the question column is active                                                       |
| `Enter` / `Space`                                  | Activate the focused control                                                                        | Standard                                                                                                                             |
| `→` (Right Arrow)                                  | Save & Next                                                                                         | Mirrors the primary button; does not fire while focus is inside a text field (none exist in MCQ, reserved for future question types) |
| `←` (Left Arrow)                                   | Previous                                                                                            | Mirrors the secondary nav button                                                                                                     |
| `M`                                                | Mark for Review & Next                                                                              |                                                                                                                                      |
| `C`                                                | Clear Response                                                                                      |                                                                                                                                      |
| `G` then a number (e.g., `G` `2` `3`)              | Jump to question 23                                                                                 | Small on-screen hint shown once per session the first time `G` is pressed                                                            |
| `Esc`                                              | Close any open overlay/modal (hamburger menu, submit confirm) — never closes/pauses the exam itself |                                                                                                                                      |
| `Ctrl/Cmd+Enter`                                   | Open Submit confirmation from anywhere in the attempt                                               | Deliberately requires a modifier so it can't be hit accidentally                                                                     |
| Arrow keys within palette (when palette has focus) | Move focus between cells; `Enter` jumps to that question                                            | Grid-pattern navigation, standard for a data-grid widget                                                                             |

A one-time, dismissible shortcut reference is available from the `[≡]` menu (§7.9) — never shown as an unskippable onboarding tour.

---

## 18. Component Inventory

| Component                                            | Notes                                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Button` (primary / secondary / destructive / ghost) | 44×44px minimum hit target everywhere; full 8-state spec in §9                                           |
| `PaletteCell`                                        | Fixed 40px square (desktop), status color + shape overlay + `aria-label`; `motion-instant` status swap   |
| `QuestionCard`                                       | Stem + options, KaTeX render boundary with fallback to raw text on render failure (never a blank screen) |
| `Timer`                                              | Tabular-nums, calm→urgent color swap only, milestone-only screen-reader announcements                    |
| `SyncIndicator`                                      | Text-only, 3 states: Saved / Saving / Retry-with-button — never silent failure                           |
| `StatusChip`                                         | Draft/Processing/Review/Published/Archived — color + text label, never color alone                       |
| `ConfidenceDot`                                      | Admin-only, green/amber + numeric % tooltip                                                              |
| `Modal`                                              | Reserved for genuinely blocking decisions only; focus-trapped, `Esc`-closable, `blur-scrim` backdrop     |
| `InlineEditor`                                       | Admin question editing — autosave-on-blur per field, separate explicit "Mark reviewed" control           |
| `Toast`                                              | Non-blocking confirmations only; success auto-dismisses at 4s, action-required toasts persist            |
| `EmptyState`, `ErrorState`, `MaintenanceNotice`      | Shared components used by every screen per §8's matrix — never screen-bespoke copy components            |

---

## 19. Interaction Rules

| Situation                                | Rule                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Any answer selection                     | Persists immediately (optimistic), no explicit save button beyond navigation                      |
| Network drop mid-exam                    | See §13 in full                                                                                   |
| Double-submit (accidental double click)  | All mutating actions debounced/idempotent client-side; server upsert (TRD §9) is the real guard   |
| Keyboard-only student                    | Full exam completable via keyboard (§17)                                                          |
| Zoom to 200%                             | Single-column reflow below the defined breakpoint (§15) rather than clipping                      |
| Idle/inactivity                          | No auto-logout during an active exam; applies only outside an active attempt                      |
| Leaving the exam tab (visibility change) | No punitive action client-side — v0 has no proctoring (PRD non-goal), a deliberate scope boundary |

---

## 20. UI Implementation Rules

These rules govern how every future React component is built and documented, so the system in §3–§18 stays true in code, not just on paper.

1. **Tokens only, no raw values.** No component may hardcode a hex color, px spacing value, shadow, or duration — every visual value resolves to a CSS custom property defined in the token layer (§3). A hardcoded value in a component review is a blocking review comment.
2. **Theme-blind components.** A component must render correctly under every theme in §4 purely by virtue of consuming tokens — never `if (theme === 'dark')` branches inside component logic.
3. **State-complete by default.** Every interactive component ships with all 8 states from §9 implemented before merge, even if a given screen only currently exercises 3 of them — states are a property of the component, not the screen using it.
4. **Accessibility is not a follow-up PR.** Focus ring, `aria-*` attributes, and keyboard operability are part of the component's initial implementation, reviewed in the same PR as the visual design — never scheduled as a later accessibility pass.
5. **No animation without a token.** Any `transition`/`animation` must reference a `motion-*` token (§3.5) and must degrade to `motion-instant` under `prefers-reduced-motion` automatically via a shared hook/utility, not per-component logic.
6. **Server truth mirrored in local state shape.** Any component holding optimistic local state (§9/§10/§13) must model it as "local intent + reconciliation status," never overwrite-in-place — so a failed sync can roll back visibly rather than silently diverge from the server.
7. **One component, one job.** A component that renders differently enough to need a large prop-driven conditional tree should be split — mirrors §1's "one decision at a time" applied to code, not just screens.
8. **Documentation required per component:** purpose, all 8 states (§9) with screenshots/Storybook entries, keyboard behavior, ARIA contract, and which tokens it consumes — a component without this is not considered done, regardless of visual polish.
9. **Empty/Loading/Error ownership.** Screen-level components compose the shared `EmptyState`/`ErrorState` primitives (§18) rather than each screen inventing its own — §8's matrix is enforced by having only one implementation to keep honest.
10. **No component reaches across a boundary.** A `apps/web` UI component never imports processor-specific types directly — it consumes the shared contract types from `packages/shared-types` (TRD §3), keeping the UI layer honestly decoupled from parser internals.

---

## 21. Future Expansion (not built in v0, must not be blocked by v0 decisions)

| Future need                                 | How this spec already accommodates it                                                                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MSQ / Numerical / Subjective question types | `QuestionCard` is slot-based per type; palette status model already a superset of NTA states                                                                          |
| Multiple exam formats (NEET/CUET/CBSE)      | Review screen and CBT are format-agnostic — render `ParsedExam`'s shape (TRD §7)                                                                                      |
| Analytics dashboards                        | Result page's breakdown component is isolated and swappable                                                                                                           |
| Institutional themes                        | Token-driven theme architecture (§4) already designed for this exact case                                                                                             |
| Local LLM-assisted extraction               | Confidence model (§7.4) already anticipates a probabilistic parser                                                                                                    |
| Sections with per-section timers            | Palette rail already groups by question; a section header row is additive                                                                                             |
| Native mobile app                           | Component sizing (44px targets, single-column fallback) is already mobile-viable groundwork; §14's "tolerated" policy is what a real app would upgrade to "supported" |

---

## 22. Design Review — Multi-Perspective Critique

| Perspective                                   | Finding                                                                                                  | Resolution applied above                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Product Designer**                          | Early draft risked a generic "exam portal" look via numbered-step wizards everywhere                     | Reserved for nowhere; single genuine signature element (palette grid) instead                                            |
| **UX Designer**                               | Auto-submit with no warning could feel punitive                                                          | Auto-submit banner is calm, non-alarming, explanatory                                                                    |
| **Accessibility Expert**                      | Per-second timer announcements would be unusable with a screen reader                                    | Capped to 5-minute milestones + urgent-phase entry                                                                       |
| **Frontend Engineer**                         | Variable-width palette cells would cause layout shift                                                    | Fixed cell size + tabular-nums locked in (§3.2, §7.9)                                                                    |
| **Security Engineer**                         | Client-side PDF type-check could be mistaken for the real gate                                           | Documented as UX nicety _in addition to_, never instead of, server-side check (TRD §10)                                  |
| **Student**                                   | "Mark + Answer" needs both facts visible, not just one color                                             | 5th palette state (answered _and_ marked)                                                                                |
| **Administrator**                             | Reviewing in paper order buries what needs attention                                                     | Default sort is low-confidence-first, toggle to paper order                                                              |
| **Implementation reviewer** _(new this pass)_ | A token system on paper doesn't guarantee token-only components in practice                              | §20's implementation rules make token-only usage a review-blocking requirement, not a suggestion                         |
| **Mobile-using student** _(new this pass)_    | Leaving mobile policy implicit risked either an unusable cramped exam or a false promise of full support | §14 states the tolerated-not-supported policy explicitly, with a non-blocking warning rather than silence or a hard wall |

---

_This document is complete pending your review. Once approved, next candidates are `04-Document-Processing.md` (JEE Main parser rules — needs sample PDFs per PRD §12) or `05-Database-API.md` (Prisma schema, API contracts) — your call on order._
