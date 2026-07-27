# MASTER.md — Music Band Booking Platform
# Engineering Constitution & Single Source of Truth

**Version**: 1.0.0
**Created**: 2026-07-08
**Maintained By**: Chief Software Architect
**Status**: Active — Production Ready
**Classification**: Internal Engineering Document

---

> **MANDATORY FOR ALL AI ASSISTANTS**
> Every AI tool (GitHub Copilot, Antigravity, Claude, Gemini, Cursor, Windsurf, ChatGPT, etc.)
> MUST read this entire document before generating any code, schema, component, or configuration
> for this project. Violating any rule defined here is unacceptable.

---

## Table of Contents

| # | Section |
|---|---------|
| 1 | Project Overview |
| 2 | Technology Stack |
| 3 | Architecture |
| 4 | Complete Folder Structure |
| 5 | Frontend Standards |
| 6 | Backend Standards |
| 7 | Database Standards |
| 8 | API Standards |
| 9 | Authentication & Authorization |
| 10 | Coding Standards |
| 11 | Performance Standards |
| 12 | Security Standards |
| 13 | UI Design System |
| 14 | Development Workflow |
| 15 | Git Workflow |
| 16 | Testing Strategy |
| 17 | Deployment Strategy |
| 18 | AI Engineering Rules |
| 19 | Project Modules |
| 20 | Future Scalability |
| 21 | Architecture Decision Records (ADR) |
| 22 | Engineering Principles |
| 23 | Engineering Philosophy |
| 24 | Module Development Lifecycle (Mandatory) |
| 25 | Module Status Tracker |
| 26 | Engineering Rules |

---

## 1. Project Overview

### 1.1 Project Name

**BandConnect** — Music Band Booking Platform

> The platform is referenced internally as `bandconnect` across repositories, environment
> variables, and configuration files.

---

### 1.2 Business Goal

Build a trusted, scalable, and feature-rich marketplace that:

- Connects **clients** (individuals, corporates, event organizers) with professional **music bands and solo artists**
- Empowers **venue owners** to list and manage their event spaces
- Gives **administrators** full control over platform operations, disputes, payments, and analytics
- Provides a **future-ready foundation** that can onboard DJs, photographers, videographers,
  dancers, anchors, event planners, and equipment rental providers without re-architecting the core

---

### 1.3 Project Vision

> *"The Airbnb for live entertainment — where every client finds their perfect sound, every
> artist finds their stage, and every venue finds its voice."*

BandConnect becomes the default marketplace for live event booking across India and Southeast Asia,
processing thousands of bookings per day, building deep trust through transparent reviews, secure
payments, and a stellar user experience.

---

### 1.4 Mission

- Make it effortless for clients to discover, compare, and book musicians for any occasion
- Help artists build their professional profile and grow their revenue
- Enable venue owners to monetize their spaces by connecting them with performers
- Run a transparent, fair, and dispute-proof marketplace

---

### 1.5 Target Users

#### Client
A person or organization that wants to hire a band, artist, or performer for an event.

| Attribute | Details |
|-----------|---------|
| **Type** | Individual, Corporate, Wedding Planner, Event Organizer |
| **Goals** | Discover artists, check availability, compare prices, book, pay, review |
| **Frustrations** | Unverified artists, hidden charges, no contract, poor communication |

#### Band / Individual Artist
A musician, vocalist, or performing group offering entertainment services.

| Attribute | Details |
|-----------|---------|
| **Type** | Solo singer, Cover band, Jazz ensemble, Classical group, DJ (future) |
| **Goals** | Get discovered, receive bookings, get paid securely, build reputation |
| **Frustrations** | Underpaid gigs, last-minute cancellations, no platform protection |

#### Venue Owner
A business or individual that owns event spaces (banquet halls, rooftops, studios, open-air venues).

| Attribute | Details |
|-----------|---------|
| **Type** | Hotel, Banquet hall owner, Open-air venue, Recording studio |
| **Goals** | List space, attract performers and clients, monetize through platform bookings |
| **Frustrations** | Empty calendar, no digital presence, no booking management |

#### Admin
Platform operators who manage users, disputes, payouts, content moderation, and analytics.

| Attribute | Details |
|-----------|---------|
| **Type** | Super Admin, Support Staff, Finance Team |
| **Goals** | Oversee health of marketplace, resolve disputes, manage commissions |
| **Frustrations** | Lack of audit trails, manual processes, no real-time visibility |

---

### 1.6 Business Flow

```
Client visits BandConnect
    |
    v
Browses Artists / Venues
    |
    v
Selects Artist + Venue + Date
    |
    v
Sends Booking Request
    |
    v
Artist Accepts? ---No---> Client Notified - Suggest Alternatives
    |
   Yes
    |
    v
Payment Held in Escrow
    |
    v
Event Happens
    |
    v
Client Confirms Completion
    |
    v
Payment Released to Artist
    |
    v
Platform Commission Deducted
    |
    v
Reviews & Ratings + Analytics Updated
```

---

### 1.7 Marketplace Roles Summary

| Role | Create Profile | List Services | Send Booking | Accept Booking | Receive Payment | Leave Review | Admin Panel |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Client | Yes | No | Yes | No | No | Yes | No |
| Artist / Band | Yes | Yes | No | Yes | Yes | Yes | No |
| Venue Owner | Yes | Yes | No | Yes | Yes | Yes | No |
| Admin | Yes | No | No | No | No | No | Yes |

---

### 1.8 Future Roadmap

| Phase | Timeline | New Providers |
|-------|----------|---------------|
| Phase 1 — Core | Months 1-4 | Client, Band, Admin |
| Phase 2 — Venues | Months 5-6 | Venue Owner |
| Phase 3 — Creative Expansion | Months 7-9 | DJ, Photographer, Videographer |
| Phase 4 — Full Event Stack | Months 10-12 | Dancer, Anchor, Event Planner |
| Phase 5 — Equipment & AI | Year 2 | Equipment Rental, AI Recommendations |
| Phase 6 — Internationalization | Year 2-3 | Multi-language, Multi-currency |

---

## 2. Technology Stack

### 2.1 Technology Decisions Table

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Frontend Framework** | Next.js | 15+ (App Router) | SSR/SSG, file-based routing, Vercel-native, SEO-ready, server components |
| **UI Library** | React | 19+ | Industry standard, hooks-based, composable components |
| **Language (FE)** | TypeScript | 5+ | Type safety, IDE support, prevents runtime bugs, enforces contracts |
| **Styling** | Tailwind CSS | v4 | Utility-first, design tokens, excellent dark mode, no separate CSS files |
| **HTTP Client** | Axios | 1.x | Interceptors for JWT auto-attach, centralized error handling |
| **Forms** | React Hook Form | 7+ | Minimal re-renders, uncontrolled inputs, native Zod integration |
| **Validation (FE)** | Zod | 3+ | Runtime schema validation, TypeScript inference, reusable schemas |
| **Icons** | Lucide React | Latest | Consistent, tree-shakeable, accessible SVG icons |
| **Notifications** | React Hot Toast | 2+ | Lightweight, beautiful toasts, accessible |
| **Date Handling** | date-fns | 3+ | Tree-shakeable, immutable, locale-aware |
| **Charts** | Recharts | 2+ | React-native charts, composable, performant |
| **Backend Framework** | FastAPI | 0.115+ | Async Python, auto OpenAPI docs, Pydantic integration, high performance |
| **Language (BE)** | Python | 3.12+ | Mature, readable, excellent ML/AI ecosystem for future features |
| **ORM** | SQLAlchemy | 2.0+ | Industry standard ORM, relationship management, migration support |
| **Validation (BE)** | Pydantic | v2 | Rust-powered validation, type inference, auto OpenAPI schema generation |
| **Database** | PostgreSQL | 16+ | ACID compliant, JSONB support, full-text search, battle-tested |
| **Auth** | JWT (PyJWT) | Latest | Stateless, scalable, role-embedded tokens, industry standard |
| **File Storage** | AWS S3 | -- | Scalable, CDN-ready, presigned URLs, industry standard for production |
| **Local Storage (Dev)** | Local filesystem | -- | uploads/ folder during development; swap to S3 via config flag |
| **Caching** | Redis | 7+ | In-memory, sub-millisecond reads, pub/sub for notifications |
| **Task Queue** | Celery + Redis | Latest | Async task processing (email, payment webhooks, notifications) |
| **Payment Gateway** | Razorpay | Latest | India-first, supports UPI/cards/net banking, webhook-based confirmation |
| **Email** | SendGrid / SMTP | -- | Transactional email (booking confirmation, OTP, receipts) |
| **CI/CD** | GitHub Actions | -- | Native GitHub integration, free tier, YAML-based, environment-aware |
| **Containerization** | Docker + Compose | Latest | Consistent environments, service isolation, easy onboarding |
| **Frontend Deploy** | Vercel | -- | Zero-config Next.js deployment, edge network, preview branches |
| **Backend Deploy** | Railway / AWS EC2 | -- | FastAPI deployment with Docker, auto-scaling ready |
| **DB Hosting** | Supabase / AWS RDS | -- | Managed PostgreSQL, backups, connection pooling |
| **Monitoring** | Sentry | -- | Error tracking, performance monitoring, release tracking |
| **Logging** | Loguru (BE) | -- | Structured logging, log levels, easy integration |
| **Testing (BE)** | Pytest + HTTPX | Latest | Async FastAPI testing, fixtures, coverage |
| **Testing (FE)** | Jest + RTL | Latest | Unit + integration component tests |
| **E2E Testing** | Playwright | Latest | Cross-browser, reliable, fast E2E automation |
| **API Documentation** | FastAPI Swagger UI | Built-in | Auto-generated from Pydantic schemas, always up-to-date |
| **DB Migrations** | Alembic | Latest | SQLAlchemy-native migration tool, versioned, rollback-safe |

---

### 2.2 Why NOT These Technologies

| Rejected Technology | Reason |
|--------------------|--------|
| Express.js / Node.js (BE) | Python preferred for future AI/ML; FastAPI is faster and type-safe |
| MongoDB | Relational data model needed; complex relationships between users, bookings, payments |
| GraphQL | Adds complexity; REST is sufficient and simpler for this domain |
| Redux | Overkill; React Context + custom hooks; server state via fetch hooks |
| Firebase Auth | Vendor lock-in; custom JWT gives full control over roles and claims |
| Supabase Auth | Fine-grained RBAC not possible out of the box |
| Microservices (initial) | Too complex for early stage; modular monolith first, migrate later |

---

## 3. Architecture

### 3.1 Why Modular Monolith

This project starts as a **Modular Monolith** — a single deployable application internally
organized as if it were microservices.

| Factor | Explanation |
|--------|-------------|
| **Team Size** | Small team initially. Microservices require DevOps overhead that slows delivery. |
| **Complexity** | Distributed systems introduce network failures and service discovery not needed now. |
| **Speed** | A monolith ships features 3-5x faster in early stages. |
| **Cost** | One server vs. N services; much cheaper to operate. |
| **Debuggability** | A single process is far easier to debug and trace. |
| **Future Ready** | Each module is isolated behind its own service and CRUD layer — extractable later. |

---

### 3.2 Why NOT Microservices (Now)

> "Microservices are not a solution to a problem. They are a solution to a SCALE problem.
>  Don't optimize for scale you don't have yet."

- No clear domain boundaries proven by traffic patterns
- No dedicated DevOps team for Kubernetes, service mesh, distributed tracing
- Premature decomposition leads to a "distributed monolith" — worst of both worlds
- PostgreSQL handles millions of rows without sharding

---

### 3.3 Microservices Migration Path (Strangler Fig Pattern)

```
Modular Monolith (Phase 1)
    |
    v
Extract Auth Service (when 100k+ users)
    |
    v
Extract Booking Service (when 10k+ bookings/day)
    |
    v
Extract Payment Service (when PCI compliance required)
    |
    v
Extract Notification Service (when 100k+ notifications/day)
    |
    v
Full Microservices (Phase N)
```

**Strategy**:
1. Identify module with highest load or independent deployment need
2. Create standalone service with its own database schema
3. Route traffic via API Gateway (Kong / AWS API Gateway)
4. Run monolith in parallel during migration
5. Decommission monolith module once traffic is fully migrated
6. Repeat for each module

---

### 3.4 Layered Architecture

```
+------------------------------------------+
|         Frontend (Next.js)               |  <- Presentation Layer
|  Pages -> Components -> Hooks -> Services |
+------------------------------------------+
|           REST API Layer                 |  <- Interface Layer
|     FastAPI Routers + Middleware         |
+------------------------------------------+
|          Application Layer               |  <- Business Logic
|       Services (business rules)          |
+------------------------------------------+
|         Domain / CRUD Layer              |  <- Data Access
|    Repositories (SQLAlchemy CRUD)        |
+------------------------------------------+
|          Infrastructure Layer            |  <- Storage
|  PostgreSQL . Redis . S3 . Celery        |
+------------------------------------------+
```

**Rule**: Data flows strictly top-to-bottom.
- A Router NEVER calls the database directly
- A Service NEVER imports another module's Router
- A CRUD layer NEVER contains business rules

---

### 3.5 Feature-Based Architecture

Each feature (module) is a vertical slice that owns its own:
- Database models, Pydantic schemas, CRUD layer, Service layer, API routes
- Frontend components, hooks, types, services

