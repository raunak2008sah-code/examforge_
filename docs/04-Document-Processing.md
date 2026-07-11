# 04 — Document Processing Service

**ExamForge · Python FastAPI Parser Service — Technical Blueprint**

Status: ✅ Locked (extends 01-PRD.md, 02-TRD.md, 03-UI-UX.md)
Scope: How uploaded JEE Main PDFs become structured, review-ready exam JSON.

---

## 1. Purpose

### 1.1 Goals

- Convert a JEE Main PDF (question paper + optionally an answer key) into a **structured, validated JSON exam object**.
- Never publish silently — every output either passes a confidence bar or is routed to a human.
- Be **modular enough** that a future exam (NEET, CUET) or a future OCR/LLM engine can be plugged in without touching the pipeline core.

### 1.2 Scope (MVP)

| In Scope                                                 | Out of Scope (MVP)                     |
| -------------------------------------------------------- | -------------------------------------- |
| JEE Main MCQ question papers (digital or scanned PDF)    | Numerical/integer-type questions       |
| Single or multi-section papers (Physics/Chemistry/Maths) | Subjective / descriptive answers       |
| Answer key as separate PDF or appended page              | Auto-answer-key generation via solving |
| Rule-based parsing + optional OCR                        | Any paid AI/LLM API                    |
| Manual review & correction UI hand-off                   | Fully automatic publish                |

### 1.3 Supported Formats

- Input: `.pdf` only (digital-native or scanned/image-based).
- Output: versioned JSON (Section 10), consumed by the Next.js backend via internal API.

### 1.4 Non-Goals

- This service does **not** render the test UI, manage auth, or store final published data — it only **produces and validates structured JSON**, handing off to the Modular Monolith (per 02-TRD.md) for persistence.
- It does not attempt semantic correctness (e.g. verifying a physics answer is scientifically right) — only **structural correctness** (numbering, options present, answer mapped).

---

## 2. PDF Analysis

### 2.1 Supported JEE Main Layout Patterns

JEE Main papers vary by year/shift but converge on a small set of recurring layouts. The parser is built against these known patterns:

| Layout Pattern                      | Description                                                               | Frequency                             |
| ----------------------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| **A — Single column, sequential**   | Q1→Q30 per subject, one column, numbering resets or continues per section | Most common (NTA official PDFs)       |
| **B — Two column**                  | Split-column layout, questions flow top-to-bottom then column-wrap        | Common in coaching-institute reprints |
| **C — Section-header delimited**    | Explicit "PHYSICS / CHEMISTRY / MATHEMATICS" headers separate blocks      | Standard                              |
| **D — Answer key appended**         | Last 1–3 pages contain a table: Q.No → Correct Option                     | Common                                |
| **E — Answer key as separate file** | Uploaded as a second PDF                                                  | Common                                |
| **F — Scanned/photocopied**         | Image-based, no text layer, possible skew/noise                           | Occasional                            |

Only these known patterns are "supported" at MVP; anything else falls to Manual Review rather than a best-effort guess (Core Principle: Reliability > Automation).

### 2.2 Digital vs Scanned Detection

```
                ┌────────────────────────┐
                │   Extract text layer    │
                │   (per page, via        │
                │    PDF text extractor)  │
                └───────────┬─────────────┘
                            │
              text chars / page > threshold?
                            │
             ┌──────────────┴───────────────┐
             │ YES                          │ NO
             ▼                              ▼
      "DIGITAL" document              "SCANNED" document
   (proceed to Rule Parser)         (proceed to OCR first)
```

**Detection heuristic (decision table):**

| Signal                                        | Digital | Scanned       |
| --------------------------------------------- | ------- | ------------- |
| Extractable text chars/page                   | > 50    | < 50          |
| Embedded fonts present                        | Yes     | No/irrelevant |
| Page rendered as single large image           | No      | Yes           |
| Text extraction confidence (library-reported) | High    | Low/None      |

A page can independently be digital or scanned (mixed PDFs exist — e.g. a digital paper with a scanned diagram page). **Classification is per-page**, not per-document, so OCR only runs where actually needed (performance + accuracy).

