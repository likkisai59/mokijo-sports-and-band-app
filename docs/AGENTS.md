# AGENTS.md — BandConnect Developer & AI Agent Instructions

This file contains mandatory behavioral instructions for all developers and AI coding assistants
(GitHub Copilot, Antigravity, Claude, Gemini, Cursor, Windsurf, ChatGPT, etc.) working on BandConnect.

Read MASTER.md in full before generating any code, schema, component, or configuration.

---

## Module Workflow

1. Read MASTER.md completely before starting any module.
2. Identify the exact current phase in `task.md`.
3. Do not start a new module before the current module is fully approved.
4. Implement only what the current task specifies — no feature creep.
5. Run tests, lint, and build checks after each significant change.
6. Update `task.md` and `walkthrough.md` immediately upon completing any milestone.

---

## CRITICAL WORKFLOW ACCEPTANCE GATE

A module is **not** considered production-approved solely because:

- Implementation is complete
- Lint passes
- Build passes
- Unit tests pass

For **authentication, RBAC, role routing, registration, and cross-role portal workflows**,
approval also requires real end-to-end workflow verification.

Required evidence includes, where applicable:

```
UI interaction
    ↓
Form state
    ↓
API payload
    ↓
Backend processing
    ↓
Database persistence
    ↓
Authenticated state
    ↓
RBAC
    ↓
Navigation
    ↓
Browser refresh
    ↓
Logout
```

AI implementation summaries are **not** final project approval.

The Project Stabilization Sprint must verify critical browser-visible workflows
before the next dependent module begins.

Do not add demo-specific bug details to this file.

---

## Role Navigation Rules

- Always use `getRoleDashboard(role)` from `frontend/utils/role-routes.ts` for role-to-dashboard resolution.
- Never hardcode role→route mappings in individual components.
- `GuestRoute` must redirect authenticated users to `getRoleDashboard(user.role)`, not `/`.
- The global Header Dashboard button must use `getRoleDashboard(user.role)`.

## Portal Navigation Rules

- A role Dashboard route (`/client/dashboard`, `/artist/dashboard`, `/venue/dashboard`, `/admin/dashboard`) represents the **role overview**, not a feature page.
- Feature pages (Bookings, Earnings, Reviews, etc.) live under their own sidebar route.
- Breadcrumbs inside role portals must NOT link to the public `/` Home page.

## Registration Rules

- Use `Controller` from `react-hook-form` when binding shadcn `Select` components to form state.
- The `defaultValue` on `Select` alone does not make it controlled — the `value` prop must be set.
- Canonical public registration roles: `client`, `artist`, `venue_owner`. Admin is NOT publicly registerable.

## Theme Rules

- Use `useTheme()` from `providers/theme-provider.tsx` for all theme state access.
- The theme provider sets `data-theme` on `document.documentElement`.
- CSS must use `[data-theme="light"]` overrides in `globals.css`.
- Do not create a second theme system or use `document.body.style` directly.

## SECRET_KEY Rules

- Never commit a real SECRET_KEY to source control.
- Development: empty `SECRET_KEY` auto-uses the dev fallback. Real JWT auth still works.
- Production: empty or fallback `SECRET_KEY` causes a `ValueError` on startup (fail fast).
- Always call `settings.effective_secret_key` (never `settings.SECRET_KEY` directly) for JWT operations.

---

## File Ownership

| File | Purpose |
|---|---|
| `MASTER.md` | Permanent architecture and project rules |
| `walkthrough.md` | What was actually changed and why |
| `task.md` | Current progress and verification status |
| `AGENTS.md` | How developers and AI agents must work |