```
features/
  booking/
    models.py     <- SQLAlchemy models
    schemas.py    <- Pydantic schemas
    crud.py       <- Data access
    service.py    <- Business logic
    router.py     <- API endpoints
  artist/
    models.py
    schemas.py
    crud.py
    service.py
    router.py
```

Adding a new provider type (DJ, Photographer) = adding a new folder. Zero existing code touched.

---

### 3.6 Repository (CRUD) Pattern

Every database table is accessed ONLY through its dedicated CRUD class.

```python
# CORRECT pattern
class BookingCRUD:
    def create(self, db: Session, data: BookingCreate, client_id: UUID) -> Booking: ...
    def get_by_id(self, db: Session, booking_id: UUID) -> Booking | None: ...
    def list_by_client(self, db, client_id, page, size) -> tuple[list[Booking], int]: ...

# WRONG - Service calling db directly
class BookingService:
    def confirm(self, db: Session, booking_id: UUID):
        booking = db.query(Booking).filter(...).first()  # NEVER in service
```

---

### 3.7 Service Pattern

Services contain ALL business rules. Services call CRUD. Services NEVER import services from
different modules (use Celery tasks for cross-module communication).

```python
class BookingService:
    def __init__(self, crud: BookingCRUD):
        self.crud = crud

    def request_booking(self, db, data, client_id):
        # 1. Validate artist availability
        # 2. Check venue availability
        # 3. Calculate price
        # 4. Create booking in PENDING status
        # 5. Trigger notification task (Celery)
        ...
```

---

### 3.8 Dependency Injection

FastAPI's dependency injection is used for:
- Database session (`get_db`)
- Current user (`get_current_user`)
- Role guards (`get_current_client`, `get_current_artist`, `get_current_admin`)
- Service instances

```python
@router.post("/bookings", response_model=BookingResponse)
async def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client),
    service: BookingService = Depends(get_booking_service),
):
    return service.request_booking(db, data, current_user.id)
```

---

### 3.9 Domain-Driven Design (Light)

| DDD Concept | How It's Applied |
|-------------|-----------------|
| **Bounded Context** | Each module = bounded context (booking, artist, venue, auth) |
| **Ubiquitous Language** | Same terms in code as business: booking, artist, gig, venue, payout |
| **Entity** | SQLAlchemy models with UUID PKs |
| **Value Object** | Pydantic schemas for immutable data transfer |
| **Repository** | CRUD classes |
| **Service** | Service classes with business logic |
| **Domain Event** | Celery tasks triggered on state changes |

---

### 3.10 Scalability Strategy

```
Now (Modular Monolith):
    Next.js -> FastAPI (1 instance) -> PostgreSQL + Redis

Later (Scaled Monolith):
    Next.js -> Load Balancer -> FastAPI (N instances)
                             -> PostgreSQL Primary + Read Replica
                             -> Redis Cluster

Future (Microservices):
    Next.js -> API Gateway -> Auth Service
                           -> Booking Service
                           -> Payment Service
                           -> Notification Service
```

---

## 4. Complete Folder Structure

### 4.1 Repository Root

```
bandconnect/
|-- frontend/                    # Next.js 15 application
|-- backend/                     # FastAPI application
|-- shared/                      # Shared contracts (OpenAPI specs)
|-- docs/                        # Project documentation
|-- scripts/                     # DevOps, seed, migration scripts
|-- .github/                     # GitHub Actions CI/CD workflows
|-- docker-compose.yml           # Local development environment
|-- docker-compose.prod.yml      # Production Docker configuration
|-- .gitignore
|-- .env.example                 # Environment variable template
|-- MASTER.md                    # This file - Single source of truth
`-- README.md                    # Quick start guide
```

---

### 4.2 Backend Folder Structure

```
backend/
|-- app/
|   |-- core/
|   |   |-- __init__.py
|   |   |-- config.py            # App settings via Pydantic BaseSettings
|   |   |-- database.py          # SQLAlchemy engine + session factory
|   |   |-- security.py          # JWT creation, verification, password hashing
|   |   |-- dependencies.py      # get_db, get_current_user, role guards
|   |   `-- middleware.py        # CORS, logging, request ID middleware
|   |
|   |-- features/
|   |   |-- auth/
|   |   |   |-- models.py        # User model (base for all role types)
|   |   |   |-- schemas.py       # LoginRequest, TokenResponse, RegisterRequest
|   |   |   |-- crud.py          # User CRUD operations
|   |   |   |-- service.py       # Auth business logic
|   |   |   `-- router.py        # /auth/* endpoints
|   |   |
|   |   |-- artist/
|   |   |   |-- models.py        # Artist, ArtistImage, ArtistGenre models
|   |   |   |-- schemas.py       # ArtistCreate, ArtistUpdate, ArtistResponse
|   |   |   |-- crud.py          # Artist CRUD
|   |   |   |-- service.py       # Artist business logic
|   |   |   `-- router.py        # /artists/* endpoints
|   |   |
|   |   |-- venue/
|   |   |   |-- models.py        # Venue, VenueImage models
|   |   |   |-- schemas.py       # VenueCreate, VenueUpdate, VenueResponse
|   |   |   |-- crud.py          # Venue CRUD
|   |   |   |-- service.py       # Venue business logic
|   |   |   `-- router.py        # /venues/* endpoints
|   |   |
|   |   |-- booking/
|   |   |   |-- models.py        # Booking model + BookingStatus enum
|   |   |   |-- schemas.py       # BookingCreate, BookingUpdate, BookingResponse
|   |   |   |-- crud.py          # Booking CRUD
|   |   |   |-- service.py       # Booking business logic (availability, pricing)
|   |   |   `-- router.py        # /bookings/* endpoints
|   |   |
|   |   |-- payment/
|   |   |   |-- models.py        # Payment, Payout, Commission models
|   |   |   |-- schemas.py       # PaymentCreate, PayoutRequest, WebhookPayload
|   |   |   |-- crud.py          # Payment CRUD
|   |   |   |-- service.py       # Razorpay integration, escrow logic
|   |   |   `-- router.py        # /payments/* endpoints
|   |   |
|   |   |-- notification/
|   |   |   |-- models.py        # Notification model
|   |   |   |-- schemas.py       # NotificationResponse
|   |   |   |-- crud.py          # Notification CRUD
|   |   |   |-- service.py       # Push + email notification logic
|   |   |   `-- router.py        # /notifications/* endpoints
|   |   |
|   |   |-- review/
|   |   |   |-- models.py        # Review model
|   |   |   |-- schemas.py       # ReviewCreate, ReviewResponse
|   |   |   |-- crud.py          # Review CRUD
|   |   |   |-- service.py       # Review business logic
|   |   |   `-- router.py        # /reviews/* endpoints
|   |   |
|   |   |-- admin/
|   |   |   |-- schemas.py       # Admin-specific response schemas
|   |   |   |-- service.py       # Admin business logic
|   |   |   `-- router.py        # /admin/* endpoints
|   |   |
|   |   |-- report/
|   |   |   |-- schemas.py       # ReportFilters, ReportResponse
|   |   |   |-- service.py       # Report generation logic
|   |   |   `-- router.py        # /reports/* endpoints
|   |   |
|   |   `-- support/
|   |       |-- models.py        # SupportTicket model
|   |       |-- schemas.py       # TicketCreate, TicketResponse
|   |       |-- crud.py          # Ticket CRUD
|   |       |-- service.py       # Ticket routing logic
|   |       `-- router.py        # /support/* endpoints
|   |
|   |-- tasks/
|   |   |-- celery_app.py        # Celery application factory
|   |   |-- email_tasks.py       # Async email sending tasks
|   |   |-- payment_tasks.py     # Payment webhook processing tasks
|   |   `-- notification_tasks.py
|   |
|   |-- utils/
|   |   |-- image_upload.py      # File validation, S3/local storage
|   |   |-- pagination.py        # Generic pagination helper
|   |   |-- validators.py        # Custom Pydantic validators
|   |   |-- date_utils.py        # Date/time utilities
|   |   `-- slug.py              # Slug generation utility
|   |
|   `-- tests/
|       |-- conftest.py          # Pytest fixtures, test database setup
|       |-- test_auth.py
|       |-- test_artist.py
|       |-- test_venue.py
|       |-- test_booking.py
|       `-- test_payment.py
|
|-- alembic/
|   |-- env.py                   # Alembic migration environment
|   |-- versions/                # Migration files (auto-generated)
|   `-- alembic.ini
|
|-- uploads/                     # Local file storage (dev only)
|   |-- artists/
|   `-- venues/
|
|-- .env                         # Backend env variables (NEVER commit)
|-- .env.example                 # Template (commit this)
|-- main.py                      # FastAPI app factory + router registration
|-- requirements.txt             # Python dependencies
|-- requirements-dev.txt         # Dev deps (pytest, httpx, etc.)
`-- Dockerfile                   # Backend Docker image
```

---

### 4.3 Frontend Folder Structure

```
frontend/
|-- app/                         # Next.js App Router
|   |-- (public)/                # Route group - no auth required
|   |   |-- page.tsx             # Landing page
|   |   |-- artists/
|   |   |   |-- page.tsx         # Browse artists
|   |   |   `-- [slug]/
|   |   |       `-- page.tsx     # Artist public profile
|   |   |-- venues/
|   |   |   |-- page.tsx         # Browse venues
|   |   |   `-- [slug]/
|   |   |       `-- page.tsx     # Venue public profile
|   |   `-- layout.tsx           # Public layout (header, footer)
|   |
|   |-- (auth)/                  # Authentication pages
|   |   |-- login/
|   |   |   `-- page.tsx
|   |   |-- register/
|   |   |   `-- page.tsx         # Role selection -> specific form
|   |   `-- layout.tsx           # Auth layout (centered card)
|   |
|   |-- client/                  # Client dashboard
|   |   |-- dashboard/
|   |   |   `-- page.tsx
|   |   |-- bookings/
|   |   |   |-- page.tsx         # My bookings list
|   |   |   `-- [id]/
|   |   |       `-- page.tsx     # Booking detail
|   |   |-- favorites/
|   |   |   `-- page.tsx
|   |   `-- layout.tsx
|   |
|   |-- artist/                  # Artist dashboard
|   |   |-- dashboard/
|   |   |   `-- page.tsx
|   |   |-- profile/
|   |   |   `-- page.tsx         # Edit public profile
|   |   |-- bookings/
|   |   |   |-- page.tsx         # Incoming bookings
|   |   |   `-- [id]/
|   |   |       `-- page.tsx     # Booking detail + accept/reject
|   |   |-- earnings/
|   |   |   `-- page.tsx
|   |   `-- layout.tsx
|   |
|   |-- venue/                   # Venue Owner dashboard
|   |   |-- dashboard/
|   |   |   `-- page.tsx
|   |   |-- venues/
|   |   |   |-- page.tsx         # My venues list
|   |   |   |-- add/
|   |   |   |   `-- page.tsx     # Add venue wizard
|   |   |   `-- [id]/
|   |   |       |-- page.tsx     # Venue detail
|   |   |       `-- edit/
|   |   |           `-- page.tsx
|   |   |-- bookings/
|   |   |   `-- page.tsx
|   |   `-- layout.tsx
|   |
|   |-- admin/                   # Admin panel
|   |   |-- dashboard/
|   |   |   `-- page.tsx
|   |   |-- users/
|   |   |   `-- page.tsx
|   |   |-- bookings/
|   |   |   `-- page.tsx
|   |   |-- payments/
|   |   |   `-- page.tsx
|   |   |-- reports/
|   |   |   `-- page.tsx
|   |   |-- support/
|   |   |   `-- page.tsx
|   |   `-- layout.tsx
|   |
|   |-- globals.css              # Global styles, CSS variables, design tokens
|   |-- layout.tsx               # Root layout (fonts, providers)
|   `-- not-found.tsx            # 404 page
|
|-- components/
|   |-- ui/                      # Base UI components (design system atoms)
|   |   |-- Button.tsx
|   |   |-- Input.tsx
|   |   |-- Select.tsx
|   |   |-- Textarea.tsx
|   |   |-- Badge.tsx
|   |   |-- Card.tsx
|   |   |-- Modal.tsx
|   |   |-- Avatar.tsx
|   |   |-- Skeleton.tsx
|   |   |-- Spinner.tsx
|   |   |-- Pagination.tsx
|   |   |-- Table.tsx
|   |   |-- Tabs.tsx
|   |   |-- Tooltip.tsx
|   |   |-- Dropdown.tsx
|   |   |-- DatePicker.tsx
|   |   |-- StarRating.tsx
|   |   |-- EmptyState.tsx
|   |   `-- ErrorState.tsx
|   |
|   |-- layout/                  # Layout components (templates)
|   |   |-- Header.tsx
|   |   |-- Footer.tsx
|   |   |-- Sidebar.tsx
|   |   |-- DashboardLayout.tsx
|   |   |-- PublicLayout.tsx
|   |   `-- MobileNav.tsx
|   |
|   |-- shared/                  # Shared cross-feature components
|   |   |-- ProtectedRoute.tsx
|   |   |-- RoleGuard.tsx
|   |   |-- ImageUpload.tsx
|   |   |-- SearchBar.tsx
|   |   |-- FilterPanel.tsx
|   |   |-- SortControl.tsx
|   |   `-- ConfirmDialog.tsx
|   |
|   |-- artist/                  # Artist-specific components (organisms)
|   |   |-- ArtistCard.tsx
|   |   |-- ArtistProfileForm.tsx
|   |   |-- ArtistGallery.tsx
|   |   |-- ArtistAvailabilityCalendar.tsx
|   |   |-- ArtistGenreBadge.tsx
|   |   `-- ArtistStatusBadge.tsx
|   |
|   |-- venue/                   # Venue-specific components
|   |   |-- VenueCard.tsx
|   |   |-- VenueFormBasics.tsx
|   |   |-- VenueFormAmenities.tsx
|   |   |-- VenueFormGallery.tsx
|   |   |-- VenueFormPricing.tsx
|   |   `-- VenueStatusBadge.tsx
|   |
|   |-- booking/                 # Booking-specific components
|   |   |-- BookingCard.tsx
|   |   |-- BookingRequestForm.tsx
|   |   |-- BookingStatusBadge.tsx
|   |   |-- BookingTimeline.tsx
|   |   `-- BookingCalendar.tsx
|   |
|   `-- admin/                   # Admin-specific components
|       |-- StatsCard.tsx
|       |-- RevenueChart.tsx
|       |-- UserTable.tsx
|       `-- BookingTable.tsx
|
|-- lib/
|   |-- api/
|   |   `-- axiosConfig.ts       # Axios instance + JWT interceptor
|   |
|   |-- services/                # API service layer (one per domain)
|   |   |-- authService.ts
|   |   |-- artistService.ts
|   |   |-- venueService.ts
|   |   |-- bookingService.ts
|   |   |-- paymentService.ts
|   |   |-- reviewService.ts
|   |   |-- notificationService.ts
|   |   `-- adminService.ts
|   |
|   |-- hooks/                   # Custom React hooks
|   |   |-- useAuth.ts
|   |   |-- useArtistSearch.ts
|   |   |-- useVenueSearch.ts
|   |   |-- useBooking.ts
|   |   |-- usePagination.ts
|   |   |-- useDebounce.ts
|   |   |-- useLocalStorage.ts
|   |   `-- useNotification.ts
|   |
|   |-- validation/              # Zod schemas
|   |   |-- authSchemas.ts
|   |   |-- artistSchemas.ts
|   |   |-- venueSchemas.ts
|   |   |-- bookingSchemas.ts
|   |   `-- reviewSchemas.ts
|   |
|   |-- types/                   # TypeScript type definitions
|   |   |-- auth.ts
|   |   |-- artist.ts
|   |   |-- venue.ts
|   |   |-- booking.ts
|   |   |-- payment.ts
|   |   |-- review.ts
|   |   |-- notification.ts
|   |   |-- pagination.ts
|   |   `-- api.ts               # Generic API response types
|   |
|   |-- utils/                   # Pure utility functions
|   |   |-- formatCurrency.ts
|   |   |-- formatDate.ts
|   |   |-- generateSlug.ts
|   |   |-- classNames.ts        # Tailwind class merging
|   |   `-- storage.ts           # localStorage helpers
|   |
|   `-- context/                 # React Context providers
|       |-- AuthContext.tsx
|       `-- ThemeContext.tsx
|
|-- public/
|   |-- images/
|   |   |-- logo.svg
|   |   |-- hero-bg.webp
|   |   `-- placeholder-avatar.webp
|   |-- icons/
|   |   `-- favicon.ico
|   `-- fonts/
|
|-- .env.local                   # Local env variables (NEVER commit)
|-- .env.example
|-- next.config.ts
|-- tsconfig.json
|-- tailwind.config.ts
|-- postcss.config.mjs
|-- eslint.config.mjs
|-- jest.config.ts
|-- playwright.config.ts
|-- package.json
`-- Dockerfile
```

