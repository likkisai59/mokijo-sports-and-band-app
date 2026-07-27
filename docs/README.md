# BandConnect — Music Band Booking Platform

> The Airbnb for live entertainment.

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/your-org/bandconnect.git
cd bandconnect

# 2. Copy env files
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# 3. Start all services
docker-compose up -d

# 4. Run migrations
docker-compose exec backend alembic upgrade head

# 5. Seed sample data
docker-compose exec backend python3 scripts/seed_db.py

# 6. Create admin user
docker-compose exec backend python3 scripts/create_admin.py
```

| Service       | URL                        |
|---------------|----------------------------|
| Frontend      | http://localhost:3000      |
| Backend API   | http://localhost:8000      |
| API Docs      | http://localhost:8000/api/docs |
| Celery Monitor| http://localhost:5555      |

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 15, TypeScript, Tailwind v4 |
| Backend    | FastAPI, SQLAlchemy 2, Pydantic v2  |
| Database   | PostgreSQL 16                       |
| Cache      | Redis 7                             |
| Auth       | JWT Bearer (PyJWT)                  |
| Payments   | Razorpay                            |
| Storage    | AWS S3 (local uploads in dev)       |

## Documentation

Read **MASTER.md** — the single source of truth for this project.

Every engineering decision, architectural choice, folder structure, coding standard,
and workflow is documented there.

## Roles

| Role        | Access                           |
|-------------|----------------------------------|
| Client      | Browse, book, pay, review        |
| Artist/Band | Profile, accept bookings, payout |
| Venue Owner | List venues, manage bookings     |
| Admin       | Full platform management         |

## License

MIT © 2026 BandConnect
