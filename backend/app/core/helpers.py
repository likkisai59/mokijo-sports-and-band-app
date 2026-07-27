import json
from datetime import date, datetime
from fastapi import HTTPException

def get_effective_payment_status(payment: dict):
    due_date = payment.get("due_date")
    status = payment.get("status")
    if status == "pending" and due_date:
        # handle date vs string comparison
        due_date_str = str(due_date)
        if due_date_str < date.today().isoformat():
            return "overdue"
    return status

def serialize_payment(payment: dict, db_driver=None):
    member_name = ""
    member_id = payment.get("member_id")
    if member_id and db_driver:
        member = db_driver.fetch_one("SELECT first_name, last_name FROM members WHERE id = %s", (member_id,))
        if member:
            member_name = f"{member.get('first_name', '')} {member.get('last_name', '')}".strip()

    group_name = None
    group_id = payment.get("group_id")
    if group_id and db_driver:
        group = db_driver.fetch_one("SELECT group_name FROM groups WHERE id = %s", (group_id,))
        if group:
            group_name = group.get("group_name")

    created_at = payment.get("created_at")
    if isinstance(created_at, datetime):
        created_at_str = created_at.isoformat()
    else:
        created_at_str = str(created_at) if created_at else None

    return {
        "id": payment.get("id"),
        "owner_id": payment.get("owner_id"),
        "group_id": group_id,
        "member_id": member_id,
        "title": payment.get("title"),
        "description": payment.get("description"),
        "category": payment.get("category"),
        "amount": payment.get("amount"),
        "due_date": str(payment.get("due_date")) if payment.get("due_date") else None,
        "status": get_effective_payment_status(payment),
        "payment_method": payment.get("payment_method"),
        "paid_at": str(payment.get("paid_at")) if payment.get("paid_at") else None,
        "created_at": created_at_str,
        "group_name": group_name,
        "member_name": member_name,
    }

def validate_payment_scope(owner_id: int, group_id: int | None, member_id: int | None, db_driver):
    if member_id:
        member = db_driver.fetch_one(
            "SELECT m.*, g.owner_id FROM members m JOIN groups g ON m.group_id = g.id WHERE m.id = %s AND g.owner_id = %s",
            (member_id, owner_id)
        )
        if not member:
            raise HTTPException(status_code=404, detail="Member not found or access denied")
        if group_id and member.get("group_id") != group_id:
            raise HTTPException(status_code=400, detail="Selected member does not belong to the selected group")
        group_id = member.get("group_id")

    if group_id:
        group = db_driver.fetch_one(
            "SELECT * FROM groups WHERE id = %s AND owner_id = %s",
            (group_id, owner_id)
        )
        if not group:
            raise HTTPException(status_code=404, detail="Group not found or access denied")

    return group_id, member_id

def get_course_registration_count(course_id: int, db_driver):
    res = db_driver.fetch_one(
        "SELECT COUNT(*) as count FROM course_registrations WHERE course_id = %s AND status != 'cancelled'",
        (course_id,)
    )
    return res.get("count", 0) if res else 0

