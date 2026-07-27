"""
V1 API router registry assembly.
Includes and prefixes all modular routes.
"""

from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.features.auth.router import router as auth_router
from app.features.categories.router import router as categories_router
from app.features.locations.router import router as locations_router
from app.features.artists.router import router as artists_router
from app.features.artists.public_router import router as public_artists_router
from app.features.venues.router import router as venues_router
from app.features.venues.public_router import router as public_venues_router
from app.features.settings.router import router as settings_router
from app.features.bookings.router import router as bookings_router
from app.features.bookings.admin_router import router as admin_bookings_router
from app.features.reviews.router import router as reviews_router
from app.features.earnings.router import router as earnings_router
from app.features.notifications.router import router as notifications_router
from app.features.notifications.websocket_router import router as websocket_router
from app.features.payment.router import router as payment_router
from app.features.messaging.conversation.router import router as conversation_router

router = APIRouter()

# Register core health router
router.include_router(health_router, prefix="/system", tags=["System"])

# Register authentication feature router
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# Register public artists router
router.include_router(public_artists_router, prefix="/artists", tags=["Artists"])

# Register public venues router
router.include_router(public_venues_router, prefix="/venues", tags=["Venues"])

# Register categories feature router
router.include_router(categories_router, prefix="/categories", tags=["Categories"])

# Register locations feature router
router.include_router(locations_router, prefix="/locations", tags=["Locations"])

# Register bookings feature router
router.include_router(bookings_router, prefix="/bookings", tags=["Bookings"])

# Register reviews feature router
router.include_router(reviews_router, prefix="/reviews", tags=["Reviews"])

# Register earnings feature router
router.include_router(earnings_router, prefix="/earnings", tags=["Earnings"])

# Register notifications feature router
router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])

# Register notifications websocket router
router.include_router(websocket_router, prefix="/ws")

# Register payments feature router
router.include_router(payment_router, prefix="/payments", tags=["Payments"])

# Register messaging conversation feature router
router.include_router(conversation_router, prefix="/conversations", tags=["Conversations"])

# Register admin artists feature router
router.include_router(artists_router, prefix="/admin/artists", tags=["Admin Artists"])

# Register admin venues feature router
router.include_router(venues_router, prefix="/admin/venues", tags=["Admin Venues"])

# Register admin settings feature router
router.include_router(settings_router, prefix="/admin/settings", tags=["Admin Settings"])

# Register admin bookings feature router
router.include_router(admin_bookings_router, prefix="/admin/bookings", tags=["Admin Bookings"])
