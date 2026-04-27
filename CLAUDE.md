# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurora HR is a full-stack HRMS (Human Resource Management System) with:
- **Frontend**: Next.js 14 (App Router) + TypeScript + shadcn/ui + Framer Motion + TanStack Query
- **Backend**: FastAPI + SQLAlchemy 2.x + Pydantic v2 + PostgreSQL
- **Auth**: JWT via `python-jose`, bcrypt via `passlib[bcrypt]==1.7.4` + `bcrypt==4.0.1` (pinned — newer bcrypt breaks passlib)

## Running the App

**Backend** (requires Python 3.12 — not 3.14, which is incompatible with SQLAlchemy 2.0.x):
```bash
cd backend
py -3.12 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm run dev        # dev server on port 3000
npm run type-check # tsc --noEmit
npm run lint
npm run build      # production build (output: standalone)
```

**Database setup** (run once on a fresh DB):
```bash
cd backend
py -3.12 -m app.db.init   # creates all tables and seeds admin + leave types
```
Then call `POST /api/v1/auth/seed-admin` if skipping the script.

**Prerequisites:**
- PostgreSQL running on port 5432, database `hrms`
- `backend/.env` with `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`

Default credentials: `admin@hrms.com` / `Admin@123`

## Architecture

### Backend (`backend/app/`)

```
config.py          — pydantic-settings; reads .env
dependencies.py    — FastAPI Depends: get_current_user, require_admin, require_manager
db/
  base.py          — DeclarativeBase + TimestampMixin (created_at, updated_at)
  session.py       — engine, SessionLocal, get_db(), init_db()
  init.py          — standalone script: create tables + seed data
models/            — SQLAlchemy ORM models (UUID PKs, PostgreSQL UUID type)
schemas/           — Pydantic v2 request/response schemas
services/          — business logic layer (called by endpoints)
api/v1/endpoints/  — one file per domain: auth, employees, attendance, payroll, leaves, reports
api/v1/router.py   — mounts all endpoint routers under /api/v1
```

**Request flow:** `endpoint → service → SQLAlchemy session (get_db) → PostgreSQL`

All endpoints are prefixed `/api/v1`. Auth uses OAuth2PasswordBearer; token stored as `hrms_token` in `localStorage`.

**Roles:** `admin` > `manager` > `employee`. Use `require_admin` / `require_manager` / `get_current_user` as FastAPI dependencies.

### Frontend (`frontend/`)

```
app/
  (auth)/login/       — public route, no layout
  (dashboard)/        — route group: applies Sidebar + Header layout, guards with Zustand auth check
    layout.tsx        — redirects to /login if no user in store
    dashboard/        — /dashboard route
    employees/        — /employees
    attendance/       — /attendance
    leaves/           — /leaves
    payroll/          — /payroll
    reports/          — /reports
lib/api.ts            — all API calls: authApi, employeesApi, attendanceApi, payrollApi, leavesApi, reportsApi
store/useAppStore.ts  — Zustand store (persisted): user, token, sidebarCollapsed
types/index.ts        — all shared TypeScript interfaces
hooks/                — TanStack Query hooks per domain (useEmployees, useAttendance, useLeaves, usePayroll)
components/ui/        — shadcn/ui primitives (Radix UI based)
components/layout/    — Sidebar, Header
```

**Data flow:** page component → custom hook (`hooks/`) → `lib/api.ts` → FastAPI backend. All server state via TanStack Query; all UI/auth state via Zustand.

**Important:** `lib/api.ts` is the single source of truth for API methods. Hook files in `hooks/` must only call methods that exist in `lib/api.ts` — mismatches cause runtime errors.

### Key Constraints

- **Radix UI `<SelectItem>`** requires a non-empty `value` prop. Use a sentinel like `"all"` instead of `""` for "all items" options.
- **`next.config.ts`** has `output: "standalone"` and `turbopack.root: __dirname` — do not remove these.
- **Tables are not auto-created** on backend startup (no lifespan hook). Run `py -3.12 -m app.db.init` on a fresh database before first use.
- **`bcrypt` must stay at `4.0.1`** — version 5.x removes `__about__` which passlib 1.7.4 requires.
- The JWT token is stored in both `localStorage` (`hrms_token`) and Zustand store. The axios interceptor in `lib/api.ts` reads from `localStorage`; the layout guard reads from Zustand.
- `downloadBlob()` in `lib/api.ts` is the shared utility for all file downloads (payslips, NEFT, reports).
