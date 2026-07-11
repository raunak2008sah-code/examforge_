# Testing Guide

ExamForge relies on `vitest` for the Next.js backend and `pytest` for the Python parser.

## CI/CD Verification
Every push to `main` and Pull Request will automatically run `.github/workflows/ci.yml`, which triggers typechecking, linting, and automated tests.

## Node.js Services (`apps/web`)

To run the Next.js service tests locally:
```bash
pnpm test
```

### Writing Tests
- Service tests are located alongside the service in a `__tests__` directory (e.g., `src/server/services/__tests__`).
- You can heavily mock `@examforge/db` using `vi.mock('@examforge/db')`.

## Python Parser (`apps/parser`)

To run the Parser service tests locally:
```bash
cd apps/parser
pytest
```

### Writing Tests
- Tests are located in `apps/parser/tests`.
- Utilize `fastapi.testclient.TestClient` to test API routes cleanly.
