"""
Application Configuration — Pydantic BaseSettings

All environment variables are read from .env file and validated here.
Never access os.environ directly — always use settings.VARIABLE_NAME.

Usage:
    from app.core.config import settings
    print(settings.DATABASE_URL)
    print(settings.effective_secret_key)   # Always use this for JWT ops
"""

import json
import sys
from functools import lru_cache

from pydantic_settings import BaseSettings

# Development-only fallback key — clearly non-production, well-known value.
# Security properties of this key are intentionally low.
# It MUST NOT be used in staging or production.
_DEV_SECRET_FALLBACK = "bandconnect-local-development-secret-not-for-production"


class Settings(BaseSettings):
    # ── Application ───────────────────────────────────────────────────────────
    APP_NAME: str = "BandConnect"
    APP_URL: str = "http://localhost:3000"
    API_URL: str = "http://localhost:8000"
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str

    # ── Security ──────────────────────────────────────────────────────────────
    # Leave SECRET_KEY blank in local development — a clearly-labelled dev-only
    # fallback will be used automatically (see effective_secret_key below).
    # Production MUST set a cryptographically secure value (min 32 chars).
    # Generate one: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── AWS S3 ────────────────────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_BUCKET_NAME: str | None = None
    AWS_REGION: str = "ap-south-1"

    # ── Razorpay ──────────────────────────────────────────────────────────────
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None

    # ── Email ─────────────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.mailtrap.io"
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASS: str | None = None
    FROM_EMAIL: str = "noreply@bandconnect.in"
    FROM_NAME: str = "BandConnect"

    # ── Storage ───────────────────────────────────────────────────────────────
    USE_S3: bool = False
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: list[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    ]

    # ── Platform Commission ───────────────────────────────────────────────────
    PLATFORM_COMMISSION_PERCENT: float = 10.0

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def database_url_sync(self) -> str:
        """Synchronous database URL for Alembic migrations."""
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

    @property
    def effective_secret_key(self) -> str:
        """
        Returns the JWT signing key to use.

        Development / staging:
            If SECRET_KEY is empty or unset, uses the clearly-labelled dev
            fallback and prints a visible warning. The backend starts normally
            and real JWT authentication (login, token validation, RBAC) works
            with this key — it is just a known, non-secret value suitable only
            for local development.

        Production:
            Refuses to start if SECRET_KEY is:
              - missing or empty
              - the dev fallback value
            Raises ValueError so FastAPI's startup event fails loudly and the
            process exits with a non-zero code before serving any request.
        """
        key = self.SECRET_KEY.strip()

        if self.is_production:
            if not key:
                raise ValueError(
                    "[SECURITY] SECRET_KEY is missing or empty. "
                    "Production backend cannot start without a strong SECRET_KEY. "
                    "Generate one: python -c \"import secrets; print(secrets.token_hex(32))\""
                )
            if key == _DEV_SECRET_FALLBACK:
                raise ValueError(
                    "[SECURITY] SECRET_KEY is set to the dev fallback value. "
                    "Production backend refuses to start with a known-insecure key. "
                    "Generate one: python -c \"import secrets; print(secrets.token_hex(32))\""
                )
            return key

        # Development / staging — use fallback if missing
        if not key:
            print(
                "\n"
                "⚠️  [BandConnect] SECRET_KEY is not set in .env\n"
                "   Using development-only fallback key.\n"
                "   Real JWT authentication still works — only the signing key\n"
                "   is a known dev value. Set SECRET_KEY before deploying.\n",
                file=sys.stderr,
                flush=True,
            )
            return _DEV_SECRET_FALLBACK

        return key

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            # Allow JSON-serialized lists in env vars (e.g. ALLOWED_ORIGINS)
            if field_name in ("ALLOWED_ORIGINS", "ALLOWED_IMAGE_TYPES"):
                try:
                    return json.loads(raw_val)
                except (json.JSONDecodeError, ValueError):
                    return [raw_val]
            return raw_val


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings singleton.
    Use in FastAPI dependency injection: Depends(get_settings).

    Eagerly calls effective_secret_key so the server fails fast on startup
    if production is misconfigured rather than silently serving with an
    insecure key.
    """
    instance = Settings()
    # Trigger validation eagerly — raises in production if key is missing/insecure
    _ = instance.effective_secret_key
    return instance


# Module-level singleton — import and use directly in the codebase
settings = get_settings()
