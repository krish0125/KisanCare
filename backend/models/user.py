"""
backend/models/user.py
-----------------------
MongoDB helper functions for the 'login' collection (user documents).
All functions accept a `db` reference (pymongo Database) to avoid holding
a global connection reference that could go stale.

Document shape (no schema changes from original):
  {
    name: str,
    email: str,           # lowercase, unique
    password: str,        # Werkzeug PBKDF2 hash — NEVER plain text
    phone: str,
    role: str,            # 'farmer' | 'admin'  (added in Phase 1)
    created_at: str       # ISO-like datetime string
  }
"""

from datetime import datetime
from werkzeug.security import generate_password_hash
from backend.config import Config


LOGIN_COL = Config.LOGIN_COLLECTION


def find_user_by_email(db, email: str):
    """Return the user document for *email*, or None if not found."""
    if db is None:
        return None
    return db[LOGIN_COL].find_one({'email': email.lower().strip()})


def create_user(db, name: str, email: str, password_plain: str,
                phone: str = '', role: str = 'farmer') -> bool:
    """
    Insert a new user into the login collection.
    Password is hashed before storage — plain text is never persisted.
    Returns True on success, False on failure.
    """
    if db is None:
        return False
    try:
        doc = {
            'name': name,
            'email': email.lower().strip(),
            'password': generate_password_hash(password_plain),
            'phone': phone,
            'role': role,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        db[LOGIN_COL].insert_one(doc)
        return True
    except Exception as e:
        print(f"❌ create_user error: {e}")
        return False


def seed_demo_user(db) -> None:
    """
    Insert the demo user once on startup if it doesn't already exist.
    This preserves the existing demo account (demo@gmail.com / Demo@1234).
    """
    if db is None:
        return
    col = db[LOGIN_COL]
    if not col.find_one({'email': 'demo@gmail.com'}):
        doc = {
            'name': 'Demo User',
            'email': 'demo@gmail.com',
            'password': generate_password_hash('Demo@1234'),
            'phone': '',
            'role': 'farmer',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        col.insert_one(doc)
        print("✅ Demo user seeded: demo@gmail.com / Demo@1234")