---

### 4.4 Documentation Folder

```
docs/
|-- MASTER.md                    # This document
|-- adr/                         # Architecture Decision Records
|   |-- ADR-001-modular-monolith.md
|   |-- ADR-002-jwt-auth.md
|   `-- ADR-003-postgresql.md
|-- api/                         # API documentation exports
|-- database/                    # ERD diagrams
|   `-- erd.md
`-- runbooks/
    |-- deployment.md
    `-- incident-response.md
```

---

### 4.5 Scripts Folder

```
scripts/
|-- seed_db.py                   # Database seeding with sample data
|-- create_admin.py              # Create initial admin user
|-- migrate.sh                   # Run Alembic migrations
|-- backup_db.sh                 # PostgreSQL backup script
`-- generate_openapi.py          # Export OpenAPI spec from FastAPI
```

---

## 5. Frontend Standards

### 5.1 Next.js Rules

| Rule | Details |
|------|---------|
| **Router** | Always use App Router (never Pages Router) |
| **Route Groups** | Use (group) for logical grouping without URL segments |
| **Layouts** | Each dashboard section has its own layout.tsx for sidebar/header isolation |
| **Metadata** | Every page.tsx must export metadata or generateMetadata |
| **Loading UI** | Every page with async data fetches must have a loading.tsx |
| **Error Boundary** | Every feature section must have an error.tsx |
| **Server Actions** | Never use Server Actions for sensitive mutations - use REST API only |
| **Image Component** | Always use next/image - never raw img tags |
| **Link Component** | Always use next/link - never raw a tags for internal navigation |
| **Font Optimization** | Use next/font for Google Fonts - never load from CDN in head |

---

### 5.2 Server vs Client Components

| Scenario | Component Type |
|----------|---------------|
| Data fetching from backend API | Server Component |
| SEO-critical content | Server Component |
| Static content (about, landing) | Server Component |
| Interactive forms | Client Component ("use client") |
| Event handlers (onClick, etc.) | Client Component |
| Browser APIs (localStorage, window) | Client Component |
| State (useState, useContext) | Client Component |
| Animated elements | Client Component |

**Rule**: Default to Server Components. Add "use client" only when interactivity is required.
Push "use client" boundary as far down the tree as possible.

---

### 5.3 State Management Strategy

| State Type | Solution |
|-----------|---------|
| **Server state** (API data) | Axios service + custom hook |
| **Local UI state** (modals, tabs) | useState in the component |
| **Form state** | React Hook Form |
| **Global auth state** | React Context (AuthContext) |
| **Global theme state** | React Context (ThemeContext) |
| **Complex global state** | Zustand (introduce only when needed) |

**Rules**:
- Never use Context for server state
- Never put API data into Context
- Always separate server state from UI state

---

### 5.4 Forms - Standard Pattern

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { artistProfileSchema, ArtistProfileFormData } from "@/lib/validation/artistSchemas";

export function ArtistProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArtistProfileFormData>({
    resolver: zodResolver(artistProfileSchema),
    defaultValues: { name: "", bio: "", genres: [] },
  });

  const onSubmit = async (data: ArtistProfileFormData) => {
    await artistService.updateProfile(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errors.name && <span className="text-red-400">{errors.name.message}</span>}
    </form>
  );
}
```

---

### 5.5 Validation with Zod

```typescript
// lib/validation/artistSchemas.ts
import { z } from "zod";

export const artistProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  bio: z.string().max(500).optional(),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  hourly_rate: z.number().positive("Rate must be positive"),
  experience_years: z.number().int().min(0).max(50),
});

// ALWAYS infer types from Zod - never define separately
export type ArtistProfileFormData = z.infer<typeof artistProfileSchema>;
```

---

### 5.6 Routing Conventions

| URL Pattern | Purpose |
|-------------|---------|
| `/` | Public landing page |
| `/artists` | Browse all artists |
| `/artists/[slug]` | Artist public profile |
| `/venues` | Browse all venues |
| `/venues/[slug]` | Venue public profile |
| `/client/dashboard` | Client home |
| `/client/bookings` | Client bookings |
| `/artist/dashboard` | Artist home |
| `/artist/bookings` | Incoming bookings |
| `/venue/dashboard` | Venue owner home |
| `/venue/venues` | My venues |
| `/admin/dashboard` | Admin home |
| `/login` | Login page |
| `/register` | Registration |

---

### 5.7 Atomic Design System

| Level | Example | Location |
|-------|---------|----------|
| **Atoms** | Button, Input, Badge, Avatar | components/ui/ |
| **Molecules** | SearchBar, StarRating, DatePicker | components/ui/ or components/shared/ |
| **Organisms** | ArtistCard, BookingForm, VenueCard | components/[feature]/ |
| **Templates** | DashboardLayout, PublicLayout | components/layout/ |
| **Pages** | app/[route]/page.tsx | app/ |

---

### 5.8 Component Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component file | PascalCase | ArtistCard.tsx |
| Component function | PascalCase | function ArtistCard() |
| Hook file | camelCase with use prefix | useArtistSearch.ts |
| Service file | camelCase with Service suffix | artistService.ts |
| Type file | camelCase | artist.ts |
| Validation file | camelCase with Schemas suffix | artistSchemas.ts |

---

### 5.9 Accessibility Rules

- Every interactive element must have aria-label or aria-describedby
- Color must NOT be the sole conveyor of information
- All images must have descriptive alt attributes
- Forms must have associated label elements
- Focus must be visible - never remove outline without replacement
- Keyboard navigation must work for all interactive elements
- WCAG 2.1 Level AA minimum compliance

---

### 5.10 Responsive Breakpoints (Tailwind)

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| Default | < 640px | Mobile - single column |
| sm | >= 640px | Large mobile |
| md | >= 768px | Tablet - 2 columns |
| lg | >= 1024px | Desktop - 3 columns |
| xl | >= 1280px | Large desktop |
| 2xl | >= 1536px | Wide screen |

Rule: Always design mobile-first. Use md: and lg: for progressive enhancement.

---

### 5.11 SEO Rules

```typescript
// Every page.tsx must export metadata
export const metadata: Metadata = {
  title: "Browse Artists | BandConnect",
  description: "Discover and book professional musicians and bands for your event.",
  openGraph: {
    title: "Browse Artists | BandConnect",
    description: "...",
    images: ["/images/og-artists.webp"],
  },
};
```

| SEO Element | Rule |
|------------|------|
| Title | [Page] | BandConnect format, max 60 chars |
| Description | 120-160 characters, unique per page |
| H1 | Exactly one H1 per page |
| Canonical | Set canonical URL on dynamic pages |
| OG Tags | Open Graph on all public pages |

---

## 6. Backend Standards

### 6.1 FastAPI Application Factory

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.features.auth.router import router as auth_router
from app.features.artist.router import router as artist_router

def create_app() -> FastAPI:
    app = FastAPI(
        title="BandConnect API",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )
    app.add_middleware(CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
    app.include_router(artist_router, prefix="/api/v1/artists", tags=["Artists"])
    return app

app = create_app()
```

---

### 6.2 Router Pattern

```python
# features/booking/router.py
router = APIRouter()

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_client),
    service: BookingService = Depends(get_booking_service),
):
    # Create a new booking request. Requires CLIENT role.
    return service.create_booking(db, data, client_id=current_user.id)
```

**Router Rules**:
- Routers contain ONLY route definitions and dependency injection
- No business logic in routers
- No database calls in routers
- Response model always explicitly defined
- Status codes always explicitly defined

---

### 6.3 Service Pattern

```python
# features/booking/service.py
class BookingService:
    def __init__(self, crud: BookingCRUD):
        self.crud = crud

    def create_booking(self, db, data, client_id):
        if self.crud.has_conflict(db, data.artist_id, data.event_date):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Artist is not available on this date."
            )
        return self.crud.create(db, data, client_id)

def get_booking_service() -> BookingService:
    return BookingService(crud=BookingCRUD())
```

---

### 6.4 CRUD Pattern

```python
# features/booking/crud.py
class BookingCRUD:
    def create(self, db, data, client_id):
        booking = Booking(**data.model_dump(), client_id=client_id)
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    def get_by_id(self, db, booking_id):
        return db.query(Booking).filter(
            Booking.id == booking_id,
            Booking.deleted_at.is_(None)
        ).first()

    def list_by_client(self, db, client_id, offset, limit):
        query = db.query(Booking).filter(
            Booking.client_id == client_id,
            Booking.deleted_at.is_(None)
        )
        total = query.count()
        items = query.order_by(Booking.created_at.desc()).offset(offset).limit(limit).all()
        return items, total
```

---

### 6.5 Schema Pattern

```python
# features/booking/schemas.py - SEPARATE schemas for Create, Update, Response
class BookingCreate(BaseModel):
    artist_id: UUID
    venue_id: UUID | None = None
    event_date: date
    event_type: str = Field(..., max_length=100)
    duration_hours: float = Field(..., gt=0, le=24)
    special_requirements: str | None = Field(None, max_length=500)

class BookingUpdate(BaseModel):
    status: BookingStatus | None = None

class BookingResponse(BaseModel):
    id: UUID
    client_id: UUID
    artist_id: UUID
    status: BookingStatus
    total_amount: float
    created_at: datetime
    model_config = {"from_attributes": True}
```

---

### 6.6 Exception Handling

```python
# Standard patterns
raise HTTPException(status_code=404, detail="Booking not found.")
raise HTTPException(status_code=401, detail="Invalid or expired token.")
raise HTTPException(status_code=403, detail="You are not authorized.")
raise HTTPException(status_code=409, detail="Artist already has a booking on this date.")
# 422 Unprocessable Entity - Pydantic handles automatically
```

---

### 6.7 Configuration

```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REDIS_URL: str = "redis://localhost:6379"
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    AWS_BUCKET_NAME: str | None = None
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

