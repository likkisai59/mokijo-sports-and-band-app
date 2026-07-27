"""
BandConnect API — FastAPI Application Factory

Architecture: Modular Monolith with feature-based vertical slices.
Layer order: Router -> Service -> CRUD -> Database

Read MASTER.md before modifying this file.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.middleware import LoggingMiddleware, RequestIDMiddleware
from app.core.logging import setup_logging
from app.core.exceptions import register_exception_handlers
from app.api.v1.router import router as api_router

# Initialize structured logging system
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager. Runs setup on startup, teardown on shutdown."""
    import asyncio
    from app.features.notifications.publisher import set_publisher_event_loop
    set_publisher_event_loop(asyncio.get_running_loop())

    from loguru import logger
    logger.info(
        "BandConnect API starting...",
        environment=settings.ENVIRONMENT,
        version="1.0.0",
    )
    yield
    logger.info("BandConnect API shutting down.")


def create_app() -> FastAPI:
    """
    FastAPI application factory.

    Returns a fully configured FastAPI instance with:
    - CORS middleware
    - Request ID middleware
    - Logging middleware
    - Custom global exceptions mapper
    - Standard routing prefix schemas
    - Static file serving for local uploads
    - OpenAPI documentation at /api/docs
    """
    app = FastAPI(
        title=settings.APP_NAME,
        description="Music Band Booking Platform API — The Airbnb for live entertainment.",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware (order matters — applied bottom-up) ────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(LoggingMiddleware)

    # ── Exception Handlers ───────────────────────────────────────────────────
    register_exception_handlers(app)

    # ── Static Files (local dev only — use S3 in production) ─────────────────
    import os
    if settings.ENVIRONMENT == "development" and os.path.exists("uploads"):
        app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    # ── API Version 1 Router ──────────────────────────────────────────────────
    app.include_router(api_router, prefix="/api/v1")

    # ── Standard Root Endpoint ───────────────────────────────────────────────
    @app.get("/", tags=["System"], summary="Root endpoint")
    async def root():
        return JSONResponse(
            content={
                "message": f"Welcome to {settings.APP_NAME} API",
                "docs": "/api/docs",
                "redoc": "/api/redoc",
            }
        )

    return app


# ── Application Instance ───────────────────────────────────────────────────────
app = create_app()