### 2.3 Document Validation (pre-processing gate)

Before any parsing begins, the document must pass a validation gate — see **Section 14 (Security)** for the security-specific checks (magic bytes, size limits). Structural validation performed here:

| Check                                      | Rule                                           | Failure Action                        |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------- |
| Page count                                 | 1–60 pages (config)                            | Reject, notify user                   |
| At least 1 page with question-like content | Regex/keyword heuristic (`Q\d+`, `(1)`, `(A)`) | Reject as "not a question paper"      |
| Not encrypted/password-protected           | PDF open succeeds without password             | Reject, ask user to remove protection |
| Not corrupted                              | Library can parse xref table                   | Reject, ask re-upload                 |

---

## 3. Processing Pipeline

### 3.1 Full Flow

```
 ┌──────────┐
 │  Upload   │  (PDF received via API, stored in Supabase Storage)
 └────┬─────┘
      ▼
 ┌──────────────┐
 │  Validation   │  Security + structural checks (Sec. 2.3, 14)
 └────┬─────────┘
      │ pass
      ▼
 ┌───────────────┐
 │ Classification │  Digital vs Scanned, per page (Sec. 2.2)
 └────┬──────────┘
      │
      ▼
 ┌──────────┐        scanned pages
 │   OCR     │ ◄──────────────────────┐
 └────┬─────┘                         │
      │ text ready (digital + OCR'd)  │
      ▼                               │
 ┌──────────┐                         │
 │ Parsing   │  Rule-based extraction │
 └────┬─────┘                         │
      ▼                               │
 ┌────────────┐                       │
 │ Confidence  │  Score per question  │
 └────┬───────┘                       │
      │                               │
 ┌────┴─────┐                         │
 │ ≥ threshold?                       │
 └────┬─────┘                         │
   YES│    │NO                        │
      │    └──────────────┐           │
      ▼                   ▼           │
┌────────────┐     ┌───────────────┐  │
│ JSON Output │     │ Manual Review  │◄┘ (low-confidence
└────┬───────┘     └───────┬───────┘     items also land here)
     │                     │ human edits + approves
     ▼                     ▼
┌────────────────────────────────────┐
│              Database               │
│   (Prisma → PostgreSQL/Supabase)    │
└─────────────────────────────────────┘
```

### 3.2 Stage Contract Table

Each stage takes a well-defined input/output so stages can be tested, retried, or swapped independently (Clean Architecture principle).

| Stage          | Input                           | Output                                            | Idempotent?       |
| -------------- | ------------------------------- | ------------------------------------------------- | ----------------- |
| Validation     | Raw file bytes                  | `ValidationResult{ ok, reason }`                  | Yes               |
| Classification | Validated PDF                   | `PageClassification[]` (digital/scanned per page) | Yes               |
| OCR            | Scanned page images             | `OcrText[]` (text + per-word confidence)          | Yes (cached)      |
| Parsing        | Page-level text (digital + OCR) | `RawParsedPaper` (unvalidated draft JSON)         | Yes               |
| Confidence     | `RawParsedPaper`                | `ScoredPaper` (per-question + overall score)      | Yes               |
| Manual Review  | `ScoredPaper` + human edits     | `ApprovedPaper`                                   | No (human action) |
| JSON Output    | `ApprovedPaper`                 | Final versioned JSON (Sec. 10)                    | Yes               |
| Database       | Final JSON                      | Persisted rows via Prisma                         | No (write)        |

**Why a staged pipeline instead of one monolithic function:** each stage is independently retestable (golden-file tests, Sec. 15), independently retryable on failure (Sec. 12), and independently replaceable (e.g. swapping the OCR engine or adding an LLM stage later never touches Parsing/Confidence code).

---

## 4. Parser Architecture

### 4.1 Parser Interface (conceptual, not code)

Every exam parser must implement the same contract so the pipeline can invoke any parser polymorphically:

| Method                                         | Responsibility                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `detect(document) -> bool`                     | Can this parser handle this document? (e.g. layout fingerprint match) |
| `extract_questions(document) -> RawQuestion[]` | Produce raw question blocks                                           |
| `extract_answer_key(document) -> AnswerMap`    | Produce Q.No → correct option map                                     |
| `describe() -> ParserMetadata`                 | Name, version, supported exam, supported layouts                      |