### 6.8 Logging

```python
from loguru import logger

# ALWAYS use logger - NEVER use print()
logger.info("Booking created", booking_id=str(booking.id), client_id=str(client_id))
logger.warning("Artist rejected booking", booking_id=str(booking.id))
logger.error("Payment webhook failed", error=str(e))
```

---

### 6.9 Middleware

| Middleware | Purpose |
|-----------|---------|
| **CORSMiddleware** | Allow frontend origin to call backend |
| **RequestIDMiddleware** | Attach unique X-Request-ID to every request |
| **LoggingMiddleware** | Log method, path, status code, duration |
| **RateLimitMiddleware** | Limit requests per IP via Redis |

---

## 7. Database Standards

### 7.1 Database Schema Overview

```
users
  id (UUID PK), email, password_hash, role, is_active, is_verified
  created_at, updated_at, deleted_at

artist_profiles
  id (UUID PK), user_id (FK), name, slug, bio, genres[], hourly_rate
  experience_years, status, created_at, updated_at

venues
  id (UUID PK), owner_user_id (FK), name, slug, location
  latitude, longitude, amenities (JSONB), pricing (JSONB), status
  created_at, updated_at, deleted_at

bookings
  id (UUID PK), client_id (FK), artist_id (FK), venue_id (FK)
  event_date, event_type, duration_hours, total_amount, status
  created_at, updated_at, deleted_at

payments
  id (UUID PK), booking_id (FK), razorpay_order_id, razorpay_payment_id
  amount, currency, status, created_at

reviews
  id (UUID PK), booking_id (FK), reviewer_id (FK), reviewee_id (FK)
  rating (1-5), comment, created_at

notifications
  id (UUID PK), user_id (FK), type, title, message, is_read, created_at
```

---

### 7.2 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Table names | snake_case, plural | artist_profiles, bookings |
| Column names | snake_case | user_id, created_at, hourly_rate |
| Primary key | id (UUID) | id UUID DEFAULT gen_random_uuid() |
| Foreign key | {table_singular}_id | artist_id, venue_id |
| Boolean columns | is_ prefix | is_active, is_verified, is_read |
| Timestamp columns | _at suffix | created_at, updated_at, deleted_at |
| Status columns | status (VARCHAR enum string) | status VARCHAR(50) |
| Junction tables | {table1}_{table2} | booking_services, artist_genres |

---

### 7.3 Primary Keys - UUID Only

**RULE**: ALL primary keys are UUIDs (UUID v4). NEVER use auto-increment integers.

**Why**:
- No sequential ID guessing (security)
- Globally unique - safe for distributed systems and future microservices
- No ID collision when merging data from multiple databases

```python
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Booking(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

---

### 7.4 Soft Delete

Every deletable entity uses soft delete.

```python
deleted_at = Column(DateTime(timezone=True), nullable=True, default=None)
```

**Rules**:
- Record is "deleted" when deleted_at IS NOT NULL
- ALL queries MUST filter WHERE deleted_at IS NULL
- Physical deletion only via admin scripts for GDPR compliance
- Hard delete NEVER happens from the API layer

---

### 7.5 Audit Fields (Required on Every Table)

```python
created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
deleted_at = Column(DateTime(timezone=True), nullable=True)  # for deletable entities
```

---

### 7.6 Indexes

```sql
-- Always index foreign keys
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_artist_id ON bookings(artist_id);

-- Index filter columns
CREATE INDEX idx_artist_profiles_status ON artist_profiles(status);
CREATE INDEX idx_bookings_event_date ON bookings(event_date);

-- Index soft-delete column
CREATE INDEX idx_bookings_deleted_at ON bookings(deleted_at);

-- Full-text search
CREATE INDEX idx_artist_profiles_search ON artist_profiles
  USING gin(to_tsvector('english', name || ' ' || bio));
```

---

### 7.7 Migration Rules (Alembic)

| Rule | Details |
|------|---------|
| **Never edit existing migrations** | Once committed, a migration is immutable |
| **One change per migration** | Each file = single atomic change |
| **Descriptive names** | 2026_07_08_add_artist_slug_column.py |
| **Always test rollback** | Every migration must have working downgrade() |
| **Never drop columns in prod** | Mark deprecated, collect data, drop in next release |

```bash
# Generate migration
alembic revision --autogenerate -m "add_artist_slug_column"

# Apply
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

---

### 7.8 Normalization Rules

| Rule | Details |
|------|---------|
| 3NF minimum | No transitive dependencies |
| No redundant data | Artist name not stored in Booking - always JOIN |
| JSONB for flexible data | amenities, pricing stored as JSONB |
| Enums as strings | Status columns use VARCHAR with CHECK constraints |
| No nullable foreign keys | Prefer junction tables for optional relationships |

---

## 8. API Standards

### 8.1 URL Naming

| Rule | Correct | Wrong |
|------|---------|-------|
| Lowercase, hyphenated | /artist-profiles | /artistProfiles |
| Noun, not verb | /bookings | /createBooking |
| Plural for collections | /artists | /artist |
| Nested for relationships | /artists/{id}/reviews | /getArtistReviews?id= |
| Version prefix | /api/v1/artists | /artists |

---

### 8.2 Versioning

All APIs are versioned at the URL level:
```
/api/v1/artists    <- current stable
/api/v2/artists    <- breaking changes only
```

Rules:
- A new version is created ONLY for breaking changes
- Both versions run simultaneously during deprecation (minimum 3 months)
- Deprecation notice via Deprecation response header

---

### 8.3 HTTP Methods

| Method | Usage | Idempotent |
|--------|-------|-----------|
| GET | Read data | Yes |
| POST | Create resource | No |
| PUT | Full update | Yes |
| PATCH | Partial update | Yes |
| DELETE | Delete (soft) | Yes |

---

### 8.4 HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Malformed request body |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token, insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource, scheduling conflict |
| 422 | Unprocessable Entity | Pydantic validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unhandled server error |

---

### 8.5 Standard Response Structure

Success:
```json
{
  "success": true,
  "data": { "..." },
  "message": "Booking created successfully."
}
```

Paginated:
```json
{
  "success": true,
  "data": {
    "items": ["..."],
    "total": 87,
    "page": 1,
    "page_size": 10,
    "total_pages": 9,
    "has_next": true,
    "has_prev": false
  }
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Artist is not available on this date.",
    "details": null
  }
}
```

Validation Error (422):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      { "field": "event_date", "message": "Event date must be in the future." }
    ]
  }
}
```

---

### 8.6 Pagination

```
GET /api/v1/artists?page=1&page_size=12&search=jazz&genre=pop&sort_by=rating&sort_order=desc
```

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| page | int | 1 | - |
| page_size | int | 12 | 100 |
| search | string | - | - |
| sort_by | string | created_at | - |
| sort_order | enum | desc | - |

---

### 8.7 Swagger Documentation Rules

```python
@router.get(
    "/{artist_id}",
    response_model=ArtistResponse,
    summary="Get artist profile",
    description="Returns the full public profile of an artist by their UUID.",
)
async def get_artist(artist_id: UUID, ...):
    # Retrieve a single artist profile by ID.
    ...
```

Rules:
- Every endpoint must have a docstring
- Every schema field must have description in Field()
- Response models always explicitly typed
- Tags assigned to group endpoints logically

---

## 9. Authentication & Authorization

### 9.1 Authentication Flow

```
Client Browser -> POST /auth/login {email, password}
    |
FastAPI Backend -> Verify bcrypt password hash
    |
Generate ACCESS_TOKEN (60 min) + REFRESH_TOKEN (7 days)
    |
Store refresh token hash in Redis (key=user_id)
    |
Return { access_token, refresh_token, role }

----

Subsequent requests:
Client -> GET /bookings (Authorization: Bearer ACCESS_TOKEN)
    |
FastAPI -> Decode + verify JWT signature
    |
Extract user_id, role from claims
    |
Return data

----

Token refresh:
Client -> POST /auth/refresh {refresh_token}
    |
FastAPI -> Verify refresh token against Redis
    |
Issue new access token
    |
Return { access_token }
```

---

### 9.2 JWT Token Structure

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "artist@example.com",
  "role": "artist",
  "iat": 1751942400,
  "exp": 1751946000
}
```

| Claim | Value | Purpose |
|-------|-------|---------|
| sub | UUID | User identifier |
| email | string | User email |
| role | client / artist / venue_owner / admin | Role for RBAC |
| iat | Unix timestamp | Issued at |
| exp | Unix timestamp | Expiry |

---

### 9.3 RBAC - Role-Based Access Control

| Permission | Client | Artist | Venue Owner | Admin |
|-----------|:------:|:------:|:-----------:|:-----:|
| Browse artists / venues | Yes | Yes | Yes | Yes |
| View own bookings | Yes | Yes | Yes | Yes |
| Create booking request | Yes | No | No | No |
| Accept/Reject booking | No | Yes | Yes | Yes |
| Manage own artist profile | No | Yes | No | Yes |
| Manage own venues | No | No | Yes | Yes |
| View all users | No | No | No | Yes |
| View all bookings | No | No | No | Yes |
| Process payouts | No | No | No | Yes |
| Ban users | No | No | No | Yes |

---

### 9.4 FastAPI Role Guards

```python
# app/core/dependencies.py
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)  # raises 401 if invalid
    return payload

def get_current_client(user = Depends(get_current_user)):
    if user["role"] != "client":
        raise HTTPException(status_code=403, detail="Client access required.")
    return user

def get_current_artist(user = Depends(get_current_user)):
    if user["role"] != "artist":
        raise HTTPException(status_code=403, detail="Artist access required.")
    return user

def get_current_admin(user = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user
```

---

### 9.5 Password Policy

| Rule | Requirement |
|------|------------|
| Minimum length | 8 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Number | At least 1 digit |
| Special character | At least 1 |
| Hashing algorithm | bcrypt with salt rounds >= 12 |
| Reset token | Cryptographically secure random, 1-hour expiry |
| Max attempts | 5 failed -> account locked 15 minutes |

---

### 9.6 Frontend Protected Routes

```typescript
// components/shared/ProtectedRoute.tsx
"use client";
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.replace("/unauthorized");
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) return <Spinner />;
  return <>{children}</>;
}
```

---

### 9.7 Token Storage Strategy

| Option | Decision | Reason |
|--------|----------|--------|
| localStorage for access token | Used | Simple, works across tabs |
| httpOnly cookie for refresh token | Used | Prevents XSS access to refresh token |
| sessionStorage | Never | Cleared on tab close |
| Sensitive data in token payload | Never | Only user_id, role, email |

---

## 10. Coding Standards

### 10.1 SOLID Principles

| Principle | Application |
|-----------|------------|
| S - Single Responsibility | Each class/function does one thing. BookingService handles bookings only. |
| O - Open/Closed | Abstract base classes + DI - extend without modifying existing code. |
| L - Liskov Substitution | Services replaceable via dependency injection. |
| I - Interface Segregation | Separate schemas for Create, Update, Response - not one mega-schema. |
| D - Dependency Inversion | Services depend on CRUD abstractions; FastAPI DI injects implementations. |

---

### 10.2 DRY, KISS, YAGNI

- **DRY**: Reusable Tailwind classes in globals.css, generic pagination in utils
- **KISS**: Simple loop before complex algorithm, clear variable names over clever one-liners
- **YAGNI**: No feature flags for features not planned, no over-abstraction

---

### 10.3 TypeScript Rules

| Rule | Enforcement |
|------|------------|
| strict: true in tsconfig.json | Required |
| No any type | ESLint error - @typescript-eslint/no-explicit-any |
| No as casting without comment | Review required |
| No ! non-null assertion without comment | Review required |
| All function parameters typed | Required |
| All function return types typed | Required for service layer |
| Enums for fixed value sets | Use const enum or Zod enum |
| Prefer interface for objects | Use type for unions and primitives |

---

### 10.4 Naming Conventions

| Element | Frontend (TS) | Backend (Python) |
|---------|--------------|-----------------|
| Variables | camelCase | snake_case |
| Functions | camelCase | snake_case |
| Classes | PascalCase | PascalCase |
| Constants | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE |
| Files | camelCase.ts or PascalCase.tsx | snake_case.py |
| Database tables | - | snake_case plural |
| Env variables | NEXT_PUBLIC_* (public) | UPPER_SNAKE_CASE |

---

### 10.5 Comment Rules

```typescript
// CORRECT - Explains WHY, not WHAT
// Refresh token in httpOnly cookie prevents XSS theft
const refreshToken = getCookie("refresh_token");

// WRONG - Explains WHAT (code already shows that)
// Get refresh token from cookie
const refreshToken = getCookie("refresh_token");

// CORRECT - TODO with ticket reference
// TODO: [BC-142] Implement exponential backoff for failed payment retries

// CORRECT - Complex logic explanation
// We check availability 30 minutes before event start
// to account for artist travel and setup time.
const bufferTime = eventStartTime - 30 * 60 * 1000;
```

---

### 10.6 Function Rules

| Rule | Details |
|------|---------|
| Max lines | 30 lines per function. Extract if longer. |
| Single responsibility | One function = one thing |
| Pure when possible | No side effects in utility functions |
| No magic numbers | Name constants, never hardcode numbers inline |
| Early return | Return early for guard clauses - no deeply nested if/else |

