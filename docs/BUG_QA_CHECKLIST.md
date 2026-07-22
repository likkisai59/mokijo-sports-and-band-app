# BUG-001–045 Regression Checklist

Use this after deploying registration / dashboard bug fixes.

## Club Admin registration (`/register`)

- [ ] BUG-001: Select Belgium (or non-India) → State shows Belgian provinces / free-text, not Indian states
- [ ] BUG-002: Password `a` blocked; strong password accepted
- [ ] BUG-003: Eye icon toggles password visibility
- [ ] BUG-004: Email `123232` blocked with valid-email message
- [ ] BUG-005: Country code dropdown present; length enforced per code
- [ ] BUG-006: Letters in phone field blocked
- [ ] BUG-007: Names reject digits; club name allows letters/numbers/spaces/hyphens
- [ ] BUG-008: Verification email link uses `FRONTEND_URL` (set in `.env` for non-localhost)

## Club Admin dashboard

- [ ] BUG-009: Sidebar **Groups** navigates to `/dashboard/groups`
- [ ] BUG-010: Team Members has Role column + role filter
- [ ] BUG-011: Create venue → book slot without PENDING block
- [ ] BUG-012: Open notification bell → badge count drops
- [ ] BUG-013: Messages item absent from sidebar
- [ ] BUG-014: Pencil on member opens edit profile
- [ ] BUG-015: Team Members excludes Parent/Coach/Referee/Trainer by default

## Member onboarding (Player / Parent / Coach / Referee)

For each role via `/register-member` (or club signup link):

- [ ] Names reject digits (016/023/030/038)
- [ ] Invalid email blocked; duplicate email for club rejected (017/024/031/039)
- [ ] Phone digits only (018/025/032/040)
- [ ] Country code + length (020/026/033/041)
- [ ] Strong password enforced (021/028/035/043)
- [ ] Password eye toggle (022/029/036/044)
- [ ] Coach/Referee Aadhaar exactly 12 digits, spaced display (037/045)

Note: Member/parent/coach/referee applications do **not** send a verification email; they wait for club admin approval.

## Deploy note

Set `FRONTEND_URL` to the public site origin so email links work on mobile/other devices.
