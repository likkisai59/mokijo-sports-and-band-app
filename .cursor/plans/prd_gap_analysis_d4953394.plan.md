---
name: PRD Gap Analysis
overview: Complete end-to-end pending feature list for Mukijo vs the PRD. Everything Partial or Missing is listed below as work still required; Done items are excluded.
todos: []
isProject: false
---

# Mukijo — End-to-End Pending Features List

Everything below is **still pending** (Missing or Partial). Already-done features (club groups/events/courses Razorpay, venue hold/confirm UI, basic RSVP, venue analytics, venue slot block UI) are excluded.

---

## A. Foundation / Security (must-fix before scale)

1. Password hashing (bcrypt/argon2) for User, Member, VenueOwner
2. JWT or session-based authentication
3. Auth middleware / route guards on booking, venue-owner, and user APIs
4. Frontend route protection (wire unused `ProtectedRoute`)
5. Email verification enabled end-to-end (currently disabled on register)
6. Forgot-password flow (`/forgot-password` linked but missing)
7. Fraud prevention / payment integrity for venue bookings
8. Unify dual venue ownership (`Venue.owner_id` vs `Venue.venue_owner_id`)

---

## B. Discovery Layer

9. Venue filter by pricing
10. Venue filter by distance (use stored lat/lng)
11. Venue filter by real-time availability
12. Venue filter by ratings
13. `GET /venues/{id}` single-venue detail API
14. List venue reviews API (`GET /venues/{id}/reviews`)
15. Player discovery (nearby players)
16. Player discovery by skill level
17. Public activity / open-game discovery feed for consumers
18. Join public games from user dashboard (discover + RSVP UX)
19. Public tournament discovery for casual users
20. Public training-session discovery for casual users

---

## C. Venue Booking Engine

21. Replace mock checkout with real Razorpay (UPI / cards / wallets) on venue bookings
22. Verify Razorpay signature on `POST /bookings/confirm`
23. Fix broken legacy `POST /bookings` (`Booking.slot_id` vs `booking_slots`)
24. Fix activity cancel slot-unlink bug (same `slot_id` issue)
25. Hold-expiry cleanup as background job (not only on booking-list fetch)
26. Holiday calendar for venues
27. Extend / shorten session duration beyond hardcoded 1-hour slots
28. Use venue `opening_time` / `closing_time` / `days_open` / `slot_duration` in slot auto-generation
29. Peak-hour pricing engine
30. Weekend pricing engine
31. Demand / occupancy-based dynamic pricing
32. Cancellation window policies (venue-specific)
33. Automated refunds on cancel
34. Partial refunds
35. Manual slot price edit UI for venue owners
36. Individual slot update/delete APIs
37. Delete venue API
38. Prevent double-booking edge cases under high concurrency (harden beyond current row locks)

---

## D. Game Coordination

39. Enforce minimum player count before game is “confirmed”
40. Auto-confirm game when min players reached
41. Substitute / replacement player flow
42. Tentative → confirmed RSVP conversion UX
43. Schedule-change notifications to all RSVPs
44. Upcoming-game reminder notifications
45. Participation-request notifications
46. Activity-scoped real chat (replace localStorage mock on activity detail)
47. Link activity ↔ booking payment split among players (optional cost share)

---

## E. Social Layer & Sports Graph

48. Friend requests / accept / reject
49. Friends list
50. Invite friends to games / bookings
51. Sports circles (multi-friend groups for recurring play)
52. Public communities (joinable, not club-admin Groups)
53. Private social groups for casual players
54. First-class Squad entity (recurring team, not coach-dashboard alias)
55. Squad management (roster, captains, recurring schedule)
56. Skill-based game matching engine
57. Team balancing by skill
58. Sports participation graph (who plays with whom)
59. Participation frequency tracking per user
60. Preferred-sports profile
61. Local sports density metrics
62. Club Posts feed (UI stub → real)
63. Club Polls (UI stub → real)
64. Club Messages UI (API exists; sidebar is stub)
65. Group privacy (`public`/`private`) exposed in create/update API

---

## F. Venue Partner SaaS

66. Peak pricing configuration UI
67. Promotions / discount campaigns for venues
68. Full court CRUD (list / update / delete — create only today)
69. Add venue after registration (not only at signup)
70. Customer CRM: booking history per customer
71. Customer CRM: repeat-user engagement tracking
72. Per-slot / per-court pricing management tools
73. Occupancy optimization suggestions for owners
74. Venue KYC / verification workflow (Aadhar collected; always auto-verified)

---

## G. Financial Infrastructure

