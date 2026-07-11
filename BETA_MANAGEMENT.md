# ExamForge Beta Management Strategy

This document outlines the GitHub label taxonomy, milestones, prioritization framework, and triage workflow for the ExamForge Closed Beta and beyond.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 1. GitHub Labels

Apply these labels to issues and pull requests to maintain repository organization.

### Type
- `bug` - Something isn't working as intended.
- `enhancement` - A new feature or improvement to an existing feature.
- `parser` - Specifically related to PDF parsing, OCR, or text extraction.
- `ui_ux` - Design, layout, or user experience feedback.
- `performance` - Speed, load times, or resource exhaustion.
- `security` - Vulnerabilities or authentication/authorization flaws.
- `documentation` - Readmes, inline comments, or deployment guides.
- `testing` - Missing tests, flaky tests, or QA tasks.

### Severity
- `critical` - P0 production blockers (app crash, data loss).
- `high` - P1 major functionality broken.
- `medium` - P2 important bugs that degrade experience but have workarounds.
- `low` - P3 minor bugs or cosmetic issues.

### Status & Origin
- `beta-feedback` - Issues directly sourced from Closed Beta testers.
- `duplicate` - This issue already exists.
- `wontfix` - Not aligned with product vision or technologically unfeasible.
- `good first issue` - Easy tasks suitable for onboarding new contributors.

### Scope
- `frontend` - Next.js React client, CSS, UI logic.
- `backend` - Next.js API Routes, Database, Authentication.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 2. GitHub Milestones

Milestones are used to group issues into actionable sprints/releases.

1. **`v0.1.0 Closed Beta`**: Launch of the basic Upload -> Parse -> Take Exam flow. Focus on stability.
2. **`v0.1.1 Hotfix`**: Immediate patches for critical/high bugs discovered during the first days of Closed Beta.
3. **`v0.2 Parser Accuracy`**: Focused exclusively on improving the Python FastAPI parser, formula extraction, and OCR confidence.
4. **`v0.3 AI Improvements`**: Integration of LLMs for better question categorization and unstructured data handling.
5. **`v1.0 Public Release`**: Final production hardening, complete analytics dashboard, and open signups.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 3. Prioritization Rules

Strictly adhere to this prioritization matrix to prevent scope creep during Beta.

- **P0 (Critical)**: Production blocker. The system crashes, users cannot log in, data is actively being corrupted, or there is a security vulnerability. **Action:** Drop everything, fix immediately, deploy Hotfix.
- **P1 (High)**: Major functionality broken. Uploads fail consistently, the parser crashes on standard PDFs, or the exam timer prevents submission. **Action:** Must be fixed before the next minor release (e.g., v0.1.1).
- **P2 (Medium)**: Important bug. The parser consistently hallucinates certain characters, UI elements overflow on mobile, or certain API requests are unoptimized. **Action:** Add to the active milestone backlog.
- **P3 (Low)**: Minor bug. Typos, slight alignment issues, or edge-case UI glitches. **Action:** Fix when touching related code, or mark as `good first issue`.
- **P4 (Nice-to-have)**: Enhancement. User requested a dark mode toggle or an analytics chart. **Action:** Throw in the backlog for post v1.0 unless strategically important.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 4. Triage Workflow

Every issue follows this lifecycle to ensure nothing falls through the cracks:

1. **`NEW`**: Issue created by a tester or script. Unassigned, unprioritized.
2. **`TRIAGED`**: PM/QA reviews the issue. Labels, Milestone, and Priority (P0-P4) are assigned.
3. **`IN PROGRESS`**: An engineer assigns the issue to themselves and begins work. Draft PR created.
4. **`IN REVIEW`**: Code is complete. PR is marked "Ready for Review" and awaits peer validation.
5. **`TESTING`**: Merged to the `main` or `staging` branch. QA validates the fix against the original bug report.
6. **`READY FOR RELEASE`**: Confirmed fixed. Waiting for the next deployment train (e.g., v0.1.1).
7. **`CLOSED`**: Deployed to production. Users notified.
