from types import SimpleNamespace

from app.features.bookings.router import _format_booking


def test_format_booking_includes_legacy_timeline_for_frontend_compatibility():
    booking = SimpleNamespace(
        id="booking-1",
        event_title="Summer Fest",
        event_name="Summer Fest",
        event_type="Wedding",
        event_date="2026-07-20",
        start_time="18:00:00",
        end_time="22:00:00",
        proposed_price=15000,
        counter_price=None,
        status="pending",
        created_at="2026-07-10T10:00:00",
        duration=4.0,
        guest_count=80,
        budget=15000,
        location="Taj",
        address="Main St",
        city="Bengaluru",
        state="Karnataka",
        country="India",
        google_maps_coords=None,
        special_requests=None,
        notes=None,
        client=SimpleNamespace(id="client-1", name="Asha", email="asha@example.com"),
        artist_profile_id=None,
        venue_id=None,
        timeline_events=[
            SimpleNamespace(
                id="timeline-1",
                event_type="request_created",
                status="pending",
                message="Booking request initialized",
                created_by_role="client",
                created_at="2026-07-10T10:00:00",
            )
        ],
        status_history=[],
        booking_notes=[],
        attachments=[],
        updated_at="2026-07-10T10:00:00",
    )

    formatted = _format_booking(booking)

    assert formatted["timeline"]
    assert formatted["timeline"][0]["message"] == "Booking request initialized"
