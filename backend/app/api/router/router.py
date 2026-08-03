from fastapi import APIRouter

from app.api.mokijo.auth.router import router as auth_router
from app.api.mokijo.groups.router import router as groups_router
from app.api.mokijo.courses.router import router as courses_router
from app.api.mokijo.payments.router import router as payments_router
from app.api.mokijo.events.router import router as events_router
from app.api.mokijo.fundraising.router import router as fundraising_router
from app.api.mokijo.onboarding.router import router as onboarding_router
from app.api.mokijo.venues.router import router as venues_router
from app.api.mokijo.activities.router import router as activities_router
from app.api.mokijo.dashboard.router import router as dashboard_router
from app.api.mokijo.messages.router import router as messages_router
from app.api.mokijo.venue_owner.router import router as venue_owner_router
from app.api.mokijo.games.router import router as games_router
from app.api.mokijo.matches.router import router as matches_router
from app.api.mokijo.venue_verification.router import router as venue_verification_router
from app.api.mokijo.trainer.router import router as trainer_router
from app.api.shared.superadmin.superadmin import router as superadmin_router

# Band module routers (ORM-based, native FastAPI APIRouter)
from app.api.band.auth.router import router as band_auth_router
from app.api.band.categories.router import router as band_categories_router
from app.api.band.locations.router import router as band_locations_router
from app.api.band.artists.router import router as band_artists_router
from app.api.band.venues.router import router as band_venues_router
from app.api.band.bookings.router import router as band_bookings_router
from app.api.band.reviews.router import router as band_reviews_router
from app.api.band.earnings.router import router as band_earnings_router
from app.api.band.settings.router import router as band_settings_router
from app.api.band.notifications.router import router as band_notifications_router
from app.api.band.payments.router import router as band_payments_router

api_router = APIRouter()

# Register sub-routers
api_router.include_router(auth_router)
api_router.include_router(groups_router)
api_router.include_router(courses_router)
api_router.include_router(payments_router)
api_router.include_router(events_router)
api_router.include_router(fundraising_router)
api_router.include_router(onboarding_router)
api_router.include_router(venues_router)
api_router.include_router(activities_router)
api_router.include_router(dashboard_router)
api_router.include_router(messages_router)
api_router.include_router(venue_owner_router)
api_router.include_router(games_router)
api_router.include_router(matches_router)
api_router.include_router(venue_verification_router)
api_router.include_router(trainer_router)
api_router.include_router(superadmin_router)

# Band module routers
api_router.include_router(band_auth_router)
api_router.include_router(band_categories_router)
api_router.include_router(band_locations_router)
api_router.include_router(band_artists_router)
api_router.include_router(band_venues_router)
api_router.include_router(band_bookings_router)
api_router.include_router(band_reviews_router)
api_router.include_router(band_earnings_router)
api_router.include_router(band_settings_router)
api_router.include_router(band_notifications_router, prefix="/band/notifications", tags=["Band Notifications"])
api_router.include_router(band_payments_router, prefix="/band/payments", tags=["Band Payments"])
