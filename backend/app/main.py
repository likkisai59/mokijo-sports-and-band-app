from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.models import models
from app.api import api_router
from app.core.config import FRONTEND_URL
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.hold_expiry import HoldExpiryService

# Create database tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mukijo Club Management API")

@app.on_event("startup")
def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(HoldExpiryService.active_cleanup_job, "interval", seconds=60)
    scheduler.start()
    print("[INFO] Background hold expiry scheduler started successfully.")


# Configure CORS Middleware
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if FRONTEND_URL and FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the aggregated routers
app.include_router(api_router)
