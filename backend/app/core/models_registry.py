"""
Centralized model registry — imports every SQLAlchemy model module so that
Base.metadata is fully populated before Alembic autogenerate or create_all() runs.

WARNING: Do NOT remove imports even if they appear unused. Each import triggers
SQLAlchemy model registration on Base.metadata.
"""

# ── Auth & RBAC ──────────────────────────────────────────────────────────────
from app.features.auth.models import (  # noqa: F401
    User,
    Role,
    Permission,
    PermissionGroup,
    RefreshToken,
    user_roles,
    role_permissions,
)

# ── Artist Profiles ──────────────────────────────────────────────────────────
from app.features.artists.models import (  # noqa: F401
    ArtistProfile,
    artist_genres,
    artist_languages,
)

# ── Venues ───────────────────────────────────────────────────────────────────
from app.features.venues.models import (  # noqa: F401
    Venue,
    venue_categories,
)

# ── Bookings & Messaging ──────────────────────────────────────────────────────
from app.features.bookings.models import Booking, BookingAuditLog  # noqa: F401
from app.features.reviews.models import Review  # noqa: F401
from app.features.earnings.models import Transaction  # noqa: F401
from app.features.notifications.models import Notification  # noqa: F401
from app.features.notifications.preferences.models import NotificationPreference  # noqa: F401
from app.features.messaging.conversation.models import Conversation  # noqa: F401
from app.features.messaging.message.models import Message  # noqa: F401



# ── Categories / Taxonomy ────────────────────────────────────────────────────
from app.features.categories.models import Category  # noqa: F401

# ── Locations ────────────────────────────────────────────────────────────────
from app.features.locations.models import (  # noqa: F401
    Country,
    State,
    City,
    Area,
)

# ── Settings & Audit ────────────────────────────────────────────────────────
from app.features.settings.models import (  # noqa: F401
    SystemSetting,
    AuditLog,
)
