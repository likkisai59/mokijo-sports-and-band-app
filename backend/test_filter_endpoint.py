import requests

BASE_URL = "http://127.0.0.1:8001"

def test_filters():
    print("Testing GET /venues (all venues)...")
    res = requests.get(f"{BASE_URL}/venues")
    print(f"Status code: {res.status_code}")
    venues = res.json()
    print(f"Total venues found: {len(venues)}")
    if venues:
        print(f"Sample venue: {venues[0]['name']}, Base Price: {venues[0].get('base_price_per_hour')}, Rating: {venues[0].get('rating')}")

    print("\nTesting GET /venues with min_price/max_price filters...")
    res = requests.get(f"{BASE_URL}/venues", params={"min_price": 500, "max_price": 1200})
    print(f"Status code: {res.status_code}")
    venues_filtered = res.json()
    print(f"Venues in range 500-1200: {len(venues_filtered)}")
    for v in venues_filtered:
        print(f"- {v['name']}: Price = {v.get('base_price_per_hour')}")

    print("\nTesting GET /venues with ratings filter...")
    res = requests.get(f"{BASE_URL}/venues", params={"min_rating": 4.5})
    print(f"Status code: {res.status_code}")
    venues_rating = res.json()
    print(f"Venues with rating >= 4.5: {len(venues_rating)}")
    for v in venues_rating:
        print(f"- {v['name']}: Rating = {v.get('rating')}")

    print("\nTesting GET /venues with location coordinates (Bengaluru lat/lng)...")
    res = requests.get(f"{BASE_URL}/venues", params={"latitude": 12.9716, "longitude": 77.5946})
    print(f"Status code: {res.status_code}")
    venues_distance = res.json()
    print(f"Venues with distance sorted:")
    for v in venues_distance:
        print(f"- {v['name']}: Location = {v['location']}, Distance = {v.get('distance')} km, Lat = {v.get('latitude')}, Lng = {v.get('longitude')}")

    print("\nTesting GET /venues with date availability...")
    res = requests.get(f"{BASE_URL}/venues", params={"only_available": True, "date": "2026-07-10"})
    print(f"Status code: {res.status_code}")
    venues_avail = res.json()
    print(f"Venues available on 2026-07-10: {len(venues_avail)}")
    for v in venues_avail:
        print(f"- {v['name']}")

if __name__ == "__main__":
    test_filters()