75. Real venue booking payment orchestration (see also #21–22)
76. Refund transaction records (not status flags only)
77. Settlement ledger (bookings → platform fee → venue net)
78. Real venue payouts (replace fake UTRs)
79. Payout reconciliation
80. Commission configuration (platform fee %)
81. Wallet / loyalty credits
82. Referral reward credits
83. Promotional credits
84. Premium memberships (priority booking, discounts, premium communities)
85. Venue SaaS subscription billing
86. Activity fee commissions for hosted public games
87. Featured / sponsored venue listings
88. Tournament registration revenue split

---

## H. Notifications Infrastructure

89. Notification service (email / SMS / push / in-app)
90. Booking confirmation notifications
91. Payment receipt notifications
92. Refund notifications
93. Game reminder notifications
94. RSVP / participation request notifications
95. Schedule update notifications
96. Friend invite notifications
97. Tournament / activity recommendation notifications
98. Wire existing email service (currently unused / print stubs for event reminders)

---

## I. Gamification & Trust

99. Participation points (karma)
100. Consistency rewards
101. Achievement badges
102. Streaks
103. Milestones
104. Attendance reliability score
105. No-show tracking
106. Cancellation-rate tracking
107. Sportsmanship ratings
108. Skill verification / verified ratings
109. Player rankings
110. Report user / activity / community
111. Moderation workflows
112. Abuse / spam prevention

---

## J. Events & Tournaments

113. Public tournament entity (beyond club Events)
114. Tournament registration for casual users
115. Bracket generation / management
116. Tournament scheduling engine
117. Tournament participation tracking
118. Community leagues
119. Seasonal competitions
120. Community championships

---

## K. Coaching & Academy Ecosystem

121. Public coach discovery
122. Book training sessions (consumer)
123. Join academies marketplace
124. Skill programs catalog
125. Wire user-dashboard Training tab (currently empty placeholder)
126. Coaching partnership commissions

---

## L. Intelligence & Recommendations

127. Recommend compatible players
128. Recommend balanced teams
129. Recommend ideal activities nearby
130. Best-timing / recurring schedule suggestions
131. No-show / participation probability prediction
132. Platform-wide analytics (bookings, engagement, retention, cancellations, utilization) beyond club/venue silos

---

## M. Club-adjacent pending (existing product gaps)

133. Member update API (`MemberUpdate` schema exists; no route)
134. Member delete
135. Real email for event participant messaging (currently console print)
136. Real email for event send-reminder (currently console print)
137. Signup submission rejection reasons / status column
138. Activity message board backend (not localStorage)
139. User-dashboard Home: real trainers list (mock today)
140. User-dashboard Home: real teams near you + Join Team (mock today)
141. Landing CTAs for user booking / venue owner (club-only cards today)

---

## N. Technical / Platform (PRD §27)

142. Realtime inventory updates (websockets / SSE for slot status)
143. High-volume notification pipeline
144. Geographic scaling / multi-city support
145. Analytics data pipeline
146. Microservices split (long-term; currently monolith)

---

## Priority order (same list, sequenced)

### P0 — Core loop
- #1–6 Auth & security basics
- #21–24 Booking payments + bug fixes
- #17–18 Public game discover + join
- #32–34 Cancellation / refund rules

### P1 — Coordination & venue depth
- #9–12 Venue filters
- #26–31 Pricing & calendar
- #39–46 Game coordination + notifications start (#89–95)
- #66–72 Venue SaaS depth
- #75–80 Settlements / payouts

### P2 — Social moat
- #48–61 Friends, communities, squads, graph
- #15–16 Player discovery
- #104–106 Reliability scoring

### P3 — Engagement & expansion
- #99–112 Gamification & moderation
- #113–120 Tournaments / leagues
- #121–126 Coaching marketplace
- #81–88 Wallet / memberships / monetization
- #127–132 Intelligence layer
- #142–146 Platform scale

---

## Counts

| Category | Pending items |
|----------|---------------|
| Foundation / Security | 8 |
| Discovery | 12 |
| Booking engine | 18 |
| Game coordination | 9 |
| Social / graph | 18 |
| Venue SaaS | 9 |
| Financial | 14 |
| Notifications | 10 |
| Gamification / trust | 14 |
| Tournaments | 8 |
| Coaching | 6 |
| Intelligence | 6 |
| Club-adjacent gaps | 9 |
| Technical platform | 5 |
| **Total pending** | **~146** |

**Already strong (not pending):** club admin groups/events/courses/fundraising + Razorpay; venue hold/confirm/cancel UI; basic activity RSVP/waitlist; venue owner overview/slots/bookings/payouts UI; venue analytics.

---

## Master development prompt (copy-paste into a new Agent chat)

Use the prompt below in **Agent mode** to implement pending features. Paste the whole block, then optionally append: `Start with P0 only` or `Implement items #21–24 first`.

```text
You are the lead full-stack engineer for Mukijo (repo: MUKIJO).

## Product
Mukijo is a sports participation ecosystem (not only venue booking): discovery, booking, social/communities, game coordination, venue SaaS, payments, gamification, tournaments, coaching, and recommendations.

## Codebase (do not reinvent)
- Backend: FastAPI monolith at `backend/` — models in `backend/app/models/models.py`, schemas in `backend/app/schemas/schemas.py`, routes in `backend/app/routes/`, router in `backend/app/api/router.py`, Razorpay in `backend/app/services/razorpay.py`, email in `backend/app/services/email.py`.
- Frontend: Next.js App Router at `frontend/` — consumer (`/user-dashboard`, `/venues`, `/checkout`, `/bookings`), venue owner (`/venue-dashboard/*`), club admin (`/dashboard/*`).
- Auth today: localStorage IDs + plain-text passwords; no JWT. Prefer incremental hardening without breaking existing club flows.
- Booking today: `POST /bookings/hold` → mock checkout → `POST /bookings/confirm`. Club payments already use Razorpay — reuse that pattern for venue bookings.
- Activities: `backend/app/routes/activities.py` has RSVP/waitlist; user UI lacks public discover+join.
- Known bugs to fix early: legacy `Booking.slot_id` usage in `POST /bookings` and activity cancel; model uses `booking_slots` M2M. Dual ownership: `Venue.owner_id` vs `Venue.venue_owner_id`.

## Source of truth for pending work
Implement features from `.cursor/plans/prd_gap_analysis_d4953394.plan.md` (items #1–146). Do NOT rebuild already-done areas: club groups/events/courses/fundraising Razorpay, basic venue hold/confirm/cancel UI, basic activity RSVP, venue analytics/slots/bookings UI.

## Execution rules
1. Work in priority order unless I specify otherwise:
   - P0: #1–6 auth; #21–24 booking Razorpay + slot_id bugs; #17–18 public game discover+join; #32–34 cancel/refund rules
   - P1: #9–12 filters; #26–31 pricing/calendar; #39–46 coordination; #89–95 notifications; #66–72 venue SaaS; #75–80 settlements
   - P2: #48–61 social; #15–16 player discovery; #104–106 reliability
   - P3: #99–112 gamification; #113–120 tournaments; #121–126 coaching; #81–88 wallet/monetization; #127–132 intelligence; #142–146 platform
2. One vertical slice at a time: model → schema → API → frontend → wire existing UI → smoke-test.
3. Match existing patterns, file layout, naming, and CSS (club vs dark consumer/venue styles). No drive-by refactors.
4. Prefer extending existing routes/models over new parallel systems.
5. Reuse club Razorpay helpers for venue booking payments; replace mock `pay_mock_*` in `frontend/app/checkout/page.jsx`.
6. After each slice: list files changed, how to test, and mark completed item numbers from the plan.
7. Do not commit unless I ask. Do not invent microservices yet (stay monolith until P3 #146).
8. Security: never store new passwords in plain text; migrate hashing carefully for existing users.
9. Keep API base URL consistent with current frontend (`http://127.0.0.1:8001` or shared `lib/api.js`).
10. If a feature depends on another, implement the dependency first and say so.

## Definition of done per feature
- Backend endpoint(s) work and are registered in `router.py`
- Frontend UI reachable from the correct role dashboard
- Happy path + main failure path handled (auth, validation, conflict)
- No broken legacy paths left for that feature (fix or remove)
- Brief test notes in the reply

## Start now
1. Read `.cursor/plans/prd_gap_analysis_d4953394.plan.md`
2. Read the relevant existing files for the first P0 slice
3. Implement P0 completely before P1 unless I say otherwise
4. Begin with: (a) password hashing + JWT auth skeleton, (b) venue booking Razorpay confirm, (c) fix Booking.slot_id bugs, (d) public games discover+join on user-dashboard, (e) cancellation refund policy basics

Report progress after each completed numbered item.
```

### Shorter prompts (optional)

**P0 only**
```text
Implement only P0 from `.cursor/plans/prd_gap_analysis_d4953394.plan.md` (#1–6, #17–18, #21–24, #32–34) in Mukijo. Reuse club Razorpay for venue checkout; fix Booking.slot_id bugs; add public game discover+join on user-dashboard; add cancel/refund policy basics; harden auth with hashing + JWT. Match existing code patterns. Do not commit unless asked.
```

**Single feature**
```text
Implement plan item #<N> from `.cursor/plans/prd_gap_analysis_d4953394.plan.md` end-to-end (model/schema/API/UI). Explore existing related code first. Match Mukijo patterns. Mark done when testable. Do not commit unless asked.
```