def serialize_course(course: dict, db_driver):
    course_id = course.get("id")
    registration_count = get_course_registration_count(course_id, db_driver)
    capacity = course.get("capacity") or 0
    available_seats = max(capacity - registration_count, 0)
    
    group_name = None
    group_id = course.get("group_id")
    if group_id:
        group = db_driver.fetch_one("SELECT group_name FROM groups WHERE id = %s", (group_id,))
        if group:
            group_name = group.get("group_name")

    paid_res = db_driver.fetch_one(
        "SELECT COUNT(*) as count FROM course_registrations WHERE course_id = %s AND payment_status = 'paid'",
        (course_id,)
    )
    paid_count = paid_res.get("count", 0) if paid_res else 0

    created_at = course.get("created_at")
    if isinstance(created_at, datetime):
        created_at_str = created_at.isoformat()
    else:
        created_at_str = str(created_at) if created_at else None

    status = course.get("status") or "open"
    if status == "open" and available_seats == 0:
        status = "full"

    trainer_id = course.get("trainer_id")
    trainer_name = course.get("trainer_name")
    trainer_phone = course.get("trainer_phone")
    if trainer_id:
        trainer = db_driver.fetch_one(
            "SELECT first_name, last_name, phone FROM trainers WHERE id = %s LIMIT 1",
            (trainer_id,)
        )
        if trainer:
            if not trainer_name:
                trainer_name = f"{trainer.get('first_name', '')} {trainer.get('last_name', '')}".strip()
            if not trainer_phone:
                trainer_phone = trainer.get("phone")

    rescheduled_at = course.get("rescheduled_at")
    if isinstance(rescheduled_at, datetime):
        rescheduled_at_str = rescheduled_at.isoformat()
    else:
        rescheduled_at_str = str(rescheduled_at) if rescheduled_at else None

    days_raw = course.get("days")
    days_list = None
    if isinstance(days_raw, list):
        days_list = days_raw
    elif isinstance(days_raw, str) and days_raw.strip():
        try:
            import json
            parsed = json.loads(days_raw)
            days_list = parsed if isinstance(parsed, list) else [d.strip() for d in days_raw.split(",") if d.strip()]
        except Exception:
            days_list = [d.strip() for d in days_raw.split(",") if d.strip()]

    return {
        "id": course_id,
        "owner_id": course.get("owner_id"),
        "trainer_id": trainer_id,
        "is_trainer_training": bool(trainer_id),
        "trainer_name": trainer_name,
        "trainer_phone": trainer_phone,
        "group_id": group_id,
        "title": course.get("title"),
        "code": course.get("code"),
        "category": course.get("category") or "Training",
        "level": course.get("level"),
        "description": course.get("description"),
        "instructor": course.get("instructor"),
        "start_date": str(course.get("start_date")) if course.get("start_date") else None,
        "end_date": str(course.get("end_date")) if course.get("end_date") else None,
        "schedule": course.get("schedule"),
        "location": course.get("location"),
        "capacity": capacity,
        "fee": course.get("fee") or 0,
        "status": status,
        "created_at": created_at_str,
        "group_name": group_name,
        "registration_count": registration_count,
        "available_seats": available_seats,
        "paid_count": paid_count,
        "reschedule_reason": course.get("reschedule_reason"),
        "rescheduled_at": rescheduled_at_str,
        "cover_image": course.get("cover_image"),
        "start_time": course.get("start_time"),
        "end_time": course.get("end_time"),
        "days": days_list,
    }

def serialize_course_registration(registration: dict, db_driver):
    course_id = registration.get("course_id")
    course_title = None
    group_name = None
    if course_id:
        course = db_driver.fetch_one("SELECT title, group_id FROM courses WHERE id = %s", (course_id,))
        if course:
            course_title = course.get("title")
            group_id = course.get("group_id")
            if group_id:
                group = db_driver.fetch_one("SELECT group_name FROM groups WHERE id = %s", (group_id,))
                if group:
                    group_name = group.get("group_name")

    registered_at = registration.get("registered_at")
    if isinstance(registered_at, datetime):
        registered_at_str = registered_at.isoformat()
    else:
        registered_at_str = str(registered_at) if registered_at else None

    return {
        "id": registration.get("id"),
        "owner_id": registration.get("owner_id"),
        "course_id": course_id,
        "member_id": registration.get("member_id"),
        "participant_name": registration.get("participant_name"),
        "participant_email": registration.get("participant_email"),
        "participant_phone": registration.get("participant_phone"),
        "status": registration.get("status"),
        "payment_status": registration.get("payment_status"),
        "notes": registration.get("notes"),
        "registered_at": registered_at_str,
        "course_title": course_title,
        "group_name": group_name,
    }

