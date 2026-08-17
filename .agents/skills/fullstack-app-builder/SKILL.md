---
name: fullstack-app-builder
description: Use this skill whenever the user asks to build, scaffold, or develop a new full-stack application end-to-end (web app, SaaS product, marketplace, booking platform, admin dashboard, mobile app, or a web+mobile product sharing one backend), or to add a new module/feature to an existing app that should follow the same architecture. Also use it when the user references "the stack", "our stack", "standard architecture", or asks to set up a new FastAPI + React project, or a new Flutter mobile app. This skill encodes the exact frontend stack, mobile stack, backend layered architecture, naming conventions, and DevOps setup Sameer uses across his projects (e.g. Mukijo, BandConnect) so every new app is generated consistently instead of improvising a different structure each time.
---

# Full-Stack App Builder

A blueprint for generating a new production-grade application end-to-end using Sameer's standard stack: **React 19 (web)** and/or **Flutter (mobile)** + **FastAPI**, **PostgreSQL**, **Redis/Celery**, and a strict layered backend architecture.

Use this skill as the default scaffold for any new app unless the user explicitly asks for a different stack. If the user is adding a feature to an existing app, match this skill's conventions instead of introducing new patterns. If the target is mobile-only, skip Section 1 and go straight to Section 2; if it's web+mobile, both clients share the same backend built once.

## How to use this skill
1. Confirm scope with the user only if genuinely ambiguous (app name, core domain entities, auth roles, and whether the target is web, mobile, or both). Otherwise infer sensible defaults and proceed.
2. Scaffold the backend first using the Layered Architecture below (models → schemas → crud → service → router), then the client — web (React), mobile (Flutter), or both, per Section 3.
3. Wire up DevOps (Docker Compose, linting, git hooks) so the project is runnable from day one.
4. Follow the naming and error-handling conventions exactly — they are load-bearing for consistency across Sameer's projects.

---

## 1. Frontend Tier — React 19

| Concern | Choice |
| :--- | :--- |
| **Core framework** | React 19 (SPA) |
| **Build tool** | Vite |
| **Routing** | React Router DOM v6+ |
| **Styling** | Tailwind CSS v4 + PostCSS + `tailwindcss-animate` |
| **CSS utilities** | `clsx`, `tailwind-merge`, `class-variance-authority` (CVA) |
| **UI components** | Radix UI Primitives (headless) + Lucide React icons |
| **Global client state** | Zustand |
| **Server state / data fetching** | TanStack React Query (caching, background sync, pagination) |
| **Forms & validation** | React Hook Form + Zod |
| **HTTP client** | Axios with request/response interceptors (attach JWT, handle 401 refresh) |
| **Notifications/modals** | React Hot Toast or Sonner |
| **Testing** | Vitest + React Testing Library |
| **Linting/formatting** | ESLint + Prettier |

### Folder structure:
```
src/
├── api/           # axios instance + per-domain API modules
├── components/    # shared UI (Radix-based, CVA variants)
├── features/      # one folder per domain feature (routes, hooks, components)
├── hooks/
├── stores/        # Zustand stores
├── lib/           # utils, zod schemas shared across features
├── routes/        # React Router route definitions
└── App.tsx
```
Each `features/<domain>/` folder owns its own React Query hooks, Zod schemas, and components — mirrors the backend's per-domain router/service/crud split so frontend and backend features map 1:1.

---

