---
name: band-connect-developer
description: Senior Full-Stack Engineer (10+ Years Experience) skill for Band Connect development. Enforces 4-layer architecture, BRD business rules, scope isolation, UI/UX aesthetics, and security standards for BandConnect.
---

# Senior Band Connect Engineer & UI/UX Architect (10+ Years Experience)

## Purpose & Scope Isolation
This skill equips the agent with 10+ years of battle-tested full-stack engineering and UI/UX architecture expertise specifically for **BandConnect** (Music Artist, Venue Marketplace & Booking Application).

It enforces strict scope isolation to protect **Mokijo Sports** files while delivering production-grade backend APIs, database migrations, and aesthetic, responsive frontend interfaces.

---

## 🟢 Permitted Scope (Band Connect Files)

All Band Connect development, refactoring, and feature implementation MUST be contained strictly within:

### Frontend (Band Connect)
- `frontend/app/band/` (Main Band Connect user flows, dashboards, bookings, profile)
- `frontend/app/artist/` (Artist portal layout, profile, availability, earnings)
- `frontend/components/band/`
- `frontend/components/artist/`
- `frontend/services/band*Service.js`

### Backend (Band Connect API & Models)
- `backend/app/api/band/` (Auth, artists, venues, bookings, categories, locations, reviews, earnings, settings, notifications, payments)
- `backend/app/api/band_*/`
- `backend/app/models/band_models.py` (Band ORM models)
- `backend/app/models/band_schemas.py` (Band Pydantic schemas)
- `backend/app/features/artists/`, `categories/`, `earnings/`, `locations/`, `reviews/`

---

## 🔴 Protected Scope (DO NOT TOUCH - Mokijo Sports Files)

Do **NOT** edit, modify, or delete any of the following paths:

### Frontend (Mokijo Sports)
- `frontend/app/mokijo/`, `frontend/app/trainings/`, `frontend/app/scoreboard/`, `frontend/app/venue/`, `frontend/app/venues/`, `frontend/app/bookings/`, `frontend/app/user-dashboard/`, `frontend/app/super-admin/`
- `frontend/components/auth/`, `frontend/components/dashboard/`, `frontend/components/trainer-dashboard/`, `frontend/components/venue-dashboard/`, `frontend/components/venue/`, `frontend/components/register/`

### Backend (Mokijo Sports)
- `backend/app/api/mokijo/`, `backend/app/api/activities/`, `events/`, `games/`, `matches/`, `trainer/`, `venue_owner/`, `venues/`, `shared/superadmin/`
- `backend/app/models/models.py`, `backend/app/models/schemas.py`

---

## 🐍 Backend Architecture Standards (4-Layer Pattern)

1. **Router Layer** (`backend/app/api/band/`):
   - Handles route definitions, HTTP status codes, and claims dependency injection (`get_current_client`, `get_current_artist`, `get_current_admin`).
   - No direct database queries or heavy business logic inside routers.
2. **Service Layer** (`.../service.py`):
   - Contains pure business logic, availability conflict checks, pricing models, and event handling.
3. **CRUD Layer** (`.../crud.py`):
   - Encapsulates database access methods using SQLAlchemy 2.0 ORM.
4. **Database Models** (`backend/app/models/band_models.py`):
   - Declarative models using UUID v4 primary keys (`id`).
   - Soft deletion pattern using `deleted_at` timestamp (`WHERE deleted_at IS NULL`).
   - Audit columns on every model: `created_at`, `updated_at`, `deleted_at`.

---

## 🎨 Frontend Architecture & UI/UX Standards

1. **Modern Component & Route Pattern**:
   - Next.js 15+ App Router, React 19, TypeScript strict mode (no `any` types).
   - Form handling using React Hook Form + Zod schema validation.
2. **Design Tokens & Aesthetics (Mokijo Sports UI Standards)**:
   - Built with **Mokijo Sports UI System**: Off-white light canvas (`#f7f7f8`) with radial ambient electric lime glow (`rgba(198,255,61,0.12)`).
   - Elevated pure white cards (`bg-white border border-[rgba(10,10,15,0.08)] rounded-2xl shadow-[0_8px_30px_rgba(10,10,15,0.06)]`).
   - Electric Lime (`#c6ff3d` / `#d9ff6e`) action triggers & focus rings.
   - High-contrast typography (`#0a0a0f` headers, `#5c5c66` body text) and Mokijo Auth components (`AuthShell`, `AuthCard`, `AuthBrand`, `AuthErrorBanner`, `PasswordField`).
   - Spatial rhythm based on 4px/8px baseline grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).
   - Skeleton pulse animations (`animate-pulse`) during async load states.
3. **Role Routing & Dashboard Resolution**:
   - Authenticated role routing enforced via `getRoleDashboard()` in `frontend/utils/role-routes.ts`.

---

## 📜 BRD Business Rule Verification Checklist

- [ ] **Direct Email/Password Auth (No Email Verification Link)**: Skip mandatory email verification link. Users register and can directly log in using email and password.
- [ ] **Unique Artist Usernames**: Validate username format, reserved words, and store without `@` prefix.
- [ ] **Unique Venue Numbers**: System auto-generation of unique venue identifiers using approved `BCV` format (`BCV-XXXXXX`).
- [ ] **Admin Verification Workflow**: Provider profiles require Admin review and verification before becoming eligible for public Marketplace visibility.
- [ ] **Booking Lifecycle State Machine**: Enforce status transitions (`PENDING` → `CONFIRMED` / `REJECTED` → `COMPLETED` / `CANCELLED`) with synchronized status timelines across Client and Provider views.
