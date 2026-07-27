from datetime import date, time
from types import SimpleNamespace
from uuid import uuid4

from app.features.bookings.service import booking_service


def test_validate_booking_request_rejects_past_event_date():
    payload = SimpleNamespace(
        artist_profile_id=None,
        venue_id=None,
        event_title="Summer Fest",
        event_type="Wedding",
        event_date="2020-01-01",
        start_time="18:00",
        end_time="22:00",
        guest_count=80,
        proposed_price=15000,
        location="Taj West End",
        address="Main Road",
        city="Bengaluru",
        state="Karnataka",
        country="India",
        google_maps_coords=None,
        special_requests=None,
        notes=None,
    )

    result = booking_service.validate_booking_request(None, payload)

    assert result["is_valid"] is False
    assert any("past" in error.lower() for error in result["errors"])


def test_update_booking_request_supports_reschedule_and_notes():
    payload = SimpleNamespace(
        artist_profile_id=None,
        venue_id=None,
        event_title="Summer Fest",
        event_type="Wedding",
        event_date="2099-01-01",
        start_time="18:00",
        end_time="22:00",
        guest_count=80,
        proposed_price=15000,
        location="Taj West End",
        address="Main Road",
        city="Bengaluru",
        state="Karnataka",
        country="India",
        google_maps_coords=None,
        special_requests="Need stage setup",
        notes="Rescheduled for final review",
    )

    booking = SimpleNamespace(
        id=uuid4(),
        status="pending",
        event_title="Summer Fest",
        event_date="2099-01-01",
        start_time="18:00",
        end_time="22:00",
        location="Taj West End",
        notes=None,
        special_requests=None,
        proposed_price=15000,
        counter_price=None,
        duration=4.0,
        guest_count=80,
        budget=15000,
        address="Main Road",
        city="Bengaluru",
        state="Karnataka",
        country="India",
        google_maps_coords=None,
    )

    updated = booking_service.prepare_booking_update(payload, booking, "client")

    assert updated["event_title"] == "Summer Fest"
    assert updated["event_date"] == date(2099, 1, 1)
    assert updated["start_time"] == time(18, 0)
    assert updated["end_time"] == time(22, 0)
    assert updated["notes"] == "Rescheduled for final review"
    assert updated["special_requests"] == "Need stage setup"