This is a **plugin architecture**: the pipeline holds a registry of parsers and picks the first one whose `detect()` returns true (highest priority first). If none match → straight to Manual Review with reason `"no_parser_matched"`.

### 4.2 Why Plugin Architecture (justification)

- **Extensibility**: adding NEET/CUET later = adding a new plugin, zero changes to pipeline/orchestration code.
- **Isolation of risk**: a bug in the JEE parser cannot break a future exam's parser.
- **Testability**: each parser plugin ships with its own golden-file test suite (Sec. 15).
- **Matches Core Principle "Modular Parser"** from the locked architecture.

### 4.3 Registry & Selection Flow

```
Document ──► [JEEMainParser.detect()?] ──yes──► use JEEMainParser
                    │no
                    ▼
             [NEETParser.detect()?] (future) ──yes──► use NEETParser
                    │no
                    ▼
             No parser matched ──► Manual Review ("unsupported layout")
```

### 4.4 Folder Structure

```
document-processing/
├── app/
│   ├── api/                  # FastAPI routes (upload, status, review-actions)
│   ├── pipeline/
│   │   ├── orchestrator.py   # Stage sequencing, retries (conceptually)
│   │   ├── validation.py
│   │   ├── classification.py
│   │   ├── ocr/
│   │   │   ├── engine.py     # OCR abstraction
│   │   │   └── preprocess.py # deskew, denoise, binarize
│   │   ├── confidence.py
│   │   └── review_bridge.py  # hands scored paper to Manual Review queue
│   ├── parsers/
│   │   ├── base.py           # Parser interface (abstract)
│   │   ├── registry.py        # Plugin registry
│   │   ├── jee_main/
│   │   │   ├── parser.py
│   │   │   ├── question_extractor.py
│   │   │   ├── answer_key_extractor.py
│   │   │   └── layouts/       # layout-specific regex/heuristics (A–F, Sec 2.1)
│   │   └── _future_exam/      # placeholder pattern for next parser
│   ├── schema/
│   │   ├── json_schema.py     # Pydantic models mirroring Sec. 10
│   │   └── versioning.py
│   ├── validation_rules/      # Sec. 11 rule engine
│   └── core/
│       ├── logging.py
│       ├── errors.py
│       └── config.py
├── tests/
│   ├── golden_files/           # Sec. 15
│   ├── unit/
│   └── regression/
└── Dockerfile
```

---

## 5. Question Extraction

### 5.1 Question Numbering

- Recognized numbering formats: `Q1.`, `Q.1`, `1.`, `1)`, `(1)`.
- Numbering is expected to be **strictly increasing within a section**; a gap or repeat is flagged (Sec. 11).
- Section-relative numbering (e.g. Chemistry restarts at 1) is detected via section headers (5.4) and normalized internally to a global index while preserving the original display number.

### 5.2 Statement Extraction

- The question statement is the text block between the numbering token and the first option token.
- Multi-line statements (wrapped text, paragraph-style questions) are merged using layout-aware line joining (line-gap and left-margin alignment), not naive newline stripping — preserves formatting for equations/line-breaks that matter.

### 5.3 Option Extraction

- Recognized option markers: `(A)/(B)/(C)/(D)`, `A)/B)/C)/D)`, `1)/2)/3)/4)`.
- Exactly 4 options expected for MCQ (JEE Main MVP scope). Fewer or more than 4 → validation flag (Sec. 11), not a silent guess.
- Option text follows the same multi-line merge logic as 5.2.

### 5.4 Section Detection

- Detected via header keywords: `PHYSICS`, `CHEMISTRY`, `MATHEMATICS` (case-insensitive, tolerant of OCR noise like `PHYSIC5`).
- Each detected section becomes a `Section` object (Sec. 10) with its own question range.
- If no section headers are found at all, the whole paper is treated as one implicit "General" section rather than failing.

### 5.5 Images

