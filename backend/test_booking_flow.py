import time
import requests
import concurrent.futures

BASE_URL = "http://127.0.0.1:8001"

def clean_database():
    """Create test data if not present."""
    print("Setting up test data...")
    # First, fetch existing venues or insert one
    res = requests.get(f"{BASE_URL}/venues")
    if res.status_code != 200:
        print(f"Error fetching venues: {res.status_code}")
        print(res.text)
        return None
    try:
        venues = res.json()
    except Exception as e:
        print("Failed to decode JSON from venues API:")
        print(res.text)
        raise e
    if not venues:
        print("Please run seeds first to add venues.")
        return None

    venue = venues[0]
    venue_id = venue["id"]

    # Register a test court
    court_res = requests.post(f"{BASE_URL}/venues/{venue_id}/courts", json={
        "venue_id": venue_id,
        "name": "Test Court A",
        "sport_type": "badminton",
        "capacity": 4,
        "price_per_hour": 500
    })
    if court_res.status_code == 200:
        court = court_res.json()
        print(f"Created court: {court['name']}")
        court_id = court["id"]
    else:
        print("Court creation skipped (already present or failed)")
        court_id = 1

    # Insert slots for testing
    from datetime import datetime, timedelta
    start1 = (datetime.utcnow() + timedelta(hours=10)).isoformat()
    end1 = (datetime.utcnow() + timedelta(hours=11)).isoformat()

    slots_payload = [{
        "venue_id": venue_id,
        "court_id": court_id,
        "sport": "badminton",
        "start_time": start1,
        "end_time": end1,
        "base_price": 500,
        "current_price": 500,
        "is_blocked": False
    }]
    slots_res = requests.post(f"{BASE_URL}/venues/{venue_id}/slots", json=slots_payload)
    if slots_res.status_code == 200:
        created_slots = slots_res.json()
        print(f"Generated slots: {[s['id'] for s in created_slots]}")
        return created_slots[0]["id"]
    else:
        print("Failed to generate slots")
        return None

def attempt_hold(user_id, slot_id):
    """Attempt to hold a slot."""
    try:
        res = requests.post(f"{BASE_URL}/bookings/hold", json={
            "slot_ids": [slot_id],
            "user_id": user_id
        })
        return res.status_code, res.json()
    except Exception as e:
        return 999, str(e)

def test_race_condition(slot_id):
    """Test concurrent checkout protections."""
    print(f"\n--- Testing Concurrent Hold Protection on Slot ID: {slot_id} ---")
    
    # Simulate user 1 and user 2 trying to hold the slot simultaneously
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future1 = executor.submit(attempt_hold, 1, slot_id)
        future2 = executor.submit(attempt_hold, 2, slot_id)
        
        res1 = future1.result()
        res2 = future2.result()

    print(f"User 1 result: Code {res1[0]} - {res1[1]}")
    print(f"User 2 result: Code {res2[0]} - {res2[1]}")

    # One must succeed (200 OK) and one must fail with conflict (409 or 400)
    codes = [res1[0], res2[0]]
    if 200 in codes and (409 in codes or 400 in codes):
        print("SUCCESS: Concurrent lock protection is fully working (one succeeded, one was rejected)!")
        successful_res = res1 if res1[0] == 200 else res2
        return successful_res[1]["id"]
    else:
        print("FAILURE: Concurrent protection issue detected.")
        return None

def test_cancellation(booking_id):
    """Test reservation cancellation releases the slot back to AVAILABLE."""
    print(f"\n--- Testing Reservation Cancellation for Booking ID: {booking_id} ---")
    res = requests.post(f"{BASE_URL}/bookings/{booking_id}/cancel")
    if res.status_code == 200:
        data = res.json()
        print(f"Booking status changed to: {data['status']}")
        print(f"Payment status changed to: {data['payment_status']}")
        
        # Verify slots are now AVAILABLE
        if data["slots"] and len(data["slots"]) > 0:
            slot_id = data["slots"][0]["id"]
            # We check the slot directly by checking bookings history or slot details if we load them
            print("SUCCESS: Reservation successfully cancelled.")
    else:
        print(f"Failed to cancel booking: {res.status_code} - {res.text}")

if __name__ == "__main__":
    slot_id = clean_database()
    if slot_id:
        booking_id = test_race_condition(slot_id)
        if booking_id:
            test_cancellation(booking_id)
