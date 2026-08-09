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

# In-memory user store for fallback when MongoDB is offline
_FALLBACK_USERS = {
    'demo@gmail.com': {
        'name': 'Demo User',
        'email': 'demo@gmail.com',
        'password': generate_password_hash('Demo@1234'),
        'phone': '9876543210',
        'role': 'farmer',
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
}

def find_user_by_email(db, email: str):
    """Return the user document for *email*, or None if not found."""
    email_key = email.lower().strip()
    if db is None:
        return _FALLBACK_USERS.get(email_key)
    return db[LOGIN_COL].find_one({'email': email_key})


def create_user(db, name: str, email: str, password_plain: str,
                phone: str = '', role: str = 'farmer') -> bool:
    """
    Insert a new user into the login collection.
    Password is hashed before storage — plain text is never persisted.
    Returns True on success, False on failure.
    """
    email_key = email.lower().strip()
    doc = {
        'name': name,
        'email': email_key,
        'password': generate_password_hash(password_plain),
        'phone': phone,
        'role': role,
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    if db is None:
        _FALLBACK_USERS[email_key] = doc
        return True
    try:
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
            'phone': '9876543210',
            'role': 'farmer',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        col.insert_one(doc)
        print("✅ Demo user seeded: demo@gmail.com / Demo@1234")

