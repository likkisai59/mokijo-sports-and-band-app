"""Band Favorites router — allows clients to favorite artists and venues."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.band_models import BandAccount, BandFavoriteArtist, BandFavoriteVenue, BandArtistProfile, BandVenue
from app.api.band.common.deps import get_band_account
from app.api.band.artists import crud as artist_crud
from app.api.band.venues import crud as venue_crud

router = APIRouter()

# ── Artists ───────────────────────────────────────────────────────────────────

@router.post("/band/favorites/artists/{artist_id}", status_code=status.HTTP_200_OK, tags=["Band Favorites"])
def add_favorite_artist(artist_id: int, account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    # Verify artist exists
    artist = artist_crud.get_by_id(db, artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")

    existing = db.query(BandFavoriteArtist).filter_by(client_id=account.id, artist_profile_id=artist_id).first()
    if not existing:
        new_fav = BandFavoriteArtist(client_id=account.id, artist_profile_id=artist_id)
        db.add(new_fav)
        db.commit()

    return {"success": True}


@router.delete("/band/favorites/artists/{artist_id}", status_code=status.HTTP_200_OK, tags=["Band Favorites"])
def remove_favorite_artist(artist_id: int, account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    fav = db.query(BandFavoriteArtist).filter_by(client_id=account.id, artist_profile_id=artist_id).first()
    if fav:
        db.delete(fav)
        db.commit()
    return {"success": True}


@router.get("/band/favorites/artists/check/{artist_id}", tags=["Band Favorites"])
def check_favorite_artist(artist_id: int, account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    fav = db.query(BandFavoriteArtist).filter_by(client_id=account.id, artist_profile_id=artist_id).first()
    return {"is_favorite": fav is not None}


@router.get("/band/favorites/artists", tags=["Band Favorites"])
def list_favorite_artists(account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    favs = db.query(BandFavoriteArtist).filter_by(client_id=account.id).all()
    # Serialize the artists
    results = []
    for fav in favs:
        artist = artist_crud.get_by_id(db, fav.artist_profile_id)
        if artist:
            results.append(artist_crud.serialize(artist))
    return results


# ── Venues ────────────────────────────────────────────────────────────────────

@router.post("/band/favorites/venues/{venue_id}", status_code=status.HTTP_200_OK, tags=["Band Favorites"])
def add_favorite_venue(venue_id: int, account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    venue = venue_crud.get_by_id(db, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    existing = db.query(BandFavoriteVenue).filter_by(client_id=account.id, venue_id=venue_id).first()
    if not existing:
        new_fav = BandFavoriteVenue(client_id=account.id, venue_id=venue_id)
        db.add(new_fav)
        db.commit()

    return {"success": True}


@router.delete("/band/favorites/venues/{venue_id}", status_code=status.HTTP_200_OK, tags=["Band Favorites"])
def remove_favorite_venue(venue_id: int, account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    fav = db.query(BandFavoriteVenue).filter_by(client_id=account.id, venue_id=venue_id).first()
    if fav:
        db.delete(fav)
        db.commit()
    return {"success": True}


@router.get("/band/favorites/venues/check/{venue_id}", tags=["Band Favorites"])
def check_favorite_venue(venue_id: int, account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    fav = db.query(BandFavoriteVenue).filter_by(client_id=account.id, venue_id=venue_id).first()
    return {"is_favorite": fav is not None}


@router.get("/band/favorites/venues", tags=["Band Favorites"])
def list_favorite_venues(account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    favs = db.query(BandFavoriteVenue).filter_by(client_id=account.id).all()
    results = []
    for fav in favs:
        venue = venue_crud.get_by_id(db, fav.venue_id)
        if venue:
            results.append(venue_crud.serialize(venue))
    return results
