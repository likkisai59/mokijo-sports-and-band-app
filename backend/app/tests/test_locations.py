from app.features.locations.models import Country, State, City

def test_list_countries_empty(client):
    response = client.get("/api/v1/locations/countries")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"] == []
    assert res_data["message"] == "Countries retrieved."

def test_list_countries_populated(client, db_session):
    # Add a mock country
    mock_country = Country(name="India", code="IN")
    db_session.add(mock_country)
    db_session.commit()
    db_session.refresh(mock_country)

    response = client.get("/api/v1/locations/countries")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert len(res_data["data"]) == 1
    assert res_data["data"][0]["name"] == "India"
    assert res_data["data"][0]["code"] == "IN"
    assert "id" in res_data["data"][0]

def test_list_states_empty(client, db_session):
    # Create a country first since states filter requires a valid country_id
    mock_country = Country(name="India", code="IN")
    db_session.add(mock_country)
    db_session.commit()
    db_session.refresh(mock_country)

    response = client.get(f"/api/v1/locations/states?country_id={mock_country.id}")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"] == []
    assert res_data["message"] == "States retrieved."

def test_list_states_populated(client, db_session):
    mock_country = Country(name="India", code="IN")
    db_session.add(mock_country)
    db_session.commit()
    db_session.refresh(mock_country)

    mock_state = State(name="Karnataka", country_id=mock_country.id)
    db_session.add(mock_state)
    db_session.commit()
    db_session.refresh(mock_state)

    response = client.get(f"/api/v1/locations/states?country_id={mock_country.id}")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert len(res_data["data"]) == 1
    assert res_data["data"][0]["name"] == "Karnataka"
    assert res_data["data"][0]["country_id"] == str(mock_country.id)

def test_list_cities_empty(client, db_session):
    mock_country = Country(name="India", code="IN")
    db_session.add(mock_country)
    db_session.commit()
    db_session.refresh(mock_country)

    mock_state = State(name="Karnataka", country_id=mock_country.id)
    db_session.add(mock_state)
    db_session.commit()
    db_session.refresh(mock_state)

    response = client.get(f"/api/v1/locations/cities?state_id={mock_state.id}")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"] == []
    assert res_data["message"] == "Cities retrieved."

def test_list_cities_populated(client, db_session):
    mock_country = Country(name="India", code="IN")
    db_session.add(mock_country)
    db_session.commit()
    db_session.refresh(mock_country)

    mock_state = State(name="Karnataka", country_id=mock_country.id)
    db_session.add(mock_state)
    db_session.commit()
    db_session.refresh(mock_state)

    mock_city = City(name="Bengaluru", state_id=mock_state.id)
    db_session.add(mock_city)
    db_session.commit()
    db_session.refresh(mock_city)

    response = client.get(f"/api/v1/locations/cities?state_id={mock_state.id}")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert len(res_data["data"]) == 1
    assert res_data["data"][0]["name"] == "Bengaluru"
    assert res_data["data"][0]["state_id"] == str(mock_state.id)