```typescript
// CORRECT - Early return
function validateBookingDate(date: Date): boolean {
  if (!date) return false;
  if (date < new Date()) return false;
  if (isBlackoutDate(date)) return false;
  return true;
}
```

---

### 10.7 File Length Limits

| File Type | Max Lines |
|-----------|-----------|
| React component | 200 |
| Custom hook | 100 |
| Service file (BE) | 150 |
| CRUD file (BE) | 150 |
| Schema file | 100 |
| Router file | 80 |
| Utility file | 80 |

If a file exceeds its limit, split into multiple focused files.

---

### 10.8 Import Rules

```typescript
// CORRECT import order:
// 1. React / Next.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// 3. Internal - absolute paths with @/
import { Button } from "@/components/ui/Button";
import { artistService } from "@/lib/services/artistService";
import type { Artist } from "@/lib/types/artist";

// CORRECT - use absolute imports
import { Button } from "@/components/ui/Button";   // Good

// WRONG - relative beyond one level
import { Button } from "../../../components/ui/Button";  // Bad
```

---

## 11. Performance Standards

### 11.1 Caching Strategy

| Data | Cache | TTL | Strategy |
|------|-------|-----|---------|
| Artist list | Redis | 5 min | Cache aside |
| Artist profile | Redis | 10 min | Cache aside |
| Venue list | Redis | 5 min | Cache aside |
| User session | Redis | 60 min | Session store |
| Search results | Redis | 2 min | Cache aside |
| Static content | Vercel Edge | 24h | Stale-while-revalidate |
| Genre/category master | Redis | 1h | Cache aside |

---

### 11.2 Frontend Performance

| Technique | Implementation |
|-----------|---------------|
| Lazy Loading | next/dynamic for heavy components (calendar, chart) |
| Image Optimization | next/image with WebP format, responsive sizes |
| Code Splitting | Automatic with App Router; manual with dynamic() |
| Virtualization | react-window for lists > 100 items |
| Debouncing | Search input debounced 300ms via useDebounce hook |
| Memoization | useMemo and useCallback only after profiling |
| Bundle Analysis | @next/bundle-analyzer before each release |

---

### 11.3 Backend Performance

| Technique | Implementation |
|-----------|---------------|
| Async handlers | All FastAPI endpoints are async def |
| Connection pooling | SQLAlchemy with pool_size=10, max_overflow=20 |
| Eager loading | .options(joinedload(...)) to prevent N+1 queries |
| Database indexes | All FK columns and filter columns indexed |
| Pagination | Maximum 100 items per page, never full table scans |
| Background tasks | Celery for email, notifications, webhooks |
| Redis caching | Cache expensive queries with TTL |

---

### 11.4 N+1 Query Prevention

```python
# WRONG - N+1 queries
bookings = db.query(Booking).all()
for booking in bookings:
    print(booking.artist.name)  # Separate query per booking!

# CORRECT - Eager load
from sqlalchemy.orm import joinedload
bookings = db.query(Booking).options(
    joinedload(Booking.artist),
    joinedload(Booking.venue)
).all()
```

---

## 12. Security Standards

### 12.1 OWASP Top 10 Mitigations

| Threat | Mitigation |
|--------|-----------|
| A01 Broken Access Control | RBAC enforced via FastAPI dependencies on every endpoint |
| A02 Cryptographic Failures | bcrypt for passwords, HS256 JWT with strong secret key |
| A03 Injection | SQLAlchemy ORM - no raw SQL string interpolation |
| A04 Insecure Design | Threat modeling before each new module |
| A05 Security Misconfiguration | Environment variables, no debug mode in production |
| A06 Vulnerable Components | pip audit and npm audit in CI pipeline |
| A07 Auth Failures | Account lockout, rate limiting, secure token storage |
| A08 Integrity Failures | Razorpay webhook signature verification |
| A09 Logging Failures | All auth events, payment events, errors logged |
| A10 SSRF | Never fetch user-provided URLs from backend |

---

### 12.2 XSS Prevention

- All user input rendered via React (auto-escapes HTML)
- Never use dangerouslySetInnerHTML unless sanitized with DOMPurify
- Content Security Policy header set in next.config.ts

---

### 12.3 CSRF Prevention

- JWT in Authorization header is not vulnerable to CSRF
- Refresh token in httpOnly cookie uses SameSite=Strict

---

### 12.4 SQL Injection Prevention

- SQLAlchemy ORM everywhere - no string-formatted SQL
- Pydantic validates all inputs before they reach the database
- No raw SQL text() unless parameterized

---

### 12.5 Rate Limiting

```python
# Using slowapi
@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, data: LoginRequest, ...):
    ...
```

| Endpoint | Rate Limit |
|---------|-----------|
| POST /auth/login | 5 / minute / IP |
| POST /auth/register | 3 / minute / IP |
| POST /bookings | 10 / minute / user |
| GET /artists | 60 / minute / IP |
| All other | 120 / minute / IP |

---

### 12.6 Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];
```

---

### 12.7 Secrets Management

| Secret | Storage | Access |
|--------|---------|--------|
| JWT Secret Key | Environment variable | Backend only |
| Database URL | Environment variable | Backend only |
| Razorpay Keys | Environment variable | Backend only |
| AWS Credentials | Env variable / IAM Role | Backend only |
| NEXT_PUBLIC_* | Environment variable | Frontend (public) |

Rules:
- .env files are NEVER committed to git
- .env.example is ALWAYS committed as a template
- Production secrets stored in Railway / AWS Secrets Manager
- Rotate JWT secret on suspected compromise immediately

---

## 13. UI Design System

### 13.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | #FF6B35 | CTA buttons, accent, highlights |
| --color-primary-hover | #E85A25 | Button hover states |
| --color-secondary | #1DB954 | Success states, badges |
| --color-accent | #FFD700 | Star ratings, premium badges |
| --color-bg-primary | #0A0A0F | Page background |
| --color-bg-card | #12121A | Card backgrounds |
| --color-bg-elevated | #1A1A28 | Elevated surfaces, modals |
| --color-border | #2A2A3A | Borders, dividers |
| --color-text-primary | #F0F0F5 | Primary text |
| --color-text-secondary | #8888AA | Secondary, placeholder text |
| --color-text-muted | #555570 | Disabled, captions |
| --color-error | #FF4444 | Error states |
| --color-warning | #FFA500 | Warning states |
| --color-success | #1DB954 | Success states |

---

### 13.2 Typography

| Font | Usage | Source |
|------|-------|--------|
| Inter | Body text, UI labels | Google Fonts (next/font) |
| Syne | Headings, hero text | Google Fonts (next/font) |
| JetBrains Mono | Code snippets, IDs | Google Fonts (next/font) |

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| text-xs | 12px | 400 | Captions, metadata |
| text-sm | 14px | 400 | Secondary text, labels |
| text-base | 16px | 400 | Body text |
| text-lg | 18px | 500 | Lead text |
| text-xl | 20px | 600 | Card titles |
| text-2xl | 24px | 700 | Section headings |
| text-3xl | 30px | 700 | Page headings |
| text-4xl | 36px | 800 | Hero headings |
| text-5xl | 48px | 900 | Landing hero |

---

### 13.3 Spacing System (Tailwind 4px base)

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight internal spacing |
| space-2 | 8px | Component internal padding |
| space-4 | 16px | Standard component gap |
| space-6 | 24px | Section internal padding |
| space-8 | 32px | Card padding |
| space-12 | 48px | Section spacing |
| space-16 | 64px | Page section spacing |

---

### 13.4 Button Variants

| Variant | Usage |
|---------|-------|
| primary | bg-[--color-primary] text-white - Main CTA |
| secondary | border border-[--color-border] - Secondary action |
| ghost | text-[--color-primary] hover:bg-primary/10 - Tertiary |
| danger | bg-red-600 text-white - Destructive action |
| sm | h-8 px-3 text-sm |
| md | h-10 px-4 text-base (default) |
| lg | h-12 px-6 text-lg |

---

### 13.5 Loading States

| State | Component | Pattern |
|-------|-----------|---------|
| Page loading | Spinner + overlay | Centered, blocks interaction |
| List loading | Skeleton cards | Match content shape exactly |
| Button loading | Spinner in button | Disable button + show spinner |
| Image loading | Skeleton rectangle | Match image dimensions |

RULE: Every async operation MUST show a loading state. Never let the UI appear frozen.

---

### 13.6 Empty States

Every list/table that can be empty must show an EmptyState component:

```typescript
<EmptyState
  icon={<Music className="h-12 w-12" />}
  title="No artists found"
  description="Try adjusting your search filters or browse all artists."
  action={<Button>Browse All Artists</Button>}
