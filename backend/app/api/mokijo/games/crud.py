from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.models.models import User, Game, GamePlayer, GameWaitlist, Slot, Booking

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(objs):
    return [to_dict(obj) for obj in objs if obj]

# USERS
def get_user_basic(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    return to_dict(user)

# GAMES
def create_game(db: Session, insert_data: dict) -> str:
    game = Game(**insert_data)
    db.add(game)
    db.commit()
    db.refresh(game)
    return str(game.id)

def get_game(db: Session, game_id: str):
    return to_dict(db.query(Game).filter(Game.id == game_id).first())

def get_game_for_update(db: Session, game_id: str):
    return to_dict(db.query(Game).filter(Game.id == game_id).with_for_update().first())

def get_games_by_host(db: Session, host_id: int):
    return to_dict_list(db.query(Game).filter(Game.host_id == host_id).all())

def get_games_by_ids(db: Session, ids: tuple):
    return to_dict_list(db.query(Game).filter(Game.id.in_(ids)).all())

def update_game_status(db: Session, game_id: str, status: str):
    game = db.query(Game).filter(Game.id == game_id).first()
    if game:
        game.status = status
        db.commit()

def update_game_current_players(db: Session, game_id: str, increment: int = 1):
    game = db.query(Game).filter(Game.id == game_id).first()
    if game:
        if game.current_players is None:
            game.current_players = 0
        game.current_players += increment
        db.commit()

# GAME PLAYERS
def create_game_player(db: Session, insert_data: dict) -> str:
    player = GamePlayer(**insert_data)
    db.add(player)
    db.commit()
    db.refresh(player)
    return str(player.id)

def get_player(db: Session, player_id: str):
    return to_dict(db.query(GamePlayer).filter(GamePlayer.id == player_id).first())

def get_player_by_game_and_user(db: Session, game_id: str, user_id: int):
    return to_dict(db.query(GamePlayer).filter(GamePlayer.game_id == game_id, GamePlayer.user_id == user_id).first())

def get_players_by_user(db: Session, user_id: int):
    return to_dict_list(db.query(GamePlayer).filter(GamePlayer.user_id == user_id).all())

def get_active_players_by_game(db: Session, game_id: str):
    return to_dict_list(db.query(GamePlayer).filter(GamePlayer.game_id == game_id, GamePlayer.status.in_(['confirmed', 'pending_payment'])).order_by(GamePlayer.joined_at.asc()).all())

def get_confirmed_player_count(db: Session, game_id: str) -> int:
    return db.query(GamePlayer).filter(GamePlayer.game_id == game_id, GamePlayer.status == 'confirmed').count()

def update_player_status(db: Session, player_id: str, status: str):
    player = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
    if player:
        player.status = status
        db.commit()

def update_player_rejoin(db: Session, player_id: str, status: str, joined_at: datetime):
    db.query(GamePlayer).filter(GamePlayer.id == player_id).update({
        "status": status,
        "joined_at": joined_at,
        "cancelled_at": None,
        "payment_id": None
    }, synchronize_session=False)
    db.commit()

def delete_player(db: Session, player_id: str):
    player = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
    if player:
        db.delete(player)
        db.commit()

def cancel_all_players_in_game(db: Session, game_id: str):
    players = db.query(GamePlayer).filter(GamePlayer.game_id == game_id, GamePlayer.status.in_(['confirmed', 'pending_payment'])).all()
    for player in players:
        player.status = 'cancelled'
    db.commit()

# WAITLIST
def create_waitlist_entry(db: Session, insert_data: dict) -> str:
    entry = GameWaitlist(**insert_data)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return str(entry.id)

def get_waitlist_entry(db: Session, waitlist_id: str):
    return to_dict(db.query(GameWaitlist).filter(GameWaitlist.id == waitlist_id).first())

def get_waitlist_by_game_and_user(db: Session, game_id: str, user_id: int):
    entry = db.query(GameWaitlist).filter(GameWaitlist.game_id == game_id, GameWaitlist.user_id == user_id).first()
    return to_dict(entry) if entry else None

def get_max_waitlist_position(db: Session, game_id: str) -> int:
    max_pos = db.query(func.max(GameWaitlist.position)).filter(GameWaitlist.game_id == game_id).scalar()
    return max_pos or 0

def get_waitlist_count_by_game(db: Session, game_id: str) -> int:
    return db.query(GameWaitlist).filter(GameWaitlist.game_id == game_id).count()

# SLOTS AND BOOKINGS (Game specific interactions)
def get_slot_for_update(db: Session, slot_id: int):
    return to_dict(db.query(Slot).filter(Slot.id == slot_id).with_for_update().first())

def update_slot_status(db: Session, slot_id: int, status: str):
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if slot:
        slot.status = status
        db.commit()

def release_slot(db: Session, slot_id: int):
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if slot:
        slot.status = 'AVAILABLE'
        slot.held_until = None
        slot.held_by_user_id = None
        db.commit()

def create_booking(db: Session, insert_data: dict) -> int:
    booking = Booking(**insert_data)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking.id

def create_booking_slot(db: Session, booking_id: int, slot_id: int):
    # we need to append to the booking's slots, but booking_slots is an association table.
    # It's better to fetch the booking and slot and append.
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if booking and slot:
        booking.slots.append(slot)
        db.commit()
    return True

def get_booking_by_slot(db: Session, slot_id: int):
    return to_dict(db.query(Booking).join(Booking.slots).filter(Slot.id == slot_id, Booking.status == 'reserved').first())

def update_booking_status(db: Session, booking_id: int, status: str):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking:
        booking.status = status
        db.commit()


def get_game_players_by_user_and_status(db: Session, user_id: int, status: str):
    return to_dict_list(db.query(GamePlayer).filter(GamePlayer.user_id == user_id, GamePlayer.status == status).all())

def get_available_slot_for_update(db: Session, venue_id: int, start_time: datetime, end_time: datetime):
    return to_dict(db.query(Slot).filter(
        Slot.venue_id == venue_id,
        Slot.start_time == start_time,
        Slot.end_time == end_time,
        Slot.status == 'AVAILABLE'
    ).with_for_update().first())

def update_slot_hold(db: Session, slot_id: int, held_until: datetime, held_by_user_id: int):
    db.query(Slot).filter(Slot.id == slot_id).update({
        "status": 'HELD',
        "held_until": held_until,
        "held_by_user_id": held_by_user_id
    }, synchronize_session=False)
    db.commit()

def get_active_player_by_game_and_user(db: Session, game_id: str, user_id: int):
    return to_dict(db.query(GamePlayer).filter(
        GamePlayer.game_id == game_id,
        GamePlayer.user_id == user_id,
        GamePlayer.status.in_(['confirmed', 'pending_payment', 'pending_approval'])
    ).first())

def update_game_stats(db: Session, game_id: str, current_players: int, status: str):
    db.query(Game).filter(Game.id == game_id).update({
        "current_players": current_players,
        "status": status
    }, synchronize_session=False)
    db.commit()

def get_player_for_update(db: Session, player_id: str, game_id: str):
    return to_dict(db.query(GamePlayer).filter(GamePlayer.id == player_id, GamePlayer.game_id == game_id).with_for_update().first())

def update_player_cancellation(db: Session, player_id: str, cancelled_at: datetime):
    db.query(GamePlayer).filter(GamePlayer.id == player_id).update({
        "status": 'cancelled',
        "cancelled_at": cancelled_at
    }, synchronize_session=False)
    db.commit()

def get_active_player_by_game_and_user_for_update(db: Session, game_id: str, user_id: int):
    return to_dict(db.query(GamePlayer).filter(
        GamePlayer.game_id == game_id,
        GamePlayer.user_id == user_id,
        GamePlayer.status.in_(['confirmed', 'pending_payment'])
    ).with_for_update().first())

def get_player_by_game_and_user_for_update(db: Session, game_id: str, user_id: int):
    return to_dict(db.query(GamePlayer).filter(
        GamePlayer.game_id == game_id,
        GamePlayer.user_id == user_id
    ).with_for_update().first())

def update_player_confirmation(db: Session, player_id: str, payment_id: str):
    db.query(GamePlayer).filter(GamePlayer.id == player_id).update({
        "status": 'confirmed',
        "payment_id": payment_id
    }, synchronize_session=False)
    db.commit()

def get_held_slot(db: Session, venue_id: int, start_time: datetime, end_time: datetime):
    return to_dict(db.query(Slot).filter(
        Slot.venue_id == venue_id,
        Slot.start_time == start_time,
        Slot.end_time == end_time,
        Slot.status == 'HELD'
    ).first())

def update_booking_confirmation(db: Session, booking_id: int, amount_paid: float):
    db.query(Booking).filter(Booking.id == booking_id).update({
        "status": 'confirmed',
        "payment_status": 'paid',
        "amount_paid": amount_paid
    }, synchronize_session=False)
    db.commit()

def get_slot_by_status(db: Session, venue_id: int, start_time: datetime, end_time: datetime, statuses: list):
    return to_dict(db.query(Slot).filter(
        Slot.venue_id == venue_id,
        Slot.start_time == start_time,
        Slot.end_time == end_time,
        Slot.status.in_(statuses)
    ).first())

def get_bookings_by_slot(db: Session, slot_id: int):
    return to_dict_list(db.query(Booking).join(Booking.slots).filter(Slot.id == slot_id).all())

def cancel_booking(db: Session, booking_id: int, reason: str):
    db.query(Booking).filter(Booking.id == booking_id).update({
        "status": 'cancelled',
        "cancellation_reason": reason
    }, synchronize_session=False)
    db.commit()

def cancel_active_players_by_game(db: Session, game_id: str, cancelled_at: datetime):
    db.query(GamePlayer).filter(
        GamePlayer.game_id == game_id,
        GamePlayer.status.in_(['confirmed', 'pending_payment'])
    ).update({
        "status": 'cancelled',
        "cancelled_at": cancelled_at
    }, synchronize_session=False)
    db.commit()


def get_public_games(db: Session, sport: Optional[str] = None):
    query = db.query(Game).filter(Game.status == 'open', Game.visibility == 'public', Game.slot_start > func.now())
    if sport and sport != 'all':
        query = query.filter(Game.sport == sport)
    return to_dict_list(query.all())

