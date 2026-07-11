# Local Development Guide

## Prerequisites
- Node.js 20+
- pnpm 8+
- Python 3.10+ (If running parser locally without Docker)
- Docker Desktop

## Option A: Full Docker Compose (Recommended)
This method spins up Next.js, the FastAPI Parser, and PostgreSQL.

```bash
cp .env.example .env
docker compose up --build
```

The frontend will be available at `http://localhost:3000` and the parser at `http://localhost:8000`.

## Option B: Native Development
If you prefer running services natively for hot-reloading:

### 1. Database
```bash
# Spin up just the DB
docker compose up db -d
```

### 2. Next.js App
```bash
cp .env.example .env
# Edit .env to point to the correct local DB port if needed
pnpm install
pnpm dev
```

### 3. FastAPI Parser
```bash
# Use the automated script
.\start-parser.ps1
```
*Note: You may need to manually install `tesseract-ocr` and `poppler-utils` on your host machine for the OCR fallback to work natively.*