- Any embedded image inside a question's bounding box (diagrams, graphs, circuit diagrams) is extracted as a binary asset, uploaded to Supabase Storage, and referenced in the JSON by URL/asset-id — never inlined as base64 in the JSON (keeps payload small, matches Storage architecture in 02-TRD.md).
- If image extraction fails but text around it suggests one exists (e.g. "as shown in the figure"), the question is flagged `possible_missing_image` for manual review rather than silently dropped.

### 5.6 Tables

- Tabular content within a question (data tables, matching-type columns) is extracted as a structured `table` sub-object (rows/columns of strings) when cell boundaries are detectable; otherwise it falls back to an image asset (5.5) with a `table_as_image: true` flag — reliability over forced structuring.

### 5.7 Equations

- MVP does **not** attempt LaTeX/MathML reconstruction (would need heavy OCR/ML — against ₹0 budget and Minimal Dependencies principle).
- Equations are preserved as **plain extracted text** where the PDF has genuine text glyphs (digital PDFs render most symbols as Unicode/special fonts, extracted as-is).
- Where equations are actually embedded images (common in scanned/typeset papers), they're treated as images (5.5) and rendered visually in the review UI and the final test UI.

### 5.8 Edge Cases Table

| Edge Case                                          | Handling                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| Question spans two pages                           | Merge via "continued" detection (no next-question marker found before page-break) |
| Option wraps across a column break                 | Column-aware reflow before option-splitting                                       |
| Missing option marker (OCR dropped a glyph)        | Flag `incomplete_options`, route to review                                        |
| Duplicate question number                          | Flag `duplicate_numbering` (Sec. 11)                                              |
| Non-MCQ (numerical) question in paper              | Extracted but flagged `unsupported_question_type`, excluded from auto-publish     |
| Watermarks/headers/footers repeating on every page | Filtered via repeated-line-across-pages heuristic                                 |

---

## 6. Answer Key Extraction

### 6.1 Supported Answer-Key Layouts

| Layout                 | Description                                           |
| ---------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| **Table form**         | `Q.No                                                 | Answer` two-column table, often on a dedicated page |
| **Grid form**          | Compact grid, e.g. `1-B 2-D 3-A ...` inline sequences |
| **Section-wise table** | Separate small tables per subject                     |
| **Separate PDF**       | A second uploaded file containing only the key        |

### 6.2 Matching Logic

```
For each extracted answer-key entry (Q.No, Answer):
   locate Question with matching global/display number
   IF found:
        attach answer to question.correctOption
   ELSE:
        record as "orphan_answer_key_entry" (Sec. 11)

For each Question with NO matching key entry:
   mark question.correctOption = null
   flag "missing_answer" (Sec. 11) → forces Manual Review
```

### 6.3 Validation

- Answer value must be one of the 4 recognized option labels (A/B/C/D or 1/2/3/4) — anything else (e.g. answer key shows a numeric range for integer-type) is flagged `unsupported_answer_format`.
- Cross-check: total answer-key entries vs total questions — a large mismatch (>10%, configurable) downgrades the **overall** confidence score independent of per-question scores (systemic signal that something is structurally wrong).

---

## 7. OCR Strategy

### 7.1 When OCR Runs

OCR runs **only** on pages classified `SCANNED` (Sec. 2.2) — never on digital pages, to avoid unnecessary compute and avoid re-introducing OCR error into already-clean text (Reliability principle).

### 7.2 Recommended Libraries (₹0 budget, open-source only)

| Purpose               | Library                               | Reasoning                                                                                                                            |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| OCR engine            | **Tesseract OCR** (via `pytesseract`) | Free, mature, offline, no API cost — fits ₹0 budget & Minimal Dependencies                                                           |
| PDF → image rendering | **PyMuPDF (fitz)**                    | Fast rasterization, also usable for digital text/metadata extraction (single dependency serves both classification and OCR pre-step) |
| Image pre-processing  | **OpenCV (opencv-python-headless)**   | Industry-standard deskew/denoise/binarize primitives                                                                                 |

_(Deliberately excluded: any cloud OCR API (Google Vision, AWS Textract) — violates "No paid AI APIs" and "₹0 budget" locked constraints.)_

