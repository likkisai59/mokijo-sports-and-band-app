from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

from app.core.database import engine
from app.models import models
from app.api import api_router
from app.core.config import get_settings
from app.services.hold_expiry import HoldExpiryService
from app.logger import logger, LoggingMiddleware
from app.core.exceptions import (
    SessionNotFoundError,
    ResourceNotFoundError,
    ResourceConflictError,
    InvalidValueError,
)

settings = get_settings()

# Create database tables on startup
models.Base.metadata.create_all(bind=engine)

# Background scheduler instance
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.log_message_sync(message="Starting up Mukijo Club Management API...")
    
    try:
        scheduler.add_job(HoldExpiryService.active_cleanup_job, "interval", seconds=60)
        scheduler.start()
        logger.log_message_sync(message="Background hold expiry scheduler started successfully.")
    except Exception as e:
        logger.log_error_sync(message=f"Failed to start background scheduler: {e}")
        
    yield
    
    # Shutdown tasks
    logger.log_message_sync(message="Shutting down Mukijo Club Management API...")
    try:
        scheduler.shutdown()
        logger.log_message_sync(message="Background scheduler shut down successfully.")
    except Exception as e:
        logger.log_error_sync(message=f"Failed to shut down background scheduler: {e}")


app = FastAPI(
    title=settings.SERVICE_NAME,
    description="Mukijo Club Management Backend API",
    version=settings.SERVICE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS Middleware
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom logging middleware
app.add_middleware(LoggingMiddleware)

# Register the aggregated routers
app.include_router(api_router)

# Serve Band module uploads (local storage) if the directory exists
import os as _os
from fastapi.staticfiles import StaticFiles as _StaticFiles
_BAND_UPLOAD_DIR = _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))), "uploads", "band")
_os.makedirs(_BAND_UPLOAD_DIR, exist_ok=True)
app.mount("/band/uploads", _StaticFiles(directory=_BAND_UPLOAD_DIR), name="band-uploads")

# ── Exception Handlers ────────────────────────────────────────────────────────

@app.exception_handler(SessionNotFoundError)
async def session_not_found_handler(request, exc: SessionNotFoundError):
    await logger.log_warning(request, message=exc.message, step="SESSION_NOT_FOUND")
    return JSONResponse(
        status_code=404,
        content={"detail": exc.message, "error_type": "SessionNotFoundError"}
    )

@app.exception_handler(ResourceNotFoundError)
async def resource_not_found_handler(request, exc: ResourceNotFoundError):
    await logger.log_warning(request, message=exc.detail, step="RESOURCE_NOT_FOUND")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.detail, "error_type": "ResourceNotFoundError"}
    )

@app.exception_handler(ResourceConflictError)
async def resource_conflict_handler(request, exc: ResourceConflictError):
    await logger.log_warning(request, message=exc.detail, step="RESOURCE_CONFLICT")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.detail, "error_type": "ResourceConflictError"}
    )

@app.exception_handler(InvalidValueError)
async def invalid_value_handler(request, exc: InvalidValueError):
    await logger.log_warning(request, message=exc.detail, step="VALIDATION_ERROR")
    return JSONResponse(
        status_code=400,
        content={"detail": exc.detail, "error_type": "ValidationError"}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    await logger.log_error(request, message=f"Unhandled exception: {exc}", step="INTERNAL_SERVER_ERROR", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error.", "error_type": "InternalServerError"}
    )

# ── Root redirect to docs ─────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")
