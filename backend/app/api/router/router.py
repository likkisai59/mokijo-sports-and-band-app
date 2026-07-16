from fastapi import APIRouter

from app.api.auth.auth import AuthRouting
from app.api.groups.groups import GroupsRouting
from app.api.courses.courses import CoursesRouting
from app.api.payments.payments import PaymentsRouting
from app.api.events.events import EventsRouting
from app.api.fundraising.fundraising import FundraisingRouting
from app.api.onboarding.onboarding import OnboardingRouting
from app.api.venues.venues import VenuesRouting
from app.api.activities.activities import ActivitiesRouting
from app.api.dashboard.dashboard import DashboardRouting
from app.api.messages.messages import MessagesRouting
from app.api.venue_owner.venue_owner import VenueOwnerRouting
from app.api.games.games import GamesRouting
from app.api.matches.matches import MatchesRouting
from app.api.venue_verification.venue_verification import VenueVerificationRouting

api_router = APIRouter()

# Instantiate class-based routing services
auth = AuthRouting()
groups = GroupsRouting()
courses = CoursesRouting()
payments = PaymentsRouting()
events = EventsRouting()
fundraising = FundraisingRouting()
onboarding = OnboardingRouting()
venues = VenuesRouting()
activities = ActivitiesRouting()
dashboard = DashboardRouting()
messages = MessagesRouting()
venue_owner = VenueOwnerRouting()
games = GamesRouting()
matches = MatchesRouting()
venue_verification = VenueVerificationRouting()

# Register sub-routers
api_router.include_router(auth.router)
api_router.include_router(groups.router)
api_router.include_router(courses.router)
api_router.include_router(payments.router)
api_router.include_router(events.router)
api_router.include_router(fundraising.router)
api_router.include_router(onboarding.router)
api_router.include_router(venues.router)
api_router.include_router(activities.router)
api_router.include_router(dashboard.router)
api_router.include_router(messages.router)
api_router.include_router(venue_owner.router)
api_router.include_router(games.router)
api_router.include_router(matches.router)
api_router.include_router(venue_verification.router)
