# 01 — Product Requirements Document (PRD)

**Project:** ExamForge _(temporary name)_
**Status:** Draft v0.1 — for review
**Owner:** Solo founder/developer

---

## 1. Why This Document Exists

The PRD defines **what** we are building and **for whom**, before any technical decisions are made. Every later document (TRD, UI/UX, Document Processing, Database/API, Roadmap) must trace back to a requirement stated here. If a feature isn't justified by this document, it doesn't belong in v0.

---

## 2. Problem Statement

Teachers and students preparing for competitive exams (JEE Main, NEET, CUET, board exams) commonly have question papers only as PDFs. Practicing under real exam conditions — timed, on-screen, with instant scoring — requires manually building a digital test, which is slow and usually skipped. There is no free, self-serve way to turn an existing question paper PDF into a real Computer-Based Test (CBT) experience.

---

## 3. Vision vs. v0 Scope

|                | Vision (long-term)                                  | v0 (this PRD)                                             |
| -------------- | --------------------------------------------------- | --------------------------------------------------------- |
| Users          | Schools, coaching institutes, thousands of students | Founder + a small group of known students, for validation |
| Formats        | JEE Main, NEET, CUET, CBSE, and more                | **JEE Main only**                                         |
| Question types | MCQ, MSQ, Numerical, Assertion-Reason, Subjective   | MCQ only                                                  |
| AI             | Possibly local/cloud AI-assisted extraction         | Rule-based parser only, ₹0 budget, no paid APIs           |
| Infra          | Possibly split services, multi-region               | Monorepo, single deployment                               |

**Everything in this PRD describes v0 unless explicitly marked "Future."**

---

## 4. Goals

- Prove that a question paper PDF + answer key PDF can be reliably converted into a working CBT with minimal manual correction.
- Deliver a CBT-taking experience that feels like a real exam (timer, palette, mark-for-review, auto-submit).
- Get real students to take a real test end-to-end and receive an instant, accurate result.
- Build the parsing pipeline as a **pluggable interface** so adding NEET/CUET/CBSE later means writing a new parser module, not touching existing code.

## 5. Non-Goals (v0)

- Supporting any format other than JEE Main.
- Supporting any question type other than MCQ.
- Multi-tenant institution accounts, billing, or public sign-up.
- Analytics beyond basic score/accuracy/review (topic analysis, difficulty prediction, etc. are Future).
- Mobile app, offline mode.

---

## 6. Target Users (v0)

| Persona                        | Description                | Primary need                                                                             |
| ------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------- |
| **Admin (you)**                | Builds and publishes tests | Upload a JEE Main paper + answer key, get a clean editable question set fast, publish it |
| **Student (validation group)** | Known students you invite  | Take a realistic timed CBT, get an instant, trustworthy result                           |

_No public registration in v0 — admin invites/creates student accounts._

---

## 7. Core User Flows

### 7.1 Admin: PDF → Published Test

1. Log in as admin.
2. Upload JEE Main question paper PDF + answer key PDF.
3. System runs the JEE Main parser → extracts questions, options, correct answers.
4. Admin reviews extraction in a preview screen; corrects any errors inline.
5. Admin configures duration, marking scheme (including negative marking), instructions.
6. Admin publishes the test.

### 7.2 Student: Take the CBT

1. Log in as student.
2. See available exam(s) → read instructions page.
3. Start exam → full CBT interface (timer, palette, question navigation).
4. Submit (manually or auto-submit on timeout).
5. Instantly see score, accuracy, correct/incorrect/skipped breakdown, and full answer review.

---

## 8. Feature Scope (v0)

### Must Have (P0)

- [ ] Admin auth (single admin account is acceptable for v0)
- [ ] Student auth (admin-created accounts; no public self-registration)
- [ ] PDF upload (question paper + answer key)
- [ ] JEE Main parser: text extraction → question/option/answer detection
- [ ] Admin review/edit screen for extracted questions before publish
- [ ] Manual question creation/edit (fallback when parsing fails)
- [ ] Exam configuration: duration, marks per question, negative marking, instructions
- [ ] Publish/unpublish exam
- [ ] Student dashboard: list of available exams
- [ ] Instructions page before starting
- [ ] CBT interface: question palette, timer, previous/next, save & next, mark for review, clear response, jump to question, submit confirmation, auto-submit on timeout
- [ ] Automatic evaluation on submit
- [ ] Result page: score, correct/incorrect/skipped, accuracy, time taken, full answer review

### Should Have (P1 — soon after v0 validates)

- [ ] Attempt history (multiple past attempts)
- [ ] Basic section support (if JEE Main paper has sections)
- [ ] Second parser module (NEET or CUET — whichever validation group needs next)

### Won't Have (v0 — explicitly deferred)

- MSQ, Numerical, Subjective, Assertion-Reason question types
- Topic/difficulty analytics
- Institution/teacher/multi-role dashboards
- Public sign-up, billing, scheduling, visibility rules
- Image-based questions
- Mathematical equation rendering

---

## 9. Success Criteria for v0

v0 is successful if **all** of the following are true:

1. A real JEE Main question paper PDF can be uploaded and parsed with ≤10–15% of questions needing manual correction (target, to be refined once we see real extraction accuracy).
2. At least one validation student completes a full timed CBT attempt without technical failure.
3. The result shown matches a hand-checked score exactly.
4. Admin can go from "PDF uploaded" to "test published" in under 30 minutes for a paper that parses cleanly.

---

## 10. Constraints

| Constraint          | Detail                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Budget              | ₹0 — no paid AI APIs, no paid infra beyond free tiers                                                                                                                      |
| Team                | Solo developer + AI assistance                                                                                                                                             |
| Document processing | Rule-based parsing only for v0; local AI is future, not v0                                                                                                                 |
| Architecture        | Monorepo (Next.js + Python processing service together initially); parser modules must implement a common interface so new formats don't require touching existing parsers |
| Auth provider       | Not yet decided — Clerk vs. Auth.js vs. self-hosted open-source option to be evaluated in `02-TRD.md`, weighing cost, self-hosting, and vendor lock-in given the ₹0 budget |

---

## 11. Key Risks

| Risk                                                                                | Impact                                               | Mitigation                                                                                                                      |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| JEE Main paper layout isn't as consistent as assumed (different years/sources vary) | Parser accuracy drops, more manual correction needed | Admin review/edit screen is P0, not optional; pick 2–3 real sample papers early to test against before building the full parser |
| Solo dev bandwidth                                                                  | Scope creep delays validation                        | Non-goals list above is a hard boundary for v0 — resist adding formats/question types until JEE Main pipeline is proven         |
| Auth decision deferred                                                              | Could block TRD progress if not resolved promptly    | Time-box the evaluation in `02-TRD.md`; don't let it stall the project                                                          |

---

## 12. Open Questions (carry into next documents)

- Exact JEE Main paper source/template to build the parser against (which year/provider format specifically) — needed before `04-Document-Processing.md`.
- Final auth provider decision — needed before `02-TRD.md` is finalized.
- Whether the validation group size (how many students) affects any infra choices — likely not at this scale, but worth confirming.

---

_This document is complete pending your review. Once approved, we move to `02-TRD.md` (Technical Requirements Document), where we'll resolve the auth decision and lock the monorepo structure._
