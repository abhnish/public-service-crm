# Smart Public Service CRM

[![Node](https://img.shields.io/badge/node-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)
[![Docker](https://img.shields.io/badge/docker-enabled-blue)](https://www.docker.com/)

A modern civic complaint and grievance redressal platform that helps citizens raise issues, enables officers to resolve them quickly, and gives administrators actionable operational visibility through analytics, real-time events, and AI-assisted insights.

---

## Table of Contents

- [Overview](#overview)
- [Core Capabilities](#core-capabilities)
- [Product Roles & Workflows](#product-roles--workflows)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Option A: Docker Compose (Recommended)](#option-a-docker-compose-recommended)
  - [Option B: Local Development](#option-b-local-development)
- [Configuration](#configuration)
- [API Surface (Selected)](#api-surface-selected)
- [Frontend Routes (Selected)](#frontend-routes-selected)
- [Data & Seeding](#data--seeding)
- [Testing & Quality Checks](#testing--quality-checks)
- [Deployment Notes](#deployment-notes)
- [Observability](#observability)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Maintainers](#maintainers)

---

## Overview

Municipal complaint handling is often fragmented and opaque: citizens do not get timely updates, officers lack prioritization support, and administrators struggle to identify systemic trends. **Smart Public Service CRM** addresses this with:

- Structured complaint intake and lifecycle management.
- Role-aware dashboards for citizens, officers, and administrators.
- Real-time updates using Socket.IO.
- SLA monitoring and escalation support with background jobs.
- Public transparency reporting and optional AI-assisted governance insights.

---

## Core Capabilities

- **Complaint lifecycle management**: create, track, assign, update, and close complaints.
- **Role-based access control**: separate citizen, officer, and admin views/permissions.
- **AI-assisted operations**: support for classification, prioritization, and governance copilot workflows.
- **Real-time notifications**: instant updates for operational dashboards.
- **Public transparency portal**: aggregated data access, including CSV export.
- **Attachment upload flow**: presigned upload mechanism for S3-compatible storage.
- **Predictive analytics hooks**: admin-facing prediction endpoints.

---

## Product Roles & Workflows

### Citizens
- Register/login.
- Submit complaints with details and optional evidence.
- Track progress and status updates.

### Officers
- View and manage assigned complaints.
- Update status and add operational notes.
- Resolve issues within SLA windows.

### Administrators
- Oversee city-wide complaint operations.
- Monitor trends and department performance.
- Use copilot/prediction endpoints for decision support.

---

## Architecture

High-level architecture:

1. **Frontend** (`frontend/`): React + Vite client with role-aware dashboards.
2. **Backend API** (`backend/`): Express + TypeScript REST APIs with auth, complaints, uploads, notifications, and analytics endpoints.
3. **Data Layer**: PostgreSQL (system of record), Redis (queue/cache), object storage via MinIO/S3 for attachments.
4. **Realtime & Jobs**: Socket.IO for live updates and Bull/BullMQ-based background processing.

> Optional architecture diagram path: `docs/architecture.png`.

---

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- React Router
- Leaflet / React-Leaflet
- Recharts
- Socket.IO client

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- JWT auth
- Bull / BullMQ + Redis
- Socket.IO
- Prometheus metrics endpoint

### Infrastructure
- PostgreSQL
- Redis
- MinIO (S3-compatible object storage)
- Docker Compose

---

## Repository Structure

```text
public-service-crm/
├── backend/                  # Express + TypeScript backend
│   ├── prisma/               # Prisma schema, migrations, seed scripts
│   ├── src/                  # API routes, controllers, services, middleware
│   └── data/                 # JSON demo/reference data
├── frontend/                 # React + Vite frontend
│   └── src/                  # Pages, components, app routing
├── docker-compose.yml        # Local infra + app orchestration
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or compatible package manager)
- Docker + Docker Compose (recommended for local infra)

### Option A: Docker Compose (Recommended)

Run all core services:

```bash
docker compose up --build
```

This starts:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:5001`
- PostgreSQL on `localhost:5433`
- Redis on `localhost:6379`
- MinIO on `http://localhost:9000`

> Note: The compose file maps backend container port `5000` to host `5001`.

### Option B: Local Development

Start infrastructure dependencies first:

```bash
docker compose up postgres redis minio -d
```

Backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Frontend (in a second terminal):

```bash
cd frontend
npm install
npm run dev
```

Optional demo data generation:

```bash
cd backend
npm run seed:demo
```

---

## Configuration

Create `.env` files as needed (backend and frontend). Typical backend settings include:

```env
# Core app
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace-me

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/civiccrm

# Redis
REDIS_URL=redis://localhost:6379

# S3/MinIO
AWS_REGION=us-east-1
AWS_BUCKET=smart-crm-uploads
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_ENDPOINT=http://localhost:9000

# Optional AI / observability
GEMINI_API_KEY=
SENTRY_DSN=
```

Frontend:

```env
VITE_API_URL=http://localhost:5001
```

---

## API Surface (Selected)

Auth & identity:
- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `POST /api/temp-register`
- `POST /api/temp-login`
- `GET /api/temp-me`

Core platform:
- `GET /api/health`
- `GET /api/wards`
- `GET /api/departments`
- `GET /api/officers`

Complaints:
- `POST /api/complaints`
- `GET /api/complaints`
- `GET /api/complaints/:id`
- `PUT /api/complaints/:id`
- `DELETE /api/complaints/:id`
- `POST /api/complaints/dev/sla-trigger/:complaintId`

Uploads, notifications, analytics:
- `POST /api/uploads/presign`
- `GET /api/notifications`
- `GET /api/notifications/unread`
- `PUT /api/notifications/:id/read`
- `POST /api/notifications`
- `POST /api/admin/copilot`
- `GET /api/admin/predictions`
- `GET /api/transparency`
- `GET /api/transparency/csv`
- `GET /api/metrics/metrics`

---

## Frontend Routes (Selected)

- `/` – Landing page
- `/login` – Login
- `/register` – Registration
- `/submit-complaint` – Complaint creation flow
- `/my-complaints` – Citizen complaint history
- `/dashboard` – Main dashboard area
- `/admin` – Admin dashboard
- `/admin/complaints` – Admin complaint management
- `/officer` – Officer workspace
- `/transparency` – Public transparency portal

---

## Data & Seeding

The backend includes seed and generator scripts under `backend/prisma/`.

Useful scripts:

```bash
# Prisma client generation
npm run prisma:generate

# Dev migrations
npm run prisma:migrate

# Seed data (TypeScript seed)
npm run prisma:seed

# Demo dataset generator
npm run seed:demo
```

---

## Testing & Quality Checks

Backend:

```bash
cd backend
npm test
```

Frontend build verification:

```bash
cd frontend
npm run build
```

---

## Deployment Notes

For production hardening, consider:

- Managed PostgreSQL + automated backups.
- Managed Redis and queue monitoring.
- Managed S3 bucket + lifecycle policies for attachments.
- Secure secret management (Vault, cloud secret manager, or CI secrets).
- HTTPS termination and reverse proxy (Nginx/Traefik/API gateway).
- CI pipeline for lint/test/build and controlled migrations.

---

## Observability

- Prometheus-style metrics endpoint: `GET /api/metrics/metrics`
- Structured backend logs for operational visibility.
- Optional Sentry DSN integration for error tracking.

---

## Troubleshooting

### Backend cannot connect to PostgreSQL
- Verify `DATABASE_URL` host/port and credentials.
- Confirm Postgres is running (`docker compose ps`).
- Ensure migrations have been applied.

### Frontend cannot call API
- Verify `VITE_API_URL` points to backend host port (`5001` with compose defaults).
- Check CORS settings (`CORS_ORIGIN`) on backend.

### Upload failures
- Confirm MinIO/S3 endpoint and credentials.
- Ensure bucket exists and access policy is correct.

### Real-time updates not appearing
- Confirm Socket.IO connectivity and auth token flow.
- Check Redis availability if worker-driven updates are expected.

---

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/<name>`
3. Make focused changes with clear commits.
4. Run tests/build checks locally.
5. Open a pull request with context and validation details.

---

## License

Licensed under the MIT License. See [`LICENSE`](./LICENSE).

---

## Maintainers

- abhnish.1289@gmail.com
- dev24.chinmay@gmail.com

Built for practical, transparent, and accountable public service delivery.
