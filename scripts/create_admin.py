#!/usr/bin/env python3
"""
Create initial platform administrator — BandConnect

Usage (from repo root with venv activated):

    # Interactive (prompts for credentials):
    python scripts/create_admin.py

    # Non-interactive (pass credentials as env vars):
    ADMIN_EMAIL=admin@example.com ADMIN_NAME="Admin" ADMIN_PASSWORD=YourPass123! \
        python scripts/create_admin.py --non-interactive

This script:
  - Connects to the database configured in backend/.env
  - Creates the 'admin' role if it does not already exist
  - Creates an admin user with the given credentials
  - Assigns the admin role to that user

NEVER commit real admin credentials to source control.
This script is intended for local development and initial production seeding only.
"""

import os
import sys
import getpass
import argparse

# Ensure we can import backend modules from the repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.features.auth.crud import UserCRUD, RoleCRUD


def create_admin(email: str, name: str, password: str) -> None:
    """Create an admin user in the database."""
    db = SessionLocal()
    user_crud = UserCRUD()
    role_crud = RoleCRUD()

    try:
        # 1. Ensure admin role exists
        role = role_crud.get_by_name(db, "admin")
        if not role:
            role = role_crud.create(
                db,
                obj_in={"name": "admin", "description": "Platform administrator with full access"},
            )
            print(f"[+] Created role: admin")
        else:
            print(f"[i] Role 'admin' already exists.")

        # 2. Check if user already exists
        existing = user_crud.get_by_email(db, email)
        if existing:
            # Check if already admin
            if any(r.name == "admin" for r in existing.roles):
                print(f"[i] User {email} already exists with admin role. No action taken.")
                return
            # Promote existing user to admin
            existing.roles.append(role)
            db.commit()
            print(f"[+] Existing user {email} promoted to admin.")
            return

        # 3. Create admin user
        hashed = get_password_hash(password)
        user = user_crud.create(
            db,
            obj_in={
                "email": email,
                "password_hash": hashed,
                "name": name,
                "is_active": True,
                "is_verified": True,  # Admins are pre-verified
            },
        )
        user.roles.append(role)
        db.commit()
        db.refresh(user)
        print(f"\n✓ Admin user created successfully!")
        print(f"  Email : {user.email}")
        print(f"  Name  : {user.name}")
        print(f"  Role  : admin")
        print(f"  ID    : {user.id}")
        print(f"\nLogin at: {settings.APP_URL}/login")

    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a BandConnect platform admin user")
    parser.add_argument("--non-interactive", action="store_true", help="Read credentials from environment variables")
    args = parser.parse_args()

    if args.non_interactive:
        email = os.environ.get("ADMIN_EMAIL", "").strip()
        name = os.environ.get("ADMIN_NAME", "Admin").strip()
        password = os.environ.get("ADMIN_PASSWORD", "").strip()
        if not email or not password:
            print("ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.", file=sys.stderr)
            sys.exit(1)
    else:
        print("=== BandConnect — Create Admin User ===\n")
        email = input("Admin email: ").strip()
        name = input("Admin name [Admin]: ").strip() or "Admin"
        password = getpass.getpass("Admin password (min 8 chars): ")
        if len(password) < 8:
            print("ERROR: Password must be at least 8 characters.", file=sys.stderr)
            sys.exit(1)

    create_admin(email, name, password)


if __name__ == "__main__":
    main()
