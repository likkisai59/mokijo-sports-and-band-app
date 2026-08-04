# Comprehensive Workspace Rules - Multi-Module Scope Isolation

This repository hosts two distinct active modules:
1. **Mokijo Sports**
2. **Band Connect**

To prevent code conflicts, regressions, and accidental file overwrites, AI agents and developers must strictly adhere to the scope rules below based on the developer role.

---

## ⚽ SECTION A: Mokijo Sports Developer Guidelines

### 🟢 Permitted Scope (Mokijo Sports Files)
All development, bug fixes, and feature additions for Mokijo Sports must be contained strictly within:

* **Frontend:**
  * `frontend/app/mokijo/` (Main Mokijo flows, auth, dashboard)
  * `frontend/app/trainings/`
  * `frontend/app/scoreboard/`
  * `frontend/app/venue/` & `frontend/app/venues/`
  * `frontend/app/bookings/`
  * `frontend/app/user-dashboard/`
  * `frontend/app/super-admin/`
  * `frontend/components/auth/`
  * `frontend/components/dashboard/`
  * `frontend/components/trainer-dashboard/`
  * `frontend/components/venue-dashboard/`
  * `frontend/components/venue/`
  * `frontend/components/register/`

* **Backend:**
  * `backend/app/api/mokijo/`
  * `backend/app/api/activities/`
  * `backend/app/api/events/`
  * `backend/app/api/games/`
  * `backend/app/api/matches/`
  * `backend/app/api/trainer/`
  * `backend/app/api/venue_owner/`
  * `backend/app/api/venues/`
  * `backend/app/api/shared/superadmin/`
  * `backend/app/models/models.py` (Sports ORM models)
  * `backend/app/models/schemas.py` (Sports Pydantic schemas)
  * `backend/app/services/hold_expiry.py`

### 🔴 Protected Scope (DO NOT TOUCH - Band Connect Files)
Do **NOT** edit, modify, or delete any of the following paths:
* **Frontend:** `frontend/app/band/`, `frontend/app/artist/`, `frontend/components/band/`, `frontend/components/artist/`
* **Backend:** `backend/app/api/band/`, `backend/app/api/band_*/`, `backend/app/models/band_models.py`, `backend/app/models/band_schemas.py`, `backend/app/features/artists/`, `categories/`, `earnings/`, `locations/`, `reviews/`

---

## 🎵 SECTION B: Band Connect Developer Guidelines

### 🟢 Permitted Scope (Band Connect Files)
All development, bug fixes, and feature additions for Band Connect must be contained strictly within:

* **Frontend:**
  * `frontend/app/band/` (Landing, dashboards, client/artist bookings, login, register, artists, venues)
  * `frontend/app/artist/` (Artist layout, profile, settings)
  * `frontend/components/band/`
  * `frontend/components/artist/`

* **Backend:**
  * `backend/app/api/band/` (Auth, artists, venues, bookings, categories, locations, reviews, earnings, settings, notifications, payments)
  * `backend/app/api/band_*/` (Legacy band API routes)
  * `backend/app/models/band_models.py` (Band ORM models)
  * `backend/app/models/band_schemas.py` (Band Pydantic schemas)
  * `backend/app/features/artists/`, `categories/`, `earnings/`, `locations/`, `reviews/`

### 🔴 Protected Scope (DO NOT TOUCH - Mokijo Sports Files)
Do **NOT** edit, modify, or delete any of the following paths:
* **Frontend:** `frontend/app/mokijo/`, `frontend/app/trainings/`, `frontend/app/scoreboard/`, `frontend/app/venue/`, `frontend/app/venues/`, `frontend/app/bookings/`, `frontend/app/user-dashboard/`, `frontend/app/super-admin/`, `frontend/components/auth/`, `frontend/components/dashboard/`, `frontend/components/trainer-dashboard/`, `frontend/components/venue-dashboard/`, `frontend/components/venue/`, `frontend/components/register/`
* **Backend:** `backend/app/api/mokijo/`, `backend/app/api/activities/`, `events/`, `games/`, `matches/`, `trainer/`, `venue_owner/`, `venues/`, `shared/superadmin/`, `backend/app/models/models.py`, `backend/app/models/schemas.py`

---

## 🤝 SECTION C: Shared System Files Rules (Applies to Both Developers)

When editing shared system entry points (`backend/app/main.py`, `backend/app/api/router/router.py`, `frontend/src/App.jsx`, `frontend/styles/globals.css`, `package.json`, `requirements.txt`):

1. **Preserve Existing Routes**: Never delete, comment out, or alter existing routes or mounts of the other module.
2. **Additive Updates Only**: Only append or register your module's specific new routes/dependencies without changing common structures.
3. **Database Integrity**: Never drop or alter SQL tables/columns belonging to the other module (`band_*` vs `mokijo_*`).
