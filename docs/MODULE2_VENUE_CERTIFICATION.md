# MODULE 2 — VENUE PORTAL
# CERTIFICATION REPORT

**Project**: BandConnect — Music Band Booking Platform
**Module**: Module 2 — Venue Portal
**Certified By**: Chief Solution Architect & QA Lead
**Certification Date**: 2026-07-17
**Report Version**: 1.0
**Classification**: Internal Engineering Document

---

## CERTIFICATION STATUS

```
MODULE 2 – VENUE PORTAL

  ✅ CERTIFIED

  All acceptance criteria satisfied.
  All backend tests pass (0 failures).
  All frontend build checks compile successfully (0 errors).
```

---

## Table of Contents

1. Module Overview
2. Architecture Summary
3. Discovery (Pages, Components, Databases)
4. Backend Certification
5. Database Certification
6. Frontend Certification
7. Security & Guard Certification
8. API Endpoint Catalog
9. E2E Business Flow
10. Issues Discovered & Resolved
11. Test Results
12. Final Certification Result

---

## 1. Module Overview

Module 2 covers the complete Venue Owner Portal and registration onboarding wizard. It allows venue owners to create event space profiles, list capacities, specify operational hours and pricing models, upload identity/business verification documents, select facility options, inspect performance/revenue datasets on a rich dashboard widget feed, and manage settings (email alerts, visibility profile, status toggles).

---

## 2. Architecture Summary

### Backend Architecture

| Layer | File Path | Responsibility |
|-------|-----------|----------------|
| Router (Admin) | `backend/app/features/venues/router.py` | Admin venue list, verify status updates, suspend, activate |
| Router (Public/Owner) | `backend/app/features/venues/public_router.py` | Owner profiles, media, availability, facilities, public listings |
| Service Layer | `backend/app/features/venues/service.py` | Profile creation, availability conflict check, dashboard calculations |
| Repository Layer | `backend/app/features/venues/crud.py` | SQL execution, join queries, custom user/city filter operations |
| Models | `backend/app/features/venues/models.py` | venues model & venue_categories junction table declarations |
| Schemas | `backend/app/features/venues/schemas.py` | Pydantic validation request/response formats |

### Frontend Architecture

| Component/Page | File Path | Responsibility |
|----------------|-----------|----------------|
| Registration Wizard | `frontend/components/venue/VenueRegisterForm.tsx` | 10-step form wizard for registering owner + venue details |
| Portal Pages | `frontend/app/venue/*` | Dashboard, analytics, bookings, calendar, earnings, profile, reviews, verification |
| Edge Guard Layout | `frontend/app/venue/layout.tsx` | Verifies user has a `venue_owner` role and has registered a venue space |
| API Service | `frontend/services/venueService.ts` | Axial requests mapping to backend endpoints |

---

## 3. Discovery

### Pages Discovered

| Page Name | Path | Description |
|-----------|------|-------------|
| Onboard Venue | `/register/venue` | 10-step wizard form |
| Dashboard Overview | `/venue/dashboard` | Main portal widgets overview |
| Calendar/Schedule | `/venue/calendar` | Timetable calendar of blocked/booked dates |
| Analytics Insights | `/venue/analytics` | Charts and occupancy metrics |
| Booking History | `/venue/bookings` | Booking management |
| Revenue/Earnings | `/venue/earnings` | Ledger payouts overview |
| Profile & Setup | `/venue/profile` | Venue profile setup and settings |
| Reviews Moderation | `/venue/reviews` | Reviews feed & reply forms |
| Verification Status | `/venue/verification` | Verification logs and resubmission |

### Database Tables Discovered

1. `venues` — Main venue space profile table containing capacities, address, base rates, JSON fields for facilities, pricing details, availability rules, and documents.
2. `venue_categories` — Junction table mapping venues to category tags (such as "Banquet Hall", "Marriage Hall").

---

## 4. Backend Certification

- **Venue Onboarding & Registration**: Checked the atomic registration service `register_venue` which creates the user record, assigns `venue_owner` role, generates a sequence-backed `venue_number`, and creates the venue profile inside a single transaction context.
- **Conflict Checker**: Verified `check_booking_conflict` service which checks overlapping timestamps, operational hours, holidays, and buffer times.
- **Error Handling**: Implemented standard exceptions (e.g. `ConflictException` on duplicate emails or duplicate venue profiles) returning the unified `{ success: false, error: { code, message } }` JSON structure.

---

## 5. Database Certification

- **Sequences**: Checked sequence `venue_number_seq` which generates sequential, monotonic venue numbers starting at `100001` (e.g. `BCV-100001`).
- **Keys**: Verified foreign key constraints with correct cascaded delete parameters (`ondelete="CASCADE"` on `user_id` and `ondelete="RESTRICT"` on `city_id` to prevent deleting cities that contain active venue spaces).
- **Soft Delete**: Confirmed `deleted_at` datetime field is filtered on all marketplace query repositories.

---

## 6. Frontend Certification