def serialize_event(event: dict, db_driver):
    group_name = "Club-Wide"
    group_id = event.get("group_id")
    if group_id:
        group = db_driver.fetch_one("SELECT group_name FROM groups WHERE id = %s", (group_id,))
        if group:
            group_name = group.get("group_name")

    return {
        "id": event.get("id"),
        "group_id": group_id,
        "owner_id": event.get("owner_id"),
        "name": event.get("name"),
        "type": event.get("type"),
        "date": str(event.get("date")) if event.get("date") else None,
        "time": str(event.get("time")) if event.get("time") else None,
        "start_time": str(event.get("start_time")) if event.get("start_time") else None,
        "end_time": str(event.get("end_time")) if event.get("end_time") else None,
        "location": event.get("location"),
        "description": event.get("description"),
        "cover_image": event.get("cover_image"),
        "registration_deadline": str(event.get("registration_deadline")) if event.get("registration_deadline") else None,
        "max_participants": event.get("max_participants"),
        "fee": event.get("fee") or 0,
        "auto_reminder": event.get("auto_reminder") or False,
        "attendance_tracking": event.get("attendance_tracking") or False,
        "is_public": event.get("is_public") if event.get("is_public") is not None else True,
        "allow_guest": event.get("allow_guest") or False,
        "allow_waiting_list": event.get("allow_waiting_list") or False,
        "rules_pdf": event.get("rules_pdf"),
        "schedule_file": event.get("schedule_file"),
        "permission_forms": event.get("permission_forms"),
        "match_fixtures": event.get("match_fixtures"),
        "event_posters": event.get("event_posters"),
        "group_name": group_name,
        "visible_to_member": event.get("visible_to_member", True)
    }

def normalize_phone(value: str | None):
    return "".join(char for char in str(value or "") if char.isdigit())

def normalize_email(value: str | None):
    return "".join(str(value or "").split()).lower()

def normalize_text(value: str | None):
    return str(value or "").strip()

def get_case_insensitive_value(data: dict, key: str):
    for data_key, value in data.items():
        if str(data_key).lower() == key.lower():
            return value
    return None

def parse_submission_data(submitted_data: str):
    try:
        data = json.loads(submitted_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid submission data format")

    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Invalid submission data format")

    return data

def get_submission_email(data: dict):
    return normalize_email(get_case_insensitive_value(data, "email"))

def find_approved_member_by_email(db_driver, email_clean: str, owner_id: int | None = None):
    if owner_id is not None:
        return db_driver.fetch_one(
            "SELECT m.* FROM members m JOIN groups g ON m.group_id = g.id WHERE LOWER(REPLACE(m.email, ' ', '')) = %s AND g.owner_id = %s LIMIT 1",
            (email_clean, owner_id)
        )
    return db_driver.fetch_one(
        "SELECT * FROM members WHERE LOWER(REPLACE(email, ' ', '')) = %s LIMIT 1",
        (email_clean,)
    )

def has_pending_submission_for_email(
    db_driver,
    email_clean: str,
    owner_id: int | None = None,
    exclude_submission_id: int | None = None
):
    query = "SELECT * FROM signup_submissions"
    params = []
    conditions = []
    
    if owner_id is not None:
        conditions.append("owner_id = %s")
        params.append(owner_id)
    if exclude_submission_id is not None:
        conditions.append("id != %s")
        params.append(exclude_submission_id)
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    submissions = db_driver.fetch_all(query, tuple(params))
    for pending_submission in submissions:
        try:
            data = json.loads(pending_submission.get("submitted_data"))
        except Exception:
            continue
        if isinstance(data, dict) and get_submission_email(data) == email_clean:
            return True

    return False

def validate_course_group(owner_id: int, group_id: int | None, db_driver):
    if not group_id:
        return None

    group = db_driver.fetch_one(
        "SELECT * FROM groups WHERE id = %s AND owner_id = %s",
        (group_id, owner_id)
    )
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or access denied")
    return group_id