## 2. Mobile Tier — Flutter
Use this when the request is for a mobile app, or a web+mobile product sharing one backend (Sameer's pattern on Mukijo: React web app + Flutter mobile app, same FastAPI backend).

| Concern | Choice |
| :--- | :--- |
| **Core framework** | Flutter (single codebase → iOS + Android) |
| **State management** | Riverpod (or Bloc if the user already uses Bloc elsewhere) |
| **Routing** | go_router |
| **HTTP client** | Dio, with interceptors mirroring the web Axios setup (attach JWT, handle 401 refresh) |
| **Local storage / cache** | Hive or shared_preferences for lightweight data; flutter_secure_storage for tokens |
| **Networking/data models** | freezed + json_serializable for typed models generated from the same API contracts as the backend's Pydantic schemas |
| **Push notifications** | Firebase Cloud Messaging |
| **Realtime** | web_socket_channel, mirroring the backend's WebSocket endpoints used for live sync (e.g. spot-count updates) |

### Folder structure:
```
lib/
├── api/           # dio instance + per-domain API clients
├── features/      # one folder per domain feature (screens, controllers, widgets) — mirrors backend domains & web features/
├── models/        # freezed data classes matching backend schemas.py contracts
├── providers/     # Riverpod providers
├── widgets/       # shared UI components
├── routes/        # go_router route definitions
└── main.dart
```

* **Key rule:** The mobile app's `features/<domain>/` folders should map 1:1 to the backend's `app/domains/<domain>/` folders and the web app's `features/<domain>/` folders — same domain boundaries across all three tiers, just different implementations. Don't duplicate business logic on-device beyond what's needed for optimistic UI/offline caching; the backend's `service.py` remains the source of truth.
* **Auth flow:** Identical contract to web — JWT access + refresh tokens issued by the same `auth` domain endpoints, stored via `flutter_secure_storage` instead of browser storage, refreshed via a Dio interceptor analogous to the Axios one.
* If the user wants mobile without a native shell: confirm whether they actually want Flutter or just a responsive/PWA version of the React app — don't assume Flutter if "mobile-friendly web" is what's meant.

---

## 3. Backend Tier — FastAPI

| Concern | Choice |
| :--- | :--- |
| **Core framework** | Python 3 + FastAPI (async REST API) |
| **ASGI server** | Uvicorn |
| **Validation & settings** | Pydantic v2 + Pydantic-Settings |
| **ORM** | SQLAlchemy 2.0 (Declarative Base, async or sync sessions) |
| **Migrations** | Alembic |
| **Auth** | PyJWT (access + refresh token rotation) + Bcrypt password hashing |
| **Service-to-service HTTP** | HTTPX |
| **Rate limiting / security** | SlowAPI + CORS middleware + security headers |
| **Logging** | Loguru (structured JSON logs with request IDs) |

### Layered Architecture (strict separation of concerns)
Every domain (e.g. `users`, `bookings`, `venues`) gets its own module with these five files:
```
app/domains/<domain>/
├── router.py    # HTTP routes, FastAPI decorators, DI, response_model
├── service.py   # business logic, workflows, third-party integrations
├── crud.py      # SQLAlchemy ORM queries/mutations only
├── schemas.py   # Pydantic BaseModel request/response contracts
└── models.py    # SQLAlchemy declarative table entities
```

#### Rules:
1. `router.py` never talks to the DB directly — it calls `service.py`.
2. `service.py` never builds SQLAlchemy queries directly — it calls `crud.py`.
3. `crud.py` contains no business logic, only queries/mutations.
4. `schemas.py` is the only place request/response shapes are defined; never return ORM models directly from routers.
5. Route handlers use explicit dependency injection: `db: Session = Depends(get_db)`.

### Error handling standard
Centralized domain exception handlers return a uniform JSON envelope:
```json
{"detail": "Human readable message", "error_type": "SOME_ERROR_CODE"}
```
Define domain-specific exceptions (e.g. `SlotAlreadyBookedError`) and register them with FastAPI's exception handler, never raise raw `HTTPException` with ad-hoc bodies from inside `service.py`.

### Code style & naming (PEP 8, enforced by Ruff)
* Functions, methods, variables: `snake_case` (`register_user`, `get_member_profile`)
* Classes, Pydantic models, ORM tables: `PascalCase` (`UserCreate`, `HoldExpiryService`)
* Constants & env vars: `UPPER_CASE_SNAKE` (`DATABASE_URL`, `SECRET_KEY`)
* Explicit type hints everywhere — params, return types, DI dependencies
* 4-space indentation, UTF-8, formatted with `ruff format`, linted with `ruff check --fix`

---

## 4. Database & Background Processing

| Concern | Choice |
| :--- | :--- |
| **Primary DB** | PostgreSQL v16+ (use PostGIS extension if geo features are needed) |
| **Cache / broker** | Redis v7+ |
| **Task queue** | Celery (Worker + Beat for scheduled/cron jobs) |
| **Task monitoring** | Flower dashboard |
| **Lightweight scheduler** | APScheduler (in-process fallback when Celery is overkill) |

Use Redis for short-lived state too — e.g. TTL-based holds/reservations before a payment confirms (reserve-then-confirm pattern), and for WebSocket-driven real-time sync of counts/availability.

---

## 5. Third-Party & Cloud Integrations (pluggable, wire only what's needed)
* **Object storage:** AWS S3 or MinIO via `boto3` for file/media uploads
* **Image processing:** Pillow (resizing, WebP conversion)
* **Payments:** Razorpay or Stripe
* **Email/notifications:** SendGrid or SMTP transactional email

Keep each integration behind a thin service module (`service.py` in an `integrations/` domain) so providers can be swapped without touching business logic.

---

## 6. DevOps, Infra & Quality
* **Containerization:** Docker multi-stage builds; Docker Compose for local dev orchestrating frontend, backend, Postgres, Redis, Celery worker/beat, Flower.
* **Git hooks:** Husky + lint-staged — run ESLint/Prettier on staged `.ts/.tsx` and `ruff check --fix` / `ruff format` on staged `.py` before every commit.
* **Testing:**
  * **Backend:** Pytest + TestContainers (or SQLite/Postgres test DB) — test at the `service.py` and `router.py` layers, mock `crud.py` where useful.
  * **Frontend:** Vitest + React Testing Library — test hooks and components per feature folder.
  * **Mobile:** `flutter_test` + `mocktail` for widget/unit tests, `integration_test` for end-to-end flows.

### Minimal Docker Compose skeleton to scaffold first
```yaml
services:
  backend:
    build: ./backend
    env_file: ./backend/.env
    depends_on: [db, redis]
    ports: ["8000:8000"]
  celery_worker:
    build: ./backend
    command: celery -A app.celery_app worker -l info
    depends_on: [backend, redis]
  celery_beat:
    build: ./backend
    command: celery -A app.celery_app beat -l info
    depends_on: [backend, redis]
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    volumes: ["pgdata:/var/lib/postgresql/data"]
  redis:
    image: redis:7
volumes:
  pgdata:
```

---

## 7. Build order for a brand-new app
1. Scaffold repo: `backend/` (FastAPI skeleton), and whichever clients apply — `frontend/` (Vite + React 19 + Tailwind v4) for web, `mobile/` (Flutter project) for mobile — as separate top-level dirs.
2. Set up `docker-compose.yml`, Postgres, Redis.
3. Backend: config via Pydantic-Settings, `get_db` dependency, base `models.py` (declarative base), Alembic init.
4. Implement the auth domain first (users, JWT access/refresh, bcrypt) — every other domain and every client depends on it.
5. For each core domain entity in the app's spec: create `models.py` → `schemas.py` → `crud.py` → `service.py` → `router.py`, register the router in `main.py`.
6. Set up centralized exception handlers and Loguru request-ID middleware.
7. Web: axios instance + interceptors, Zustand auth store, React Query provider, route skeleton, then one `features/<domain>/` folder per backend domain.
8. Mobile (if applicable): `flutter create`, Dio instance + interceptors, Riverpod providers, go_router skeleton, freezed models matching the backend schemas, then one `features/<domain>/` folder per backend domain — same domain boundaries as web.
9. Wire Husky + lint-staged, Ruff config, ESLint/Prettier config, and `flutter analyze` / `dart format` for mobile.
10. Add Pytest, Vitest, and `flutter_test` scaffolding with one smoke test per layer/client before building out features further.
11. If both web and mobile are requested: build the backend + auth domain once, then fan out — web and mobile are two independent clients against the same API contracts, built in parallel per domain rather than one fully finished before the other starts.

When in doubt about a specific project's exact dependency versions, check if the project already has a `pyproject.toml`/`package.json` and match those versions rather than assuming the latest.