- **10-Step Wizard**: Verified step progression inside `VenueRegisterForm.tsx` (Owner account creation, details, address, capacity, pricing, facilities checklist, media uploads, availability schedules, identity uploads, and terms).
- **Onboarding Guard**: Confirmed that the `VenueOnboardingGuard` wrapper in `layout.tsx` checks if a venue profile exists for the logged-in user. If missing, it correctly redirects the user to `/register/venue`.
- **Responsive UI**: Audited mobile grids, capacities text cards, and responsive sidebars. The pages load cleanly on narrow viewports.

---

## 7. Security & Guard Certification

- **JWT Validation**: Verified that all owner endpoints in `public_router.py` are secured using `get_current_user` dependencies.
- **Ownership Verification**: Assured that a venue owner can query and update only their own venue space profile, since the sub claim UUID is extracted directly from the verified access token.
- **Admin Isolation**: Verified that administrative actions (listing all venues, verify, suspend, activate) are guarded by `get_current_admin` in `router.py`.

---

## 8. API Endpoint Catalog

| Endpoint | Method | Role | Auth Required | Description |
|----------|--------|------|---------------|-------------|
| `/api/v1/venues/register` | `POST` | Public | No | Submits owner + venue onboarding data |
| `/api/v1/venues/me` | `GET` | Venue Owner | Yes | Fetches authenticated venue profile |
| `/api/v1/venues/me` | `PUT` | Venue Owner | Yes | Updates basic profile settings |
| `/api/v1/venues/me/dashboard` | `GET` | Venue Owner | Yes | Prepares stats, reviews, and charts |
| `/api/v1/venues/me/availability` | `GET` | Venue Owner | Yes | Fetches operational schedules & bookings |
| `/api/v1/venues/me/availability` | `PUT` | Venue Owner | Yes | Updates blocked dates/schedules |
| `/api/v1/venues/me/facilities` | `GET` | Venue Owner | Yes | Fetches active facilities list |
| `/api/v1/venues/me/facilities` | `PUT` | Venue Owner | Yes | Updates facility specifications |
| `/api/v1/venues/me/pricing` | `GET` | Venue Owner | Yes | Fetches rates and package prices |
| `/api/v1/venues/me/pricing` | `PUT` | Venue Owner | Yes | Updates rates, taxes, and currencies |
| `/api/v1/venues/me/analytics` | `GET` | Venue Owner | Yes | Calculates metrics & occupant rates |
| `/api/v1/venues/me/verification/resubmit` | `PUT` | Venue Owner | Yes | Resubmits verification documents |
| `/api/v1/venues` | `GET` | Public | No | Public marketplace search (approved only) |
| `/api/v1/venues/{id}` | `GET` | Public | No | Public venue profile lookup |
| `/api/v1/admin/venues` | `GET` | Admin | Yes | Admin view of all platform listings |
| `/api/v1/admin/venues/{id}/verify` | `PUT` | Admin | Yes | Approves or rejects venue profiles |

---

## 9. E2E Business Flow

```
1. Guest registers via onboarding wizard at /register/venue
   ↓ (Creates user, user_roles mapping, generates BCV-XXXXXX code, inserts venue)
2. Backend assigns verification_status = "pending"
   ↓
3. Owner logs in and is guided by VenueOnboardingGuard
   ↓
4. Owner completes additional profile setups (cover image, operational schedules)
   ↓
5. Admin verifies profile via Admin Panel (/admin/venues/{id}/verify)
   ↓
6. Profile status transitions to "approved"; is_verified updated to True
   ↓
7. Venue appears instantly in public marketplace search feed (/venues)
   ↓
8. Clients can query slot availability conflicts and initiate bookings
```

---

## 10. Issues Discovered & Resolved

### Public Search capacity Parameter Bug (Backend Router)
- **Discovered**: In `backend/app/features/venues/public_router.py` (line 492), query search filtering was using `Venue.max_capacity`.
- **Impact**: Sending a capacity parameter to the search endpoint caused an `AttributeError` exception, blocking clients from filtering venues by capacity.
- **Resolution**: Updated `Venue.max_capacity` to `Venue.capacity` to match the SQLAlchemy model field definition. Added testing assertions to verify.

---

## 11. Test Results

- **Backend Test Suite**: All tests pass.
  - `test_verification.py` : PASS (Verification update, resubmit flows)
  - `test_analytics.py` : PASS (Venue stats calculations)
  - `test_earnings.py` : PASS (Earning ledgers)
  - `test_reviews.py` : PASS (Review replies, averages)
  - `test_public_profile.py` : PASS (Marketplace filtering & security checks)
- **Frontend Build**: Next.js production build succeeded with zero compilation errors.

---

## 12. Final Certification Result

```
MODULE 2 - VENUE PORTAL

  ✅ CERTIFIED

  No critical bugs remain. All automated tests pass.
  onboarding flows are verified and active.
```

---
*Generated by Chief Solution Architect & QA Lead — BandConnect Engineering*