### 7.3 Pre-processing Pipeline (per scanned page)

```
Raw page image
   ↓ grayscale conversion
   ↓ deskew (Hough-transform angle correction)
   ↓ denoise (median blur / non-local means)
   ↓ binarization (adaptive threshold)
   ↓ DPI normalization (upscale if < 300dpi)
   ↓
Tesseract OCR ──► text + per-word confidence scores
```

### 7.4 Fallback Behavior

| Situation                                        | Fallback                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| OCR confidence below threshold for a page        | Whole page flagged, all questions on it forced into Manual Review regardless of parse success         |
| Tesseract throws / times out on a page           | Page marked `ocr_failed`, pipeline continues for other pages, failed page's questions → Manual Review |
| Entire document is unreadable (e.g. blank scans) | Document-level failure → immediate Manual Review with reason, no partial JSON generated               |

---

## 8. Confidence System

### 8.1 Definition

Confidence is computed **per question** and rolled up to an **overall paper score**. It is a composite, not a single black-box number — every contributing factor is visible to the reviewer (transparency supports Human Review principle: never silently guess).

**Per-question confidence factors:**

| Factor                                                          | Weight (suggested) | Signal Source                           |
| --------------------------------------------------------------- | ------------------ | --------------------------------------- |
| OCR text confidence (avg word confidence, if OCR'd)             | 30%                | OCR engine output; 100% if digital text |
| Structural completeness (numbering + exactly 4 options present) | 30%                | Extraction stage                        |
| Answer key match found                                          | 25%                | Answer-key matching (Sec. 6)            |
| No validation rule violations (Sec. 11) triggered               | 15%                | Validation stage                        |

```
question_confidence =
    0.30 * ocr_confidence +
    0.30 * structural_completeness +
    0.25 * answer_matched (0 or 1) +
    0.15 * (1 - has_validation_errors)
```

**Overall paper confidence** = weighted average of question confidences, further penalized by systemic issues (e.g. answer-key count mismatch, Sec. 6.3).

### 8.2 Recommended Thresholds

| Score Range                                         | Label  | Action                                                                   |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| ≥ 90%                                               | High   | Eligible for fast-track review (light-touch confirm)                     |
| 70–89%                                              | Medium | Standard manual review required                                          |
| < 70%                                               | Low    | Manual review required, question(s) highlighted/pre-flagged as high-risk |
| Any question with a hard validation error (Sec. 11) | —      | **Always** forced to review regardless of numeric score                  |

_(Exact percentages are configuration, not hardcoded — tunable per exam/layout as real-world data comes in.)_

### 8.3 Required Admin Actions

- **No paper is ever auto-published**, even at 100% confidence — MVP locked decision is "Manual Review before publish" (PRD). High confidence only changes _how much friction_ the reviewer sees, never whether review happens.
- Admin must explicitly click **Approve & Publish**; system logs which user approved which version of the JSON (audit trail, ties into Better Auth user identity).

### 8.4 Core Rule

> **The system never silently guesses.** Any ambiguity (unmatched answer, non-standard layout, low OCR confidence, validation violation) surfaces as an explicit, labeled flag in the review UI — never a best-effort auto-fill.

---

## 9. Manual Review

### 9.1 Review Workflow

```
ScoredPaper arrives in review queue
        ↓
Reviewer opens paper → sees per-question confidence + flags
        ↓
Reviewer edits flagged (or any) questions/options/answers/images
        ↓
Reviewer re-runs validation (Sec. 11) on edited paper
        ↓
   All hard errors resolved?
        │
   NO ──┴── stays in review, cannot publish
        │
   YES ─── "Approve & Publish" enabled
        ↓
Published → Database (Prisma write) + immutable original JSON version retained
```

### 9.2 Editing

- Reviewer can: edit statement/option text, reassign correct answer, re-crop/re-upload an image, merge/split incorrectly-segmented questions, reorder, delete spurious extracted "questions" (e.g. a footer misread as Q0).
- Every edit is tracked as a diff against the machine-generated draft (Section 10.6 — versioning) for future accuracy analysis (feeds Sec. 15 evaluation loop).

### 9.3 Validation (pre-publish gate)

- Re-runs the full Section 11 rule set against the edited paper before allowing publish — reviewers cannot bypass structural validation, only _fix_ it.

### 9.4 Publishing

- Publish action is a distinct, explicit step (not automatic on last edit) — matches PRD's "manual review before publish" and gives a clear audit boundary between "draft/edited" and "live" data.

---

## 10. JSON Schema

### 10.1 Standard Parser Output — Top Level

```
ExamDocument
├── metadata: Metadata
├── sections: Section[]
├── confidence: { overall: number, breakdown: {...} }
├── errors: ProcessingError[]
└── schemaVersion: string
```

### 10.2 Metadata Model

| Field         | Type                              | Notes                                                       |
| ------------- | --------------------------------- | ----------------------------------------------------------- |
| examName      | string                            | e.g. "JEE Main 2025 Session 1" (user-provided or extracted) |
| sourceFileId  | string                            | Reference to Supabase Storage object                        |
| parserUsed    | string                            | e.g. "jee_main_v1"                                          |
| parserVersion | string                            | Semver of the parser plugin                                 |
| processedAt   | datetime                          | ISO 8601                                                    |
| pageCount     | number                            |                                                             |
| detectionMode | "digital" \| "scanned" \| "mixed" | Per-document rollup of Sec. 2.2                             |

### 10.3 Section Model

| Field     | Type       | Notes          |
| --------- | ---------- | -------------- |
| id        | string     |                |
| name      | string     | e.g. "Physics" |
| order     | number     |                |
| questions | Question[] |                |

### 10.4 Question Model

| Field         | Type                                | Notes                                               |
| ------------- | ----------------------------------- | --------------------------------------------------- |
| id            | string                              |                                                     |
| displayNumber | string                              | Original number as printed (e.g. "Q.15")            |
| statement     | string                              | Extracted text                                      |
| options       | Option[4]                           |                                                     |
| correctOption | string \| null                      | Option id/label, null if unmatched                  |
| images        | AssetRef[]                          | (Sec. 5.5)                                          |
| tables        | Table[]                             | (Sec. 5.6)                                          |
| confidence    | number                              | Per-question score (Sec. 8)                         |
| flags         | string[]                            | e.g. `["missing_answer", "possible_missing_image"]` |
| reviewStatus  | "pending" \| "edited" \| "approved" |                                                     |

### 10.5 Errors Model

| Field    | Type                            | Notes                                     |
| -------- | ------------------------------- | ----------------------------------------- |
| stage    | string                          | Which pipeline stage raised it (Sec. 3.2) |
| severity | "warning" \| "error" \| "fatal" | Ties into Sec. 12                         |
| message  | string                          | Human-readable                            |
| context  | object                          | e.g. `{ page: 4, questionId: "..." }`     |

### 10.6 Versioning

- `schemaVersion` (e.g. `"1.0"`) is embedded in every output so the Next.js backend and future migrations can handle multiple schema generations safely.
- Every publish creates an **immutable snapshot**; edits create a new version rather than mutating history — required for audit trail (Security by Default) and for the accuracy-evaluation loop (Sec. 15) to compare machine-draft vs human-final.

---

## 11. Validation Rules

| Rule                      | Detection                                                                                     | Severity                              |
| ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| Duplicate question number | Same `displayNumber` appears twice in a section                                               | Error                                 |
| Missing options (≠ 4)     | Option count check                                                                            | Error                                 |
| Missing answer            | `correctOption == null`                                                                       | Error                                 |
| Broken numbering          | Non-increasing or gapped sequence                                                             | Warning (unless gap is large → Error) |
| Orphan answer-key entry   | Key references a Q.No not found in extracted questions                                        | Warning                               |
| Duplicate statement text  | Two questions with near-identical statement (fuzzy match)                                     | Warning                               |
| Section imbalance         | A section has drastically fewer questions than expected pattern (e.g. JEE = 25/section)       | Warning                               |
| Formatting corruption     | Statement/option contains high ratio of non-printable/garbled characters (OCR failure signal) | Error                                 |
| Unsupported question type | Detected numerical/non-MCQ format                                                             | Warning (excluded from publish set)   |

All **Error**-severity violations block publish (Sec. 9.3) until resolved; **Warning**-severity surfaces in the UI but does not block.

---

## 12. Error Handling

### 12.1 Recovery Strategy

- **Fail small, not big**: a single unparseable question never aborts the whole document — it's isolated, flagged, and the rest of the paper proceeds (matches Reliability principle).
- **Fail loud, never silent**: any stage that cannot complete its job records a structured `ProcessingError` (Sec. 10.5) rather than swallowing the issue.

### 12.2 Logging

- Structured (JSON) logs per pipeline run: `documentId`, `stage`, `durationMs`, `outcome`, `errorDetails`.
- Logs are the primary input to the accuracy-evaluation loop (Sec. 15) and to future debugging of "why did this paper score low."

### 12.3 Partial Failures

| Failure Point                         | Partial-Failure Behavior                                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| OCR fails on 1 of N pages             | Other pages proceed normally; failed page's content → Manual Review                                                                                   |
| One parser plugin throws mid-document | Pipeline catches, records error, document as a whole routes to Manual Review (no plugin fallback mid-document — too risky to mix two parsers' output) |
| Answer-key extraction fails entirely  | Questions still extracted; all `correctOption = null`; whole paper flagged, still viewable in review                                                  |

### 12.4 Retry Policy

| Stage          | Retry? | Policy                                                                                 |
| -------------- | ------ | -------------------------------------------------------------------------------------- |
| Validation     | No     | Deterministic; retry won't change outcome                                              |
| OCR            | Yes    | Up to 2 retries with backoff (transient library/resource errors only)                  |
| Parsing        | No     | Deterministic on same text input                                                       |
| Database write | Yes    | Standard transactional retry (transient connection errors), idempotent via document id |

---

## 13. Performance

### 13.1 Expected Processing Time (MVP targets)

| Document Type                 | Pages               | Target Time              |
| ----------------------------- | ------------------- | ------------------------ |
| Digital, single paper (~90 Q) | ~20–30              | < 15 seconds             |
| Scanned, single paper (~90 Q) | ~20–30              | < 90 seconds (OCR-bound) |
| Large/multi-shift bundle      | 60 (validation cap) | < 3 minutes              |

### 13.2 Memory Usage

- Pages processed **streaming/one-at-a-time** where possible (render → OCR/parse → discard raster) rather than loading the full document's rasterized images into memory at once — keeps memory flat regardless of page count.
- Target working-set ceiling: a few hundred MB per concurrent job (config-tunable), suitable for a modest free-tier/self-hosted container.

### 13.3 Large PDFs

- Hard page-count cap (Sec. 2.3) prevents pathological inputs.
- Per-page timeout (config) ensures one pathological page (e.g. huge embedded image) can't stall the whole job — it's marked failed and the pipeline continues (12.3).

### 13.4 Scalability

- Service is stateless per request (all state lives in Storage/DB) — horizontally scalable by running multiple FastAPI worker instances behind the same queue/API, with no code change (Docker Ready + Modular Monolith principles from TRD).
- Long-running jobs (OCR-heavy) are designed to run as **background tasks** with a job-status endpoint, not a blocking HTTP request — avoids request timeouts and lets the Next.js frontend poll/subscribe for status.

---

## 14. Security

| Concern                            | Control                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PDF validation**                 | Structural parse must succeed via a hardened PDF library; malformed files rejected before any further processing                                                                                 |
| **Magic-byte checks**              | File must begin with `%PDF-` header bytes regardless of extension/claimed MIME type — extension alone is never trusted                                                                           |
| **File size limits**               | Hard max upload size (config, e.g. 25MB) enforced at API boundary before the file reaches parsing                                                                                                |
| **Page count limits**              | Enforced (Sec. 2.3) to bound worst-case processing cost — mitigates resource-exhaustion attacks                                                                                                  |
| **Safe parsing**                   | PDF parsing library run with external entities/JS execution disabled; no execution of any embedded PDF scripts/actions                                                                           |
| **Temporary file cleanup**         | All intermediate rasters/OCR temp files written to a per-job scoped temp directory, deleted (success or failure) in a `finally`-style guaranteed cleanup step                                    |
| **Path traversal prevention**      | All generated filenames/asset ids are server-generated UUIDs — user-supplied filenames are never used to construct filesystem paths                                                              |
| **Resource exhaustion protection** | Per-page and per-job timeouts (Sec. 13.3); concurrency limits on number of simultaneous OCR jobs; memory ceiling per worker (containerized, Docker resource limits)                              |
| **Storage isolation**              | Uploaded originals and derived assets (images) stored in access-controlled Supabase Storage buckets, never served directly without going through the authenticated backend (ties to Better Auth) |

**Why these matter here specifically:** this service is the **only** part of ExamForge that accepts arbitrary user-uploaded binary files, making it the highest-risk attack surface in the system — hence "Security by Default" gets concrete, enumerated controls rather than a general statement.

---

## 15. Testing

### 15.1 Parser Dataset

- A curated set of real (or realistic, de-identified) JEE Main PDFs covering each supported layout (Sec. 2.1, A–F), digital and scanned, single and multi-section, with and without answer keys.

### 15.2 Golden Files

- For each dataset PDF, a hand-verified **golden JSON** (expected output) is stored alongside it in `tests/golden_files/`.
- A parser run is compared field-by-field against its golden file; any structural mismatch (wrong question count, wrong option text, wrong answer) fails the test.

### 15.3 Regression Tests

- Golden-file tests run on every parser/pipeline change (CI) — prevents a fix for one layout from silently breaking another (critical given the plugin/heuristic-based nature of rule parsing).

### 15.4 Accuracy Evaluation

- Ongoing metric, computed from real review-edit diffs (Sec. 10.6 versioning): **% of questions requiring no reviewer edit** at each confidence tier — validates whether the thresholds in Sec. 8.2 are calibrated correctly, and feeds back into threshold tuning.

### 15.5 Performance Testing

- Load/benchmark tests against the targets in Sec. 13.1 using representative digital and scanned samples, run on the same class of hardware the service will actually deploy to (not just dev-machine numbers).

---

## 16. Future

| Area                        | Direction                                                                                                                                                                                                                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local LLM integration**   | Optional post-parse stage: a locally-hosted open model (e.g. via Ollama) assists with low-confidence question segmentation or OCR-error correction _suggestions_ only — never auto-publishes, always feeds into Manual Review as a suggestion layer. Fits the plugin architecture as an additional optional stage, not a pipeline replacement. |
| **Additional exam parsers** | NEET, CUET, state CETs — implemented as new plugins under `parsers/`, reusing the same pipeline/confidence/review infrastructure untouched.                                                                                                                                                                                                    |
| **New question types**      | Numerical/integer-type, assertion-reason, match-the-column — each added as an extension to the Question model (`questionType` field) and a corresponding extractor, without breaking existing MCQ handling (additive schema versioning, Sec. 10.6).                                                                                            |

---

## Cross-Functional Review Notes

**As Software Architect:** Pipeline stages are decoupled with explicit input/output contracts (3.2), enabling independent evolution and future LLM insertion without re-architecting.

**As Backend Engineer:** Folder structure (4.4) and parser interface (4.1) are concrete enough to start implementation directly; stateless service design (13.4) keeps deployment simple within the Modular Monolith constraint.

**As Security Engineer:** The highest-risk surface (arbitrary file upload) has enumerated, specific controls (Sec. 14) rather than generic "we validate input" language — magic bytes, size/page caps, temp file lifecycle, and path-traversal prevention are all explicit.

**As QA Engineer:** Golden-file regression testing (15.2) plus a live accuracy-evaluation feedback loop (15.4) means confidence thresholds (8.2) aren't guessed once and forgotten — they're empirically tunable as real papers flow through review.

**Improvements made during review:** added per-page (not per-document) classification to correctly handle mixed digital/scanned PDFs; added systemic confidence penalty for answer-key/question count mismatches; made temp-file cleanup and path-traversal prevention explicit rather than implied; clarified that plugin fallback mid-document is intentionally disallowed to avoid mixed-parser corruption.
