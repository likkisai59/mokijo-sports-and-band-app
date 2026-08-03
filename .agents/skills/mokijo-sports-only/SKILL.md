---
name: mokijo-sports-only
description: Strict scope protection skill for Mokijo Sports development. Prevents any modifications to Band Connect frontend and backend files while working on Sports features.
---

# Mokijo Sports Scope Isolation Skill

## Purpose
This skill ensures that all development, refactoring, and bug fixing activities are strictly scoped to **Mokijo Sports**. 
It protects **Band Connect** files (frontend and backend) from accidental modification, deletion, or breaking changes while your teammate works on the Band Connect module.

---

## 🚫 Protected Paths (DO NOT TOUCH - Band Connect Files)

Do **NOT** edit, modify, or delete any of the following paths or files unless explicitly requested by the user:

### Frontend (Band Connect)
- `frontend/app/band/` (all subdirectories and pages)
- `frontend/components/band/`
- `frontend/components/artist/`
- Any CSS or styling files specifically dedicated to Band Connect pages.

### Backend (Band Connect API & Features)
- `backend/app/api/band/`
- `backend/app/api/band_artists/`
- `backend/app/api/band_auth/`
- `backend/app/api/band_bookings/`
- `backend/app/api/band_categories/`
- `backend/app/api/band_common/`
- `backend/app/api/band_earnings/`
- `backend/app/api/band_locations/`
- `backend/app/api/band_reviews/`
- `backend/app/api/band_settings/`
- `backend/app/api/band_venues/`
- `backend/app/models/band_models.py`
- `backend/app/models/band_schemas.py`
- `backend/app/features/artists/`
- `backend/app/features/categories/`
- `backend/app/features/earnings/`
- `backend/app/features/locations/`
- `backend/app/features/reviews/`

---

## ✅ Permitted Paths (Mokijo Sports Scope)

All work should be focused inside or created within these paths:

### Frontend (Mokijo Sports)
- `frontend/app/mokijo/` (Main Mokijo Sports user flows, auth, dashboard)
- `frontend/app/trainings/`
- `frontend/app/scoreboard/`
- `frontend/app/venue/` & `frontend/app/venues/`
- `frontend/app/bookings/`
- `frontend/components/auth/`
- `frontend/components/trainer-dashboard/`
- `frontend/components/venue-dashboard/`
- `frontend/components/venue/`
- `frontend/components/dashboard/`
- `frontend/app/styles/` (Sports styles)

### Backend (Mokijo Sports API & Features)
- `backend/app/api/mokijo/`
- `backend/app/api/activities/`
- `backend/app/api/events/`
- `backend/app/api/games/`
- `backend/app/api/matches/`
- `backend/app/api/trainer/`
- `backend/app/api/venue_owner/`
- `backend/app/api/venues/`
- `backend/app/api/shared/`
- `backend/app/models/models.py` (Sports models)
- `backend/app/models/schemas.py` (Sports schemas)

---

## 🛡️ Shared Files Guidelines

When working with shared system files (e.g. `backend/app/main.py`, `frontend/components/layout/`, global CSS):
1. **Preserve Band Routes**: Never comment out, delete, or break existing Band Connect route mounts, imports, or middleware.
2. **Minimal Changes**: Keep changes in shared files strictly additive and scoped to Mokijo Sports functionality.
3. **No Database Destructive Changes**: Do not modify or drop SQL tables or columns used by Band Connect (`band_*` tables).
