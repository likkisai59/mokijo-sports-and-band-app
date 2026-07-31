from fastapi import Request, HTTPException
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session

from app.models import schemas
from app.auth.authorization import validate_role_and_permission
from app.logger import logger
from app.api.mokijo.dashboard import crud

async def get_dashboard_overview(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_DASHBOARD_OVERVIEW", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            
            # Retrieve groups
            groups = crud.get_groups_by_owner(db, owner_id)
            total_groups = len(groups)
            
            # Count members
            db_members_count = crud.count_members_by_owner(db, owner_id)
            total_members = db_members_count + 1  # +1 for admin
            
            # Retrieve events
            all_events = crud.get_events_by_owner(db, owner_id)
            
            today_str = date.today().isoformat()
            upcoming_events = [e for e in all_events if e.date and str(e.date) >= today_str]
            
            # Recent registrations: last 5 members
            recent_members = crud.get_recent_members_by_owner(db, owner_id)
            
            recent_list = [{
                "id": m.Member.id,
                "first_name": m.Member.first_name,
                "last_name": m.Member.last_name,
                "email": m.Member.email,
                "group_name": m.group_name
            } for m in recent_members]
            
            # Sort upcoming events and take 5
            upcoming_events_sorted = sorted(upcoming_events, key=lambda x: str(x.date))
            upcoming_list = [{
                "id": e.id,
                "name": e.name,
                "type": e.type,
                "date": str(e.date) if e.date else None,
                "time": str(e.time) if e.time else None,
                "start_time": str(e.start_time) if e.start_time else None,
                "end_time": str(e.end_time) if e.end_time else None,
                "location": e.location
            } for e in upcoming_events_sorted[:5]]

            live_matches = crud.get_live_matches_by_owner(db, owner_id)
            live_match_items = []
            active_team_activity = []
            for match in live_matches:
                teams = crud.get_teams_by_match(db, match.id)
                team_names = [team.team_name for team in teams if team.team_name]
                live_match_items.append({
                    "id": match.id,
                    "title": match.title,
                    "sport": match.sport,
                    "status": match.status,
                    "venue": match.venue,
                    "scheduled_at": str(match.scheduled_at) if match.scheduled_at else None,
                    "teams": team_names,
                    "summary": " vs ".join(team_names) if team_names else match.title
                })

                for team in teams:
                    group_id = team.group_id
                    if not group_id:
                        continue
                    team_members = crud.get_members_by_group(db, group_id)
                    team_member_ids = {m.id for m in team_members}

                    match_events = crud.get_match_events_by_match(db, match.id)
                    
                    recent_events = []
                    for ev in match_events:
                        if ev.event_type in ['SCORE', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'] and ev.player_id in team_member_ids:
                            player = next((m for m in team_members if m.id == ev.player_id), None)
                            player_name = f"{player.first_name} {player.last_name}" if player else "Unknown"
                            
                            desc = f"{player_name} scored" if ev.event_type == 'SCORE' else f"{player_name} received {ev.event_type.replace('_', ' ').title()}"
                            if ev.event_type == 'SUBSTITUTION':
                                desc = f"{player_name} was substituted"
                                
                            recent_events.append({
                                "type": ev.event_type,
                                "description": desc,
                                "time": str(ev.timestamp) if ev.timestamp else None,
                                "player": player_name
                            })

                    if recent_events:
                        active_team_activity.append({
                            "matchId": match.id,
                            "matchTitle": match.title,
                            "teamName": team.team_name,
                            "recentEvents": recent_events[:5]
                        })

            return {
                "totalMembers": total_members,
                "totalGroups": total_groups,
                "upcomingEvents": len(upcoming_events),
                "recentRegistrations": recent_list,
                "upcomingEventList": upcoming_list,
                "liveMatches": live_match_items,
                "activeTeamActivity": active_team_activity
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get dashboard overview: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_coach_dashboard(request: Request, db: Session, owner_id: int, coach_email: str, current_user: dict):
    try:
        with logger.time_operation("GET_COACH_DASHBOARD", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            return {"message": "Coach dashboard implementation pending full schema mapping"}
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get coach dashboard: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def debug_overview(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("DEBUG_OVERVIEW", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            groups = crud.get_groups_by_owner(db, owner_id)
            return {"groups": len(groups)}
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed debug overview: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