/>
```

---

### 13.7 Toast Notifications

| Event | Toast Type |
|-------|-----------|
| Booking created | success |
| Payment successful | success |
| Form validation error | error |
| API error | error |
| File upload complete | success |

```typescript
import toast from "react-hot-toast";
toast.success("Booking request sent successfully!");
toast.error("Failed to submit booking. Please try again.");
toast.loading("Processing payment...");
```

---

### 13.8 Theme Rules

- Dark mode is the DEFAULT and primary experience
- All CSS variables defined in globals.css under :root
- Never hardcode hex colors in components - always use CSS variables or Tailwind tokens

---

## 14. Development Workflow

### 14.1 Development Phases

| Phase | Duration | Goal |
|-------|----------|------|
| Phase 0 - Setup | Week 1 | Repo, Docker, CI/CD, DB, Auth |
| Phase 1 - Core | Weeks 2-5 | Auth, Artist profiles, Admin panel |
| Phase 2 - Booking | Weeks 6-9 | Booking flow, Calendar, Payment |
| Phase 3 - Venues | Weeks 10-11 | Venue owner module |
| Phase 4 - Reviews & Notifications | Weeks 12-13 | Reviews, Ratings, Email |
| Phase 5 - Analytics | Weeks 14-15 | Reports, Charts |
| Phase 6 - Polish | Weeks 16-17 | Performance, SEO, Accessibility |
| Phase 7 - Launch | Week 18 | Production deployment, monitoring |

---

### 14.2 Sprint Structure

- Sprint Duration: 2 weeks
- Sprint Planning: Monday Day 1 (2h)
- Daily Standup: Every day (15 min)
- Sprint Review: Last Friday (1h)
- Sprint Retrospective: Last Friday (30 min)

---

### 14.3 Definition of Ready

A task is ready when:
- [ ] User story written with acceptance criteria
- [ ] API contract agreed (endpoint, request, response)
- [ ] Database schema changes agreed
- [ ] UI mockup reviewed
- [ ] Dependencies identified and unblocked
- [ ] Story points assigned

---

### 14.4 Definition of Done

A task is done when:
- [ ] Code written following all standards in MASTER.md
- [ ] Unit tests written and passing
- [ ] API tested in Swagger / Postman
- [ ] Frontend tested in browser (desktop + mobile)
- [ ] Code reviewed and approved (min 1 reviewer)
- [ ] No ESLint / TypeScript errors
- [ ] No console.log or print() left in code
- [ ] PR merged to develop
- [ ] Deployed to staging and smoke-tested

---

### 14.5 Module Development Checklist

For every new feature module:

**Backend:**
1. Add database models in features/{module}/models.py
2. Create Alembic migration
3. Add Pydantic schemas in features/{module}/schemas.py
4. Create CRUD class in features/{module}/crud.py
5. Create Service class in features/{module}/service.py
6. Create Router in features/{module}/router.py
7. Register router in main.py
8. Write pytest tests

**Frontend:**
1. Define TypeScript types in lib/types/{module}.ts
2. Define Zod schemas in lib/validation/{module}Schemas.ts
3. Create API service in lib/services/{module}Service.ts
4. Create custom hooks in lib/hooks/use{Module}.ts
5. Build reusable components in components/{module}/
6. Build page files in app/{role}/{module}/

---

### 14.6 Code Review Checklist

| Check | Description |
|-------|-------------|
| Architecture | Follows layered architecture |
| Naming | Follows naming conventions |
| Types | No any, no !, proper TypeScript |
| Security | Auth/authz on all protected endpoints |
| Validation | Zod / Pydantic validation on all inputs |
| Error handling | All errors handled gracefully |
| No hardcoded values | No hardcoded URLs, strings, colors |
| No duplicate code | DRY principle followed |
| Tests | Tests written for new logic |
| Performance | No N+1 queries, no unnecessary re-renders |

---

## 15. Git Workflow

### 15.1 Branch Strategy (Git Flow)

```
main          <- Production-ready, tagged releases only
develop       <- Integration branch, always deployable to staging
feature/*     <- New features, branched from develop
fix/*         <- Bug fixes, branched from develop
hotfix/*      <- Critical production fixes, branched from main
release/*     <- Release preparation, branched from develop
```

---

### 15.2 Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | feature/BC-{ticket}-description | feature/BC-42-artist-profile-page |
| Bug fix | fix/BC-{ticket}-description | fix/BC-99-booking-date-validation |
| Hotfix | hotfix/BC-{ticket}-description | hotfix/BC-101-payment-webhook-fail |
| Release | release/v{major}.{minor}.{patch} | release/v1.2.0 |
| Chore | chore/description | chore/update-dependencies |

---

### 15.3 Commit Convention (Conventional Commits)

Format: <type>(<scope>): <short description>

| Type | Usage |
|------|-------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation changes |
| style | Formatting, no logic change |
| refactor | Code restructure, no behavior change |
| perf | Performance improvement |
| test | Add or fix tests |
| chore | Build, deps, CI changes |

Examples:
```
feat(booking): add artist availability calendar
fix(auth): handle expired token gracefully on refresh
perf(artist): add Redis caching to artist list endpoint
chore(deps): upgrade Next.js to 15.3.0
```

---

### 15.4 Pull Request Rules

| Rule | Requirement |
|------|------------|
| Title | Follow commit convention format |
| Description | Explain what, why, and how |
| Linked issue | Must reference ticket (Closes #42) |
| Screenshots | Required for UI changes |
| Tests | Must include or update tests |
| Reviewers | Minimum 1 required approval |
| CI status | All checks must pass before merge |
| No self-merge | Never merge your own PR |
| Branch up-to-date | Must be rebased on develop before merge |

---

### 15.5 Semantic Versioning

```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR -> Breaking API or database change
MINOR -> New backward-compatible feature
PATCH -> Bug fix or performance improvement
```

---

## 16. Testing Strategy

### 16.1 Testing Pyramid

```
          /\
         /  \    E2E Tests (Playwright) - 20%
        / E2E\   Slow, brittle, expensive
       /------\
      /Integr. \  Integration Tests (Pytest HTTPX) - 30%
     /  Tests   \ Test service + DB together
    /------------\
   /  Unit Tests  \ Unit Tests (Pytest / Jest) - 50%
  /--------------\ Fast, isolated, cheap
```

---

### 16.2 Backend Testing (Pytest)

```python
@pytest.mark.asyncio
async def test_create_booking_success(async_client, client_token):
    response = await async_client.post(
        "/api/v1/bookings",
        json={
            "artist_id": "550e8400-e29b-41d4-a716-446655440001",
            "event_date": "2026-08-15",
            "event_type": "Wedding",
            "duration_hours": 3,
        },
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert response.status_code == 201
    assert response.json()["data"]["status"] == "pending"

@pytest.mark.asyncio
async def test_create_booking_requires_auth(async_client):
    response = await async_client.post("/api/v1/bookings", json={})
    assert response.status_code == 401
```

---

### 16.3 Frontend Testing (Jest + RTL)

```typescript
// ArtistCard.test.tsx
const mockArtist = {
  id: "1", name: "The Jazz Quartet",
  genres: ["Jazz", "Blues"], hourly_rate: 8000, rating: 4.8,
};

describe("ArtistCard", () => {
  it("renders artist name", () => {
    render(<ArtistCard artist={mockArtist} />);
    expect(screen.getByText("The Jazz Quartet")).toBeInTheDocument();
  });

  it("renders genre badges", () => {
    render(<ArtistCard artist={mockArtist} />);
    expect(screen.getByText("Jazz")).toBeInTheDocument();
  });
});
```

---

### 16.4 E2E Testing (Playwright)

```typescript
// e2e/booking-flow.spec.ts
test("client can complete booking flow", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[id="email"]', "client@test.com");
  await page.fill('[id="password"]', "TestPass123!");
  await page.click('[id="login-submit"]');
  await page.goto("/artists");
  await page.click('[data-testid="artist-card-0"]');
  await page.click('[id="book-artist-btn"]');
  await page.fill('[id="event-date"]', "2026-08-15");
  await page.click('[id="submit-booking"]');
  await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
});
```

---

### 16.5 Performance Testing

- Locust for load testing booking and search endpoints
- Target: 500 concurrent users with p99 < 500ms
- Run before every major release

---

## 17. Deployment Strategy

### 17.1 Environments

| Environment | Purpose | Branch | URL |
|-------------|---------|--------|-----|
| Development | Local developer | feature/* | localhost:3000 |
| Staging | Pre-production testing | develop | staging.bandconnect.in |
| Production | Live platform | main | bandconnect.in |

---

### 17.2 Docker Compose (Development)

```yaml
version: "3.9"
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    volumes:
      - ./frontend:/app
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/bandconnect
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=bandconnect
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  celery:
    build: ./backend
    command: celery -A app.tasks.celery_app worker --loglevel=info
    depends_on:
      - redis
      - db

volumes:
  postgres_data:
```

---

### 17.3 CI/CD Pipeline (GitHub Actions)

```yaml
name: CI Pipeline
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: bandconnect_test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r backend/requirements-dev.txt
      - run: pytest backend/app/tests/ --cov

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run type-check
      - run: cd frontend && npm run test

  deploy-staging:
    needs: [backend-tests, frontend-tests]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway (Backend)
        run: echo "Railway deploy"
      - name: Deploy to Vercel (Frontend)
        run: echo "Vercel deploy"
```

---

### 17.4 Production Infrastructure

```
DNS & CDN (Cloudflare)
    |
    +-> Frontend (Vercel Edge Network)
    |
    +-> Load Balancer
            |
            +-> FastAPI Instance 1
            +-> FastAPI Instance 2
                    |
                    +-> PostgreSQL Primary (Supabase / AWS RDS)
                    |       |
                    |       +-> Read Replica
                    |
                    +-> Redis Cluster
                    |
                    +-> AWS S3 (File Storage)
                    |
                    +-> Sentry (Error Tracking)
                    +-> Prometheus + Grafana (Metrics)
```

---

### 17.5 Database Backup Strategy

| Frequency | Method | Retention |
|-----------|--------|-----------|
| Hourly | Automated Supabase snapshot | 24 hours |
| Daily | pg_dump to S3 | 30 days |
| Weekly | Full DB export to S3 | 90 days |
| Monthly | Archive snapshot | 1 year |

---

## 18. AI Engineering Rules

### 18.1 Universal Rules for ALL AI Assistants

```
========================================================
  MANDATORY - READ BEFORE GENERATING ANY CODE
========================================================

Every AI tool MUST:

1.  READ this MASTER.md completely before generating any code.
2.  IDENTIFY the feature module being requested.
3.  CHECK if the module already exists - NEVER regenerate existing code.
4.  FOLLOW the folder structure defined in Section 4 exactly.
5.  FOLLOW the naming conventions defined in Section 10 exactly.
6.  NEVER use `any` type in TypeScript - strict mode is enforced.
7.  NEVER hardcode colors, URLs, strings, or magic numbers.
8.  NEVER skip validation - every input must be validated.
9.  NEVER add raw SQL - use SQLAlchemy ORM only.
10. ALWAYS generate reusable components, hooks, and services.
11. ALWAYS define Pydantic schemas separately: Create, Update, Response.
12. ALWAYS use Zod for frontend validation.
13. ALWAYS use React Hook Form for forms.
14. ALWAYS handle loading, error, and empty states.
15. ALWAYS add auth dependency to protected endpoints.
16. ALWAYS follow layered architecture: Router -> Service -> CRUD -> DB.
17. ALWAYS explain every file you generate and every API endpoint.
18. NEVER generate multiple modules at once - one module at a time.
19. NEVER modify completed, working modules - only extend them.
20. ALWAYS use UUIDs for primary keys - never auto-increment integers.
21. ALWAYS soft delete - never hard delete from API.
22. ALWAYS include audit fields: created_at, updated_at, deleted_at.
23. NEVER use print() in backend - always use logger.
24. NEVER use console.log in production frontend code.
25. ALWAYS paginate list endpoints - never return full table.
========================================================
```

---

### 18.2 GitHub Copilot Rules

```
// .github/copilot-instructions.md
Copilot must:
- Suggest TypeScript types for all completions (no any)
- Never suggest inline styles - use Tailwind CSS classes
- Never suggest class components - only functional
- Always suggest React Hook Form for form fields
- Always suggest Zod for validation schemas
- Never suggest localStorage for sensitive data
- Suggest error handling in every async function
- Never suggest auto-increment integer IDs
- Always suggest soft delete patterns
```

---

### 18.3 Claude / Gemini / ChatGPT Prompt Template

```
Context to always provide in prompts:

1. "Read MASTER.md section [X] before generating."
2. "Tech stack: Next.js 15 App Router, FastAPI, PostgreSQL, SQLAlchemy 2.0,
    Pydantic v2, Tailwind CSS v4, TypeScript strict."
3. "Follow the existing patterns in [reference file]."
4. "Generate ONLY [specific file] - do not regenerate existing files."
5. "Use TypeScript strict mode - no any types."
6. "Use the folder structure from MASTER.md Section 4."
7. "Use UUIDs for all primary keys."
8. "Follow the layered architecture: Router -> Service -> CRUD -> DB."
```

---

### 18.4 Antigravity / Cursor / Windsurf Rules

```
Before generating code:
1. Always read MASTER.md first.
2. Always read the existing file before modifying it.
3. Never delete existing code without explicit instruction.
4. Check for existing similar components before creating new ones.
5. Follow the exact folder structure - never create files in wrong locations.
6. Always suggest running migrations after model changes.
7. Always verify import paths are correct for the project structure.
8. Generate one file at a time, wait for approval before continuing.
9. Never rename existing files (breaks imports).
10. Never move existing files (breaks imports).
```

---

### 18.5 Mandatory AI Assistant Workflow

Every AI assistant must strictly adhere to the following workflow:

1. **Read MASTER.md First**: Under no circumstances should any code be written or proposed without fully parsing this document.
2. **Read Completed Modules**: Read and understand the design and implementations of all completed modules prior to starting a new task.
3. **Never Duplicate Code**: Reuse existing codebase structures, components, hooks, schemas, utility helpers, and APIs.
4. **Reuse Components**: Prioritize importing and utilizing existing React components.
5. **Reuse Hooks**: Prioritize using existing React custom hooks.
6. **Reuse Services**: Reuse existing API services, storage controllers, and DB repositories.
7. **Reuse Models**: Reuse existing SQLAlchemy database models and tables instead of duplicating them.
8. **Reuse Validation**: Reuse existing Zod schemas and Pydantic validation files.
9. **Never Modify Completed Modules**: Completed features and modules must never be altered or modified unless explicitly fixing compile or runtime bugs.
10. **Review Generated Code**: Always perform import sanity checks and compilation checks.
11. **Fix Issues Immediately**: Fix all TypeScript, ESLint, or Python router import warnings before proposing final code.
12. **Optimize Performance**: Optimize SQL queries and minimize heavy bundle weights.
13. **Stop Upon Completion**: End the turn immediately upon completing the requested task module. Do not start next module tasks without instructions.

---

## 19. Project Modules

### 19.1 Module Registry

| Module | Phase | Responsibility |
|--------|-------|---------------|
| **Authentication** | 0 | Registration, login, JWT, refresh, password reset, email verification |
| **Artist Profile** | 1 | Profile creation, media upload, genre management, availability calendar |
| **Venue** | 2 | Venue listing, images, amenities, pricing, availability |
| **Client** | 1 | Client profile, favorites, booking history |
| **Booking** | 2 | Booking request, acceptance, scheduling, conflict detection |
| **Payment** | 2 | Razorpay integration, escrow, commission, payout |
| **Notification** | 4 | Email, in-app notifications, push notifications |
| **Review** | 4 | Post-booking reviews, ratings, moderation |
| **Admin** | 1 | User management, platform oversight, dispute resolution |
| **Report** | 5 | Booking reports, revenue reports, Excel/PDF export |
| **Analytics** | 5 | KPI dashboards, trend charts |
| **Support** | 4 | Help tickets, FAQ, dispute management |
| **Settings** | 3 | User profile settings, notification preferences |

---

### 19.2 Authentication Module

Endpoints:
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/verify-email
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

---

### 19.3 Artist Profile Module

Endpoints:
```
POST   /api/v1/artists                       # Create profile (ARTIST)
GET    /api/v1/artists                       # Browse all (public)
GET    /api/v1/artists/{id}                  # Get profile (public)
PUT    /api/v1/artists/{id}                  # Update profile (ARTIST)
POST   /api/v1/artists/{id}/images           # Upload gallery (ARTIST)
DELETE /api/v1/artists/{id}/images/{imgId}   # Delete image (ARTIST)
GET    /api/v1/artists/{id}/availability     # Get availability (public)
PUT    /api/v1/artists/{id}/availability     # Update availability (ARTIST)
GET    /api/v1/artists/me/bookings           # Incoming bookings (ARTIST)
```

---

### 19.4 Booking Module - Status Flow

```
PENDING     <- Client submits request
    |
    +-- Artist Accepts --> CONFIRMED
    |                          |
    +-- Artist Rejects --> REJECTED
                               |
                          CONFIRMED -- Client confirms -> COMPLETED
                               |
                          CONFIRMED -- Either cancels -> CANCELLED
```

---

### 19.5 Payment Flow

```
Client -> POST /payments/create-order
    |
FastAPI -> Create Razorpay order -> Return order_id + key to client
    |
Client -> Pays via Razorpay (card/UPI/net banking)
    |
Razorpay -> POST /payments/webhook (payment.captured)
    |
FastAPI -> Verify Razorpay signature
    |
Update payment status = CAPTURED, booking status = CONFIRMED
    |
Trigger confirmation email (Celery task)
    |
[Funds held in escrow]
    |
Client -> POST /bookings/{id}/complete (after event)
    |
FastAPI -> Transfer funds to artist Razorpay account
    |
Create payout record, deduct platform commission (10%)
```

---

### 19.6 Admin Module Responsibilities

- View all users (filter by role, status, date)
- Activate/deactivate user accounts
- View all bookings (any status)
- Resolve disputes (override booking status)
- View platform revenue and commission analytics
- Manage payouts (approve, reject)
- Content moderation (reviews, profiles)
- Support ticket management

---

### 19.7 Review Module Rules

- Client can leave review for artist ONLY after booking is COMPLETED
- One review per booking per reviewer
- Reviews only allowed within 14 days of event completion
- Minimum 1 star, maximum 5 stars
- Comment: minimum 10 characters, maximum 500
- Admin can hide/remove policy-violating reviews

---

### 19.8 Future Modules - Extension Pattern

```
How to add a new provider type (e.g., DJ):

1. Add "dj" to user.role enum (or provider_type table)
2. Create new feature folder: backend/app/features/dj/
   - models.py (DJProfile model)
   - schemas.py (DJCreate, DJUpdate, DJResponse)
   - crud.py (DJProfileCRUD)
   - service.py (DJProfileService)
   - router.py (/api/v1/djs endpoints)
3. Create frontend folder: frontend/components/dj/
4. Create frontend pages: frontend/app/artist/dj/ or separate route
5. NO existing module code is modified
6. Core booking flow is REUSED - only DJ-specific fields differ
```

Future modules and their additions:
| Module | Provider Type | Core Additions |
|--------|--------------|---------------|
| DJ | dj | Equipment list, genre, mixing style |
| Photographer | photographer | Portfolio gallery, package types, camera gear |
| Videographer | videographer | Demo reel (video), package types |
| Dancer | dancer | Dance style, group size, costume |
| Anchor | anchor | Language, event specialization |
| Event Planner | event_planner | Bundle booking, vendor coordination |
| Equipment Rental | equipment_rental | Item catalog, inventory, rental pricing |

---

## 20. Future Scalability

### 20.1 Microservice Migration Plan

| Service | Extract When | Own Database | Technology |
|---------|-------------|-------------|-----------|
| Auth Service | > 100k users | Separate PostgreSQL | FastAPI |
| Booking Service | > 10k bookings/day | Separate PostgreSQL | FastAPI |
| Payment Service | PCI compliance needed | Separate PostgreSQL | FastAPI |
| Notification Service | > 100k notifications/day | Redis + PostgreSQL | FastAPI + Celery |
| Search Service | Full-text search at scale | Elasticsearch | FastAPI |
| Media Service | > 1TB of files | S3 + CloudFront | FastAPI |

---

### 20.2 Redis Strategy

| Use Case | Redis Structure | TTL |
|----------|----------------|-----|
| API response cache | String (JSON) | 5 min |
| User session cache | Hash | 60 min |
| Rate limit counter | Counter | 1 min |
| Celery task queue | List | - |
| Real-time notifications | Pub/Sub | - |
| Refresh token blacklist | Set | Token TTL |

---

### 20.3 Message Queue Evolution

| Stage | Technology | When |
|-------|-----------|------|
| Now | Celery + Redis | Simple async tasks |
| Scale | Celery + RabbitMQ | Multiple worker types, dead letter queues |
| High Scale | Apache Kafka | Event sourcing, 100k+ events/day |

Kafka Topics (Future):
```
booking.created
booking.confirmed
booking.cancelled
payment.captured
payment.refunded
notification.send
artist.review.created
```

---

### 20.4 Elasticsearch (Search at Scale)

When search volume exceeds PostgreSQL capabilities:
- Artist search: name, bio, genres, location, tags
- Venue search: name, location, amenities, capacity
- Sync strategy: Write to PostgreSQL, sync to Elasticsearch via Celery task
- Faceted search: Genre, city, price range, availability, rating

---

### 20.5 AI Recommendation Engine (Future)

```
Phase 1: Rule-based recommendations
  - Similar genre artists
  - Same city artists
  - Popular in your price range

Phase 2: Collaborative filtering
  - "Clients who booked this also booked..."
  - Based on booking history matrix

Phase 3: ML recommendations
  - LightGBM or Neural Collaborative Filtering
  - Real-time personalization
  - Input: user history, location, budget, event type
```

---

### 20.6 Video Processing (Future)

For videographer module and artist demo reels:
1. Video upload -> S3 raw storage
2. Celery task triggers -> AWS MediaConvert / FFmpeg
3. Transcoding: Original -> 480p, 720p, 1080p HLS
4. Thumbnail extraction at 5-second intervals
5. Video CDN via CloudFront with HLS streaming

---

### 20.7 Internationalization (i18n)

When expanding beyond India:
- Use next-intl for Next.js i18n
- Currency: Support INR, USD, SGD, AED
- Languages: English, Hindi, Tamil, Kannada (Phase 1)
- Date formats: Locale-aware with date-fns
- Subdomain strategy: in.bandconnect.com, sg.bandconnect.com

---

### 20.8 Multi-Tenant Support

When white-labeling to enterprise clients:
- Tenant identified by subdomain or domain
- Row-level tenant isolation in PostgreSQL
- Separate Razorpay accounts per tenant
- Custom branding (logo, colors, domain)
- Tenant admin dashboard

---

## 21. Architecture Decision Records (ADR)

### ADR-001: Modular Monolith over Microservices

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: Build as a modular monolith with clear internal boundaries.
**Reasoning**: Small team, shipping velocity matters, internal module boundaries allow future
  extraction, single deployment unit easier to debug.
**Consequences**: Single deployment unit; easier debugging; potential bottleneck at scale.
**Revisit At**: 10,000 daily active users or when team exceeds 8 engineers.

---

### ADR-002: PostgreSQL as Primary Database

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: Use PostgreSQL 16 as the sole relational database.
**Reasoning**: ACID compliance, JSONB for flexible data, full-text search, row-level security,
  mature ecosystem, Alembic migration support.
**Consequences**: No multi-database complexity; JSONB handles semi-structured data.

---

### ADR-003: JWT Authentication (not Sessions)

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: Stateless JWT access tokens + Redis-stored refresh tokens.
**Reasoning**: Stateless access tokens scale horizontally without shared session store; refresh
  tokens in Redis allow revocation; no vendor lock-in.
**Consequences**: Access tokens cannot be revoked immediately (mitigated by 60-min TTL).

---

### ADR-004: UUID Primary Keys

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: All primary keys are UUID v4, generated by the application.
**Reasoning**: No sequential ID guessing, globally unique, safe for future microservices.
**Consequences**: Slightly larger storage than integers; minor index performance trade-off.

---

### ADR-005: Soft Delete Pattern

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: Deleted records marked with deleted_at timestamp, never physically deleted.
**Reasoning**: Audit trail, accident recovery, GDPR handled by scheduled purge job.
**Consequences**: All queries must include WHERE deleted_at IS NULL; additional index required.

---

### ADR-006: Razorpay for Payments

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: Use Razorpay as the sole payment gateway.
**Reasoning**: India-first platform; supports UPI, cards, net banking; excellent API;
  marketplace/escrow route via Razorpay X.
**Consequences**: Tied to Razorpay availability; need Stripe for non-India expansion.

---

### ADR-007: Tailwind CSS v4 for Styling

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: Tailwind CSS v4 as the sole styling system.
**Reasoning**: Utility-first prevents CSS specificity wars; excellent dark mode; design tokens;
  tree-shakeable; consistent with proven MUKIJO project patterns.
**Consequences**: Long class strings (mitigated by component abstraction).

---

### ADR-008: React Hook Form + Zod for Forms

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: All forms use React Hook Form with Zod resolver.
**Reasoning**: Uncontrolled inputs minimize re-renders; Zod provides runtime validation and
  TypeScript type inference from the same schema.
**Consequences**: Cannot use native browser form submission.

---

### ADR-009: Feature-Based Folder Structure

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: Backend code organized by feature, not by layer.
**Reasoning**: Keeps all domain code together; easier navigation; supports future microservice
  extraction as each feature is a self-contained unit.
**Consequences**: Some base class duplication; requires discipline to not share DB queries.

---

### ADR-010: Celery for Async Tasks

**Date**: 2026-07-08
**Status**: Accepted
**Decision**: Celery + Redis broker for all asynchronous tasks.
**Reasoning**: FastAPI background tasks are not persistent (lost on restart); Celery provides
  durability, retry logic, monitoring (Flower), and scheduled tasks.
**Consequences**: Additional infrastructure component; separate worker process deployment.

---

## 22. Engineering Principles

### 22.1 Philosophy

BandConnect is built on the principle that great software is MAINTAINABLE software.

The best code is code that:
- A new developer can understand in under 30 minutes
- Can be safely changed without breaking unrelated features
- Fails loudly and clearly rather than silently
- Is boring - predictable, consistent, and conventional

We deliberately choose PROVEN, BORING technologies over novel ones.
We choose CLARITY over CLEVERNESS.
We choose EXPLICIT over IMPLICIT.

---

### 22.2 Maintainability

| Principle | Implementation |
|-----------|---------------|
| One responsibility per file | No 1000-line god-files |
| Consistent patterns | New developers can predict where code lives |
| Self-documenting code | Variable names explain intent |
| Documentation | MASTER.md is always up-to-date |
| ADRs | Every major decision documented with rationale |
| No magic | No hidden frameworks, no undocumented side effects |

**The 3am Rule**: If a production bug occurs at 3am, can any engineer on the team understand
and fix the relevant module in 15 minutes? If not, the code is not maintainable enough.

---

### 22.3 Scalability

| Dimension | Strategy |
|-----------|---------|
| Vertical | Optimize code performance first (index, cache, async) |
| Horizontal | Stateless FastAPI instances behind a load balancer |
| Database | Read replicas, connection pooling, query optimization |
| Storage | S3 from day 1 - no filesystem attachment to servers |
| Background jobs | Celery workers scaled independently |
| Architecture | Modular monolith -> extractable services when needed |

---

### 22.4 Readability

```
Code is read 10x more than it is written.

Rules:
1. Function names are verbs describing what they do.
2. Variable names are nouns describing what they hold.
3. No abbreviations unless universally known (id, url, api, db).
4. No single-letter variable names except loop counters (i, j, k).
5. Complex logic has a comment explaining WHY.
6. File names match the primary export exactly.
7. No clever one-liners that sacrifice clarity.
```

---

### 22.5 Performance Priority Order

1. ALGORITHMIC: Choose the right algorithm and data structure
2. DATABASE: Index correctly, avoid N+1, use read replicas
3. CACHING: Cache expensive reads at the right granularity
4. ASYNC: Use background tasks for non-critical operations
5. FRONTEND: Lazy load, code-split, optimize images
6. INFRASTRUCTURE: Scale horizontally when the above is exhausted

> "Premature optimization is the root of all evil." - Knuth
> Profile first. Optimize only what the data shows is slow.

---

### 22.6 Developer Experience

| Investment | Benefit |
|-----------|---------|
| Docker Compose | One command to start the full stack locally |
| Hot reload | Both frontend and backend reload on save |
| Swagger UI | Explore and test APIs without Postman setup |
| Alembic migrations | Database changes are version-controlled |
| MASTER.md | New developers onboard in under 1 day |
| ESLint + type-check | Catch bugs before they reach review |
| GitHub Actions | Automated tests on every PR |
| Consistent patterns | No "how do they do X here?" surprises |

---

### 22.7 The Golden Rules

```
+-------------------------------------------------------------+
|                  BANDCONNECT GOLDEN RULES                   |
+-------------------------------------------------------------+
|  1. Read MASTER.md before writing any code.                 |
|  2. One module at a time. One file at a time.               |
|  3. Never regenerate what already works.                    |
|  4. Never skip validation - every input must be validated.  |
|  5. Never use `any` in TypeScript.                          |
|  6. Never hardcode values - use environment variables.      |
|  7. Never write business logic in a Router.                 |
|  8. Never query the database from a Service directly.       |
|  9. Always handle loading, error, and empty states.         |
| 10. Always use UUIDs. Always soft delete. Always audit.     |
| 11. Security is not optional - auth on every protected route|
| 12. Performance is not optional - paginate every list.      |
| 13. Tests are not optional - test what you write.           |
| 14. Documentation is not optional - update MASTER.md.       |
| 15. The user experience is the product - make it beautiful. |
+-------------------------------------------------------------+
```

---

## Appendix A: Environment Variables Reference

### Frontend (.env.local)

| Variable | Example | Description |
|----------|---------|-------------|
| NEXT_PUBLIC_API_URL | http://localhost:8000 | Backend API base URL |
| NEXT_PUBLIC_RAZORPAY_KEY_ID | rzp_test_... | Razorpay public key |
| NEXT_PUBLIC_APP_URL | http://localhost:3000 | Frontend base URL |
| NEXT_PUBLIC_APP_NAME | BandConnect | App name |

### Backend (.env)

| Variable | Example | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql://user:pass@localhost:5432/bandconnect | PostgreSQL connection |
| SECRET_KEY | your-256-bit-secret | JWT signing key (min 32 chars) |
| ALGORITHM | HS256 | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | 60 | Access token lifetime |
| REFRESH_TOKEN_EXPIRE_DAYS | 7 | Refresh token lifetime |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| RAZORPAY_KEY_ID | rzp_live_... | Razorpay API key |
| RAZORPAY_KEY_SECRET | ... | Razorpay API secret |
| AWS_ACCESS_KEY_ID | ... | AWS credentials |
| AWS_SECRET_ACCESS_KEY | ... | AWS credentials |
| AWS_BUCKET_NAME | bandconnect-uploads | S3 bucket |
| AWS_REGION | ap-south-1 | AWS region |
| SMTP_HOST | smtp.sendgrid.net | Email SMTP host |
| SMTP_PORT | 587 | Email SMTP port |
| FROM_EMAIL | noreply@bandconnect.in | Sender email |
| ENVIRONMENT | development | App environment |
| ALLOWED_ORIGINS | ["http://localhost:3000"] | CORS origins |

---

## Appendix B: API Endpoints Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/auth/register | - | Register user |
| POST | /api/v1/auth/login | - | Login |
| POST | /api/v1/auth/refresh | - | Refresh access token |
| POST | /api/v1/auth/logout | JWT | Logout |
| GET | /api/v1/artists | - | Browse artists (public) |
| GET | /api/v1/artists/{id} | - | Artist profile (public) |
| POST | /api/v1/artists | ARTIST | Create artist profile |
| PUT | /api/v1/artists/{id} | ARTIST | Update profile |
| POST | /api/v1/artists/{id}/images | ARTIST | Upload gallery |
| GET | /api/v1/venues | - | Browse venues (public) |
| GET | /api/v1/venues/{id} | - | Venue detail (public) |
| POST | /api/v1/venues | VENUE_OWNER | Create venue |
| PUT | /api/v1/venues/{id} | VENUE_OWNER | Update venue |
| DELETE | /api/v1/venues/{id} | VENUE_OWNER | Delete venue |
| POST | /api/v1/bookings | CLIENT | Create booking |
| GET | /api/v1/bookings | JWT | List bookings |
| GET | /api/v1/bookings/{id} | JWT | Get booking |
| PATCH | /api/v1/bookings/{id}/accept | ARTIST | Accept booking |
| PATCH | /api/v1/bookings/{id}/reject | ARTIST | Reject booking |
| PATCH | /api/v1/bookings/{id}/complete | CLIENT | Mark complete |
| PATCH | /api/v1/bookings/{id}/cancel | JWT | Cancel booking |
| POST | /api/v1/payments/create-order | CLIENT | Create Razorpay order |
| POST | /api/v1/payments/webhook | - (signature verified) | Razorpay webhook |
| POST | /api/v1/reviews | CLIENT | Create review |
| GET | /api/v1/reviews/artist/{id} | - | Artist reviews |
| GET | /api/v1/notifications | JWT | My notifications |
| PATCH | /api/v1/notifications/{id}/read | JWT | Mark read |
| GET | /api/v1/admin/users | ADMIN | List all users |
| PATCH | /api/v1/admin/users/{id}/deactivate | ADMIN | Deactivate user |
| GET | /api/v1/admin/bookings | ADMIN | All bookings |
| GET | /api/v1/reports/revenue | ADMIN | Revenue report |
| GET | /api/docs | - | Swagger UI |
| GET | /api/redoc | - | ReDoc UI |

---

## Appendix C: Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/bandconnect.git
cd bandconnect

# 2. Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# 3. Start all services with Docker
docker-compose up -d

# 4. Run database migrations
docker-compose exec backend alembic upgrade head

# 5. Seed database with sample data
docker-compose exec backend python3 scripts/seed_db.py

# 6. Create admin user
docker-compose exec backend python3 scripts/create_admin.py

# Access Points:
# Frontend:        http://localhost:3000
# Backend API:     http://localhost:8000
# API Docs:        http://localhost:8000/api/docs
# Celery Monitor:  http://localhost:5555 (Flower)
```

---

## 23. Engineering Philosophy

To ensure code stability, clear maintenance paths, and long-term scalability, all development teams and AI assistants must align on the following core philosophies:

*   **Quality First Development**: Code correctness, strict typing, error states handling, and unit test validations must be prioritized over rapid feature compilation.
*   **Reusable Code over Duplicate Code**: Duplicating logic blocks, CSS styles, hooks, or model definitions is strictly forbidden. Reuse the existing architecture layout and UI systems.
*   **Maintainability over Shortcuts**: Write clean, explicit, self-documenting code. Never implement clever hacks or undocumented side-effects that compromise readability.
*   **Scalability over Premature Optimization**: Focus first on vertical code efficiency (correct database indexes, N+1 query resolutions, clean memory loops) before horizontal infrastructure additions.
*   **Performance over Feature Quantity**: A small set of highly performant, responsive, and verified features is preferred over a large set of slow or buggy features.
*   **Universal Engineering Alignment**: Every AI assistant working on the project must follow the exact same engineering standards, principles, and lifecycle stages.

---

## 24. Module Development Lifecycle (Mandatory)

Every feature module built for BandConnect must progress sequentially through the following quality gate stages:

```
 Planning
    │
    ▼
 Implementation
    │
    ▼
 Code Review
    │
    ▼
 Bug Fix
    │
    ▼
 Refactoring
    │
    ▼
 Performance Optimization
    │
    ▼
 Testing
    │
    ▼
 Module Approved ✅
    │
    ▼
 Next Module
```

### 24.1 Lifecycle Checklists

#### Planning Checklist
- [ ] Understand all functional requirements, dependencies, and business constraints.
- [ ] Inspect existing schemas, database tables, models, and code symbols.
- [ ] Outline complete API endpoint signatures and frontend page structures.
- [ ] Document integration plans and identify reusable assets.

#### Implementation Checklist
- [ ] Implement database models first, generating and applying Alembic migrations.
- [ ] Create Pydantic DTOs and business services.
- [ ] Register stateless FastAPI routers with appropriate claims dependencies.
- [ ] Develop responsive frontend pages and components leveraging UI tokens.

#### Code Review Checklist
- [ ] Ensure strict TypeScript compilation (no usage of `any` types).
- [ ] Verify validation schemas (Zod/Pydantic) cover all incoming payloads.
- [ ] Verify that no code or design assets are duplicated.
- [ ] Inspect error-handling wrappers across all asynchronous blocks.

#### Bug Fix Checklist
- [ ] Target bug resolutions directly without adding unrelated logic or features.
- [ ] Write detailed tests to verify the resolution of compiler/runtime bugs.
- [ ] Re-verify dependencies compile after bug fix changes.

#### Refactoring Checklist
- [ ] Deconstruct long code blocks and large components into separate modules.
- [ ] Remove unused import statements, variables, and dead comments.
- [ ] Simplify nested conditional blocks for clarity.

#### Performance Optimization Checklist
- [ ] Optimize SQL queries to avoid N+1 issues and add indices on query filters.
- [ ] Minimize frontend JS bundle weights via code-splitting and lazy-loading.
- [ ] Ensure that static data reads are cached at appropriate granularities.

#### Testing Checklist
- [ ] Execute python backend routers import check.
- [ ] Run `npx tsc --noEmit` on the frontend codebase.
- [ ] Verify layout responsiveness on mobile, tablet, and desktop viewports.

#### Module Approval Checklist
- [ ] Walkthrough documentation updated.
- [ ] Review by architect or senior engineer complete.
- [ ] Verification reports generated and approved.

---

## 25. Module Status Tracker

The table below tracks the status, review cycles, and approvals for all core BandConnect modules. No module may begin development until all preceding dependency modules are fully Approved.

| Module Name | Module Stage | Status | Review Status | Approval Status |
| :--- | :--- | :--- | :--- | :--- |
| **Foundation** | Core Registry | Completed | Approved | Approved ✅ |
| **Authentication** | Core Registry | Completed | Approved | Approved ✅ |
| **RBAC** | Core Registry | Completed | Approved | Approved ✅ |
| **Admin Portal** | Core Registry | Completed | Approved | Approved ✅ |
| **Band Registration** | Band Portal | Completed | Approved | Approved ✅ |
| **Band Dashboard** | Band Portal | Completed | Approved | Approved ✅ |
| **Band Profile Management** | Band Portal | Completed | Approved | Approved ✅ |
| **Band Availability Calendar** | Band Portal | Completed | Approved | Approved ✅ |
| **Band Gallery & Media** | Band Portal | Completed | Approved | Approved ✅ |
| **Band Pricing** | Band Portal | Completed | Approved | Approved ✅ |
| **Band Booking Requests** | Band Portal | Completed | Approved | Approved ✅ |
| **Band Reviews** | Band Portal | Completed | Approved | Approved ✅ |
| **Band Earnings** | Band Portal | Completed | Approved | Approved ✅ |
| **Band Analytics** | Band Portal | Completed | Approved | Approved ✅ |
| **Venue Registration** | Venue Portal | Completed | Approved | Approved ✅ |
| **Venue Portal** | Venue Portal | Pending | Pending | Pending ⏳ |
| **Marketplace** | Marketplace Portal | Pending | Pending | Pending ⏳ |
| **Client Portal** | Client Portal | Pending | Pending | Pending ⏳ |
| **Booking** | Client Booking | Pending | Pending | Pending ⏳ |
| **Payments** | Transactions | Pending | Pending | Pending ⏳ |
| **Reviews** | Marketplace Feed | Pending | Pending | Pending ⏳ |
| **Notifications** | Alerts System | Pending | Pending | Pending ⏳ |
| **Reports** | Admin Panel | Pending | Pending | Pending ⏳ |
| **Analytics** | Admin Panel | Pending | Pending | Pending ⏳ |
| **Deployment** | Infrastructure | Pending | Pending | Pending ⏳ |

---

## 26. Engineering Rules

All engineers and AI assistants must comply with these non-negotiable rules:

1. **Sequential Lifecycle Progress**: Never start a new module before the current module is fully approved and completed.
2. **Direct Bug Fixing**: Never add new features or modify unrelated code blocks while fixing bugs.
3. **Mandatory Auditing**: Never skip code reviews, lint checks, or compiler tests.
4. **Zero Duplication**: Never duplicate styles, validation schemas, or database tables. Always reuse components, hooks, services, and models.
5. **Constant Documentation**: Always update documentation, walkthrough files, and `MASTER.md` immediately upon completing a module.
6. **Performance Checkpoints**: Always profile and optimize backend SQL statements and frontend bundle sizes before seeking approval.

---

*This document is the single source of truth for BandConnect.*
*Any deviation from these standards requires an ADR and team approval.*
*Last Updated: 2026-07-08 | Version: 1.0.0 | Maintained by: Chief Software Architect*

---

## 27. Permanent Architecture Rules

### 27.1 Authenticated Role Navigation Policy

After successful authentication, BandConnect must resolve the authoritative authenticated user's canonical backend role and navigate to that role's overview dashboard through one centralized role-to-dashboard resolver (`frontend/utils/role-routes.ts` — `getRoleDashboard()`).

- Role routing must not default authenticated users to Client.
- Role routing must not use the first allowed role in `allowedRoles[]` as the user's identity.
- Login redirect and global Dashboard navigation must reuse `getRoleDashboard()`.
- `GuestRoute` must redirect authenticated users to their correct role dashboard, not `/`.

### 27.2 Role Portal Dashboard Policy

A role Dashboard route represents the role's **overview/landing page**, not a feature page.

Feature pages such as Bookings, Earnings, Reviews, Profile, Calendar, Users, Venues, or Reports must **not** replace the role overview dashboard.

Sidebar and breadcrumb navigation must preserve the hierarchy:

```
Role Overview Dashboard
    ↓
Feature Page (My Bookings, Incoming Gigs, My Venues, etc.)
```

### 27.3 Public vs Role Portal Navigation Policy

BandConnect public marketplace navigation and authenticated role portal navigation are separate navigation spaces.

- Public Home / Landing navigation must not be ambiguously represented as portal Home inside role breadcrumbs.
- Role portal breadcrumbs (`BookingDashboardBreadcrumb`) must represent the portal hierarchy only (e.g., Dashboard > My Bookings).
- Navigation back to the public marketplace must use a clear marketplace/public navigation label such as "Back to Marketplace" or existing explicit project convention — not a generic "Home" link pointing to `/`.

### 27.4 Theme Architecture Policy

BandConnect uses one centralized theme provider (`frontend/providers/theme-provider.tsx`).

- Theme state is managed through `ThemeProvider` and exposed via `useTheme()`.
- Theme is applied by setting `data-theme` on `document.documentElement`.
- CSS variables respond to `[data-theme="light"]` and `[data-theme="dark"]` (default is dark).
- Theme state must not be duplicated across independent providers or local component theme systems.
- Shared theme toggles must use `useTheme()` from the centralized provider.

### 27.5 Secret Management Policy

- Production `SECRET_KEY` values must be externally configured and must never be committed to source control.
- Local development may use the clearly identified development-only fallback (`bandconnect-local-development-secret-not-for-production`) when `ENVIRONMENT=development` and `SECRET_KEY` is empty. Real JWT authentication still works with this key.
- The development fallback must never be accepted in production.
- Production must fail fast (via `effective_secret_key` property in `config.py`) when `SECRET_KEY` is missing, empty, or equal to the known development fallback.
- A `backend/.env.example` file must document all required environment variables with safe placeholder values only.

### 27.6 Onboarding Layout Policy

- Complex Artist and Venue onboarding workflows must use the approved responsive onboarding workspace and must not be constrained by narrow authentication-card layouts.
- Multi-step progress components must remain within their content boundary on desktop and adapt to a compact progress representation on smaller screens.
- Related short fields may use responsive multi-column grids. Complex fields, media, calendars, and review sections must receive appropriate full-width layouts.
- All onboarding steps must be verified in both Light and Dark themes at supported desktop, tablet, and mobile viewport sizes.