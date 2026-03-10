# Smart Public Service CRM

[![Node](https://img.shields.io/badge/node-18-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18-blue)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)
[![Docker](https://img.shields.io/badge/docker-enabled-blue)](https://www.docker.com/)

**Smart Public Service CRM** is an **AI-powered civic complaint management platform** that helps citizens submit grievances, enables officers to manage and resolve requests, and gives administrators predictive insights and public transparency — all with real-time updates, automated SLA escalation, and an AI governance copilot.

---

## Table of Contents
- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [System Architecture](#system-architecture)
- [Demo Flow](#demo-flow)
- [Quick Start](#quick-start-run-everything-via-docker-compose)
- [Local Development](#local-development-native-hot-reload)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints-selected)
- [Frontend Pages](#frontend-pages)
- [Testing](#testing)
- [Deployment & CI/CD](#deployment--cicd)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Contact / Demo](#contact--demo)

---

## Problem Statement

Municipal complaint systems are often fragmented, slow, and opaque. Citizens file issues but rarely get timely updates; officers struggle to prioritize and route tickets; and administrators lack clear, actionable analytics.

---

## Solution Overview (Elevator pitch)

Smart Public Service CRM provides:
- Intelligent complaint classification & priority scoring (AI)
- Real-time officer & admin dashboards (Socket.IO)
- SLA monitoring & automated escalation (Redis + BullMQ)
- Secure attachments (S3/MinIO presigned uploads)
- Public transparency portal and AI Copilot for governance insights

## Key Features

- **AI Complaint Classification** — Auto-categorize incoming complaints (category, urgency, sentiment).
- **Priority Scoring Engine** — Compute a normalized priority score using urgency, sentiment, and location sensitivity.
- **SLA Escalation Automation** — Background workers monitor deadlines and create escalations if needed.
- **Real-Time Dashboards** — Admins and officers receive instant updates via WebSockets.
- **Interactive Civic Heatmap** — Geo-visualization of complaints using Leaflet and clustering.
- **AI Governance Copilot** — Natural-language queries for admins to analyze trends and get recommendations.
- **Duplicate Detection** — Embedding-based similarity suggestions at complaint creation.
- **Secure File Uploads** — S3/MinIO presigned URLs for client-side uploads.
- **Progressive Web App (PWA)** — Offline drafts and installable frontend.
- **Predictive Analytics** — Lightweight forecasting for complaint surges and SLA breach prediction.
- **Public Transparency Portal** — Aggregated, anonymized public metrics and CSV export.

---

## Architecture

Modular backend (Express + TypeScript + Prisma) + AI layer + Redis workers + Socket.IO real-time layer + PostgreSQL + S3-compatible storage; React + Vite frontend (PWA) with Leaflet heatmap.

## System Architecture

> (Place the architecture image at \docs/architecture.png\ in the repository so it renders here.)

![System Architecture](docs/architecture.png)

### Architecture Overview

The system is organized into the following layers:

1. **User Layer** — Citizens, Officers, Admins, Public users.
2. **Frontend Layer** — React + Vite app (Citizen Portal, Officer Dashboard, Admin Panel, Transparency page).
3. **Backend API Layer** — Node.js + Express services:
   - Auth (JWT)
   - Complaint Service
   - Notification Service
   - Copilot AI Service
   - Analytics Service
4. **Realtime / Worker Layer**
   - **Socket.IO** for real-time notifications and dashboard updates.
   - **BullMQ (Redis)** for scheduled SLA monitoring and background tasks.
   - **Redis** as job queue and cache.
5. **AI Layer**
   - Complaint classifier (embeddings or LLM)
   - Priority scoring engine
   - Copilot (LLM-backed analysis)
   - SLA breach & surge predictors
6. **Data Layer**
   - **PostgreSQL** (Prisma ORM) — main relational store
   - **S3 / MinIO** — attachments
   - Monitoring & logging: **Prometheus** metrics, **Sentry** for errors

This architecture provides scalability, fault isolation, and the ability to iterate on AI components independently.

## Demo Flow

1. Login as Citizen -> Submit a complaint with location and photo.
2. AI classifies it (category, urgency) and computes priority score.
3. Complaint is auto-routed / auto-assigned or placed in officer queue.
4. Admin receives real-time update on the dashboard; officer sees assignment instantly.
5. Officer resolves complaint; SLA worker cancels escalation job.
6. Admin asks Copilot: "Why are complaints rising in Ward 3?" — Copilot returns analysis & recommendations.
7. Public transparency portal shows aggregated metrics.

---

## Quick Start (Run everything via Docker Compose)

> This starts the full stack: frontend, backend, PostgreSQL, Redis, MinIO (S3), and worker.

\\\ash
# Clone
git clone <repository-url>
cd smart-public-service-crm

# Start all services (build images)
docker compose up --build
\\\

## Local Development (native, hot-reload)

Prerequisites:
- Node.js (v16+)
- pnpm / npm / yarn (your preference)
- Docker (for DB/Redis/MinIO)

### Start backing services (DB + Redis + MinIO)
\\\ash
docker compose up postgres redis minio -d

cd backend
npm install

# run prisma migrations (adjust PORT/URL if using custom ports)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/civiccrm" npx prisma migrate dev --name init
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/civiccrm" npx prisma generate

# seed (SQL or JS)
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d civiccrm -f prisma/seed.sql

# start dev server
npm run dev

cd frontend
npm install
npm run dev

cd backend
npm run seed:demo
\\\

## Environment Variables

Copy \.env.example\ -> \.env\ and fill the values.

Example \.env\ (development):

\\\env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/civiccrm

# App
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-secure-random

# AI
GEMINI_API_KEY=your-gemini-api-key-or-empty-for-fallback

# Email (dev: use Mailtrap or your Gmail app password)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
EMAIL_FROM=your-email@example.com

# S3 / MinIO (dev)
S3_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY=dev
AWS_SECRET_KEY=dev
AWS_REGION=us-east-1
AWS_BUCKET=smart-crm-uploads

# Redis
REDIS_URL=redis://localhost:6379

# Sentry (optional)
SENTRY_DSN=

# Misc
AI_SERVICE_API_KEY=dev-key
\\\

## API Endpoints (selected)

- \GET /api/health\ — health check
- \POST /api/register\ — register user
- \POST /api/login\ — login -> returns JWT
- \GET /api/me\ — get current user
- \POST /api/complaints\ — create complaint (citizen)
- \GET /api/complaints\ — list complaints (role-based)
- \GET /api/complaints/:id\ — complaint detail
- \PUT /api/complaints/:id\ — update complaint (assign/status)
- \DELETE /api/complaints/:id\ — soft delete (admin)
- \POST /api/uploads/presign\ — get presigned S3/MinIO URL
- \POST /api/admin/copilot\ — AI governance copilot query (admin)
- \GET /api/admin/predictions\ — complaint predictions (admin)
- \GET /api/transparency\ — public metrics
- \GET /api/metrics\ — Prometheus metrics endpoint

---

## Frontend Pages

- \/\ — Home / Landing
- \/login\ — Login
- \/register\ — Register
- \/submit-complaint\ — Submit complaint (map picker, attachments)
- \/my-complaints\ — Citizen requests
- \/admin\ — Admin dashboard (Copilot, predictions, heatmap)
- \/officer\ — Officer dashboard (assigned tickets)
- \/transparency\ — Public transparency portal

---

## Testing

- **Unit tests**: backend services (priority util, aiService fallback)
- **Integration tests**: endpoints for complaint creation & assignment
- **E2E**: Cypress script for demo flow (register -> submit -> assign -> resolve)

Run tests:
\\\ash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
\\\

## Deployment & CI/CD

We include sample GitHub Actions workflows:

- \ci.yml\ — run lint, unit tests, build
- \deploy.yml\ — build Docker images and deploy to staging/production (Render/Railway)

### Production checklist
- Use managed Postgres (RDS/CloudSQL)
- Use managed Redis (Elasticache/MemoryStore)
- Use S3 (AWS) for attachments and CloudFront for CDN
- Store secrets in a secret manager (GitHub Secrets / Vault)
- Enable HTTPS and health checks
- Configure automatic DB backups and migration testing

---

## Monitoring & Observability

- **Prometheus** metrics exposed at \/api/metrics\
- **Sentry** for runtime errors (\SENTRY_DSN\ in env)
- **Winston** structured logging (JSON)
- Dashboard alerts for SLA breach rate and job failures

---

## Troubleshooting

**Database connection failed**
- Check \DATABASE_URL\ and port (default \5433\ for Docker setup)
- Ensure \docker compose up\ started Postgres and it is healthy

**Email not sending**
- For development use Mailtrap or Gmail app password. Check SMTP settings.

**File upload failing**
- Ensure S3/MINIO endpoint and credentials are correct.
- For MinIO development: visit \http://localhost:9000\ and check bucket + credentials.

**Socket.IO connection problems**
- Verify frontend uses correct backend URL and the token is passed during socket auth.

---

## Contributing

1. Fork the repo
2. Create a feature branch: \git checkout -b feature/<name>\
3. Commit changes with clear messages
4. Push and open a Pull Request to \develop\
5. Add tests and ensure CI passes

Add \CODEOWNERS\ if you want to require approvals for backend/frontend folders.

---

## License

This project is released under the **MIT License** — see \LICENSE\.

---

## Contact / Demo

If you want help running the project or need a live demo for the hackathon, ping the maintainer:

- **Email**: abhnish.1289@gmail.com
- **Email**: dev24.chinmay@gmail.com

---

> Thanks for using **Smart Public Service CRM** — built with civic tech, AI, and practical engineering to help governments deliver better public services.
