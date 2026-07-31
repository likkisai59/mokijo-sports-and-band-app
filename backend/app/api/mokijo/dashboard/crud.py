from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Group, Member, Event, Match, MatchTeam, MatchEvent

def get_groups_by_owner(db: Session, owner_id: int):
    return db.query(Group).filter(Group.owner_id == owner_id).all()

def count_members_by_owner(db: Session, owner_id: int):
    return db.query(Member).join(Group, Member.group_id == Group.id).filter(Group.owner_id == owner_id).count()

def get_events_by_owner(db: Session, owner_id: int):
    return db.query(Event).join(Group, Event.group_id == Group.id).filter(Group.owner_id == owner_id).all()

def get_recent_members_by_owner(db: Session, owner_id: int, limit: int = 5):
    return db.query(Member, Group.group_name).join(Group, Member.group_id == Group.id).filter(Group.owner_id == owner_id).order_by(Member.id.desc()).limit(limit).all()

def get_live_matches_by_owner(db: Session, owner_id: int, limit: int = 8):
    return db.query(Match).filter(
        Match.owner_id == owner_id,
        func.upper(Match.status).in_(['LIVE', 'LIVE NOW', 'IN_PROGRESS', 'IN PROGRESS'])
    ).order_by(Match.scheduled_at.desc(), Match.created_at.desc()).limit(limit).all()

def get_teams_by_match(db: Session, match_id: int):
    return db.query(MatchTeam).filter(MatchTeam.match_id == match_id).all()

def get_members_by_group(db: Session, group_id: int):
    return db.query(Member).filter(Member.group_id == group_id).order_by(Member.id.asc()).all()

def get_match_events_by_match(db: Session, match_id: int, limit: int = 5):
    return db.query(MatchEvent).filter(MatchEvent.match_id == match_id).order_by(MatchEvent.timestamp.desc(), MatchEvent.id.desc()).limit(limit).all()
