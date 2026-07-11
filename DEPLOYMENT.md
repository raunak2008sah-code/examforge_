# Deployment Guide

ExamForge is containerized using multi-stage Docker builds, making it agnostic to hosting providers.

## Production Services Needed
1. **Managed PostgreSQL Database:** Provide `DATABASE_URL` and `DIRECT_URL` (for Prisma).
2. **Supabase Storage Bucket:** Provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Docker Images
The repository defines two isolated Dockerfiles.

### Web Server (Next.js)
Path: `apps/web/Dockerfile`
Build command: `docker build -t examforge-web -f apps/web/Dockerfile .`
- Runs as a non-root user.
- Utilizes Next.js standalone output to keep the image size small.
- Exposes port `3000`.

### Parser Server (FastAPI)
Path: `apps/parser/Dockerfile`
Build command: `docker build -t examforge-parser ./apps/parser`
- Installs `tesseract-ocr` natively.
- Runs via `uvicorn` on port `8000`.

## Health Monitoring
In production environments (like Kubernetes or AWS ECS), configure your load balancers to poll:
- Next.js: `GET /api/health`
- FastAPI: `GET /health`
