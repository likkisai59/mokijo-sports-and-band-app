from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Match, MatchTeam, MatchEvent, User

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(objs):
    return [to_dict(obj) for obj in objs if obj]

def get_match_by_id(db: Session, match_id: int):
    return to_dict(db.query(Match).filter(Match.id == match_id).first())

def get_match_for_update(db: Session, match_id: int):
    return to_dict(db.query(Match).filter(Match.id == match_id).with_for_update().first())

def get_match_teams(db: Session, match_id: int):
    return to_dict_list(db.query(MatchTeam).filter(MatchTeam.match_id == match_id).order_by(MatchTeam.id.asc()).all())

def get_match_events(db: Session, match_id: int):
    return to_dict_list(db.query(MatchEvent).filter(MatchEvent.match_id == match_id).order_by(MatchEvent.created_at.desc()).all())

def get_user_by_id(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    return to_dict(user) if user else None

def create_match(db: Session, insert_match: dict) -> int:
    match = Match(**insert_match)
    db.add(match)
    db.commit()
    db.refresh(match)
    return match.id

def create_match_team(db: Session, insert_team: dict) -> int:
    team = MatchTeam(**insert_team)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team.id

def get_matches(db: Session, owner_id: Optional[int], status: Optional[str]):
    query = db.query(Match)
    if owner_id is not None:
        query = query.filter(Match.owner_id == owner_id)
    if status is not None:
        query = query.filter(Match.status == status)
    
    return to_dict_list(query.order_by(Match.scheduled_at.desc(), Match.created_at.desc()).all())

def update_match(db: Session, match_id: int, update_data: dict):
    if not update_data:
        return
    match = db.query(Match).filter(Match.id == match_id).first()
    if match:
        for key, val in update_data.items():
            setattr(match, key, val)
        db.commit()

def update_match_winner(db: Session, match_id: int, winner_id: int):
    match = db.query(Match).filter(Match.id == match_id).first()
    if match:
        match.winner_team_id = winner_id
        db.commit()

def create_match_event(db: Session, insert_event: dict) -> int:
    event = MatchEvent(**insert_event)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event.id

def delete_match(db: Session, match_id: int):
    match = db.query(Match).filter(Match.id == match_id).first()
    if match:
        db.delete(match)
        db.commit()

def get_match_team_for_update(db: Session, team_id: int, match_id: int):
    return to_dict(db.query(MatchTeam).filter(MatchTeam.id == team_id, MatchTeam.match_id == match_id).with_for_update().first())

def update_team_score(db: Session, team_id: int, new_score: int):
    team = db.query(MatchTeam).filter(MatchTeam.id == team_id).first()
    if team:
        team.score = new_score
        db.commit()

def get_match_event_by_id(db: Session, event_id: int):
    return to_dict(db.query(MatchEvent).filter(MatchEvent.id == event_id).first())
