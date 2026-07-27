"""
backend/routes/auth.py
-----------------------
Authentication and user-management routes:
  POST /login          — email + password login; issues JWT token on success
  POST /signup         — register new farmer account
  POST /login-phone    — phone-based login (OTP stub, not verified yet)
  GET  /login-history  — fetch recent login history records
  POST /login-history  — log a login event
  POST /submit-feedback — save user feedback

Rate limiting:
  /login  — 10 requests per minute per IP
  /signup —  5 requests per minute per IP

All existing endpoint behaviour and response shapes are preserved exactly
so the current frontend (app.js) continues to work without changes.
"""

import os
import json
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash

from backend.config import Config
from backend.extensions import limiter
from backend.models.user import find_user_by_email, create_user
from backend.utils.validation import is_valid_email, is_strong_password

auth_bp = Blueprint('auth', __name__)

# Path for file-based login-history fallback (matches original)
_LOGIN_LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'login_log.json')

# ── DB accessor — injected at app startup via auth_bp.db ──────────────────
# We store the db reference on the blueprint rather than importing a global
# so tests can inject a mock db easily.
db = None  # set by app factory: auth_bp.db = db_instance


def _get_db():
    """Return the current MongoDB database object, or None if unavailable."""
    return auth_bp.db if hasattr(auth_bp, 'db') else None


# ── /login ────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
@limiter.limit(Config.LOGIN_RATE_LIMIT)
def login():
    try:
        data = request.json or {}
        email    = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()

        # ── Presence check ────────────────────────────────────────────────
        if not email or not password:
            return jsonify({'status': 'error',
                            'message': 'Email and password are required.'}), 400

        # ── Email format ──────────────────────────────────────────────────
        if not is_valid_email(email):
            return jsonify({'status': 'error',
                            'message': 'Invalid email format. Use a valid email like user@gmail.com'}), 400

        # ── DB check ──────────────────────────────────────────────────────
        db_ref = _get_db()
        if db_ref is None:
            return jsonify({'status': 'error', 'message': 'Database not connected'}), 500

        print(f"🔍 Login attempt for: {email}")

        user = find_user_by_email(db_ref, email)
        if not user:
            print("❌ User not found in 'login' collection")
            return jsonify({'status': 'error',
                            'message': 'No account found with this email. Please Sign Up first.'}), 401

        # ── Password check (hashed) ───────────────────────────────────────
        if not check_password_hash(user['password'], password):
            print("❌ Password mismatch")
            return jsonify({'status': 'error',
                            'message': 'Incorrect password. Please try again.'}), 401

        # ── Issue JWT ─────────────────────────────────────────────────────
        # identity = email; additional_claims carry name and role
        access_token = create_access_token(
            identity=email,
            additional_claims={
                'name': user.get('name', 'User'),
                'role': user.get('role', 'farmer')
            }
        )

        print(f"✅ Login successful: {email} (role: {user.get('role', 'farmer')})")
        return jsonify({
            'status': 'success',
            'message': 'Login Successful',
            'token': access_token,                               # NEW — JWT token
            'user': {
                'name': user.get('name', 'User'),
                'email': user['email'],
                'role': user.get('role', 'farmer')
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Server Error: {str(e)}'}), 500


# ── /signup ───────────────────────────────────────────────────────────────
@auth_bp.route('/signup', methods=['POST'])
@limiter.limit(Config.SIGNUP_RATE_LIMIT)
def signup():
    try:
        data     = request.json or {}
        name     = (data.get('name') or '').strip()
        email    = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        phone    = (data.get('phone') or '').strip()

        # ── Field presence ────────────────────────────────────────────────
        if not name or not email or not password:
            return jsonify({'status': 'error',
                            'message': 'Name, email, and password are required.'}), 400

        # ── Email format ──────────────────────────────────────────────────
        if not is_valid_email(email):
            return jsonify({'status': 'error',
                            'message': 'Invalid email format. Use a valid email like user@gmail.com or user@yahoo.com'}), 400

        # ── Password strength ─────────────────────────────────────────────
        ok, err_msg = is_strong_password(password)
        if not ok:
            return jsonify({'status': 'error', 'message': err_msg}), 400

        # ── DB check ──────────────────────────────────────────────────────
        db_ref = _get_db()
        if db_ref is None:
            return jsonify({'status': 'error', 'message': 'Database not connected'}), 500

        # ── Duplicate check ───────────────────────────────────────────────
        if find_user_by_email(db_ref, email):
            return jsonify({'status': 'error',
                            'message': 'Email already registered! Please Login.'}), 400

        # ── Create user (role defaults to 'farmer') ───────────────────────
        success = create_user(db_ref, name, email, password, phone, role='farmer')
        if not success:
            return jsonify({'status': 'error', 'message': 'Failed to create account. Try again.'}), 500

        print(f"✅ New farmer registered: {email}")
        return jsonify({'status': 'success', 'message': 'Account Created Successfully!'})

    except Exception as e:
        print(f"❌ Signup Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ── /login-phone ──────────────────────────────────────────────────────────
@auth_bp.route('/login-phone', methods=['POST'])
def login_phone():
    """
    Phone-based login stub. OTP is accepted as-is (not verified via SMS yet —
    SMS provider integration is Phase 7). Behaviour preserved from original app.py.
    """
    try:
        data  = request.json or {}
        phone = data.get('phone')
        otp   = data.get('otp')

        db_ref = _get_db()
        if db_ref is None:
            return jsonify({'status': 'error', 'message': 'Database not connected'}), 500

        print(f"🔍 Phone login attempt: {phone}, OTP: {otp}")

        users_col = db_ref['users']
        user = users_col.find_one({'phone': phone})

        update_data = {
            'last_login': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'last_otp': otp,
            'last_login_method': 'phone'
        }

        if user:
            users_col.update_one({'phone': phone}, {'$set': update_data})
            print(f"✅ Phone login: {user.get('name')}")
            return jsonify({
                'status': 'success',
                'message': 'Login Successful',
                'user': {
                    'name': user.get('name', 'User'),
                    'email': user.get('email', ''),
                    'phone': user.get('phone')
                }
            })
        else:
            new_user = {
                'name': 'Farmer User',
                'phone': phone,
                'email': '',
                'password': '',
                'role': 'farmer',
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                **update_data
            }
            users_col.insert_one(new_user)
            print(f"✅ New phone user created: {phone}")
            return jsonify({
                'status': 'success',
                'message': 'Account Created & Logged In',
                'user': {'name': 'Farmer User', 'phone': phone}
            })

    except Exception as e:
        print(f"⚠️ Phone login error: {e}")
        return jsonify({'status': 'error', 'message': f'Server Error: {str(e)}'}), 500


# ── /login-history GET ────────────────────────────────────────────────────
@auth_bp.route('/login-history', methods=['GET'])
def get_login_history():
    try:
        db_ref = _get_db()
        if db_ref is not None:
            try:
                cursor = db_ref['login_history'].find({}, {'_id': 0}).sort('timestamp', -1).limit(50)
                logs = list(cursor)
                return jsonify({'status': 'success', 'source': 'mongodb', 'data': logs})
            except Exception as db_e:
                print(f"MongoDB fetch error: {db_e}")

        # File fallback
        logs = []
        if os.path.exists(_LOGIN_LOG_FILE):
            try:
                with open(_LOGIN_LOG_FILE, 'r') as f:
                    logs = json.load(f)
                logs.reverse()
            except Exception:
                logs = []

        return jsonify({'status': 'success', 'source': 'file', 'data': logs})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── /login-history POST ───────────────────────────────────────────────────
@auth_bp.route('/login-history', methods=['POST'])
def log_login_history():
    try:
        data = request.json or {}
        entry = {
            'email':     data.get('email'),
            'phone':     data.get('phone'),
            'otp':       data.get('otp'),
            'device':    data.get('device'),
            'version':   data.get('version'),
            'method':    data.get('method', 'email'),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        db_ref = _get_db()
        if db_ref is not None:
            try:
                db_ref['login_history'].insert_one(entry.copy())
                print(f"✅ Login event logged to MongoDB")
                return jsonify({'status': 'success',
                                'message': 'Login logged to MongoDB', 'entry': entry})
            except Exception as db_e:
                print(f"MongoDB insert error: {db_e}")

        # File fallback
        logs = []
        if os.path.exists(_LOGIN_LOG_FILE):
            try:
                with open(_LOGIN_LOG_FILE, 'r') as f:
                    logs = json.load(f)
            except Exception:
                logs = []
        logs.append(entry)
        with open(_LOGIN_LOG_FILE, 'w') as f:
            json.dump(logs, f, indent=4)

        return jsonify({'status': 'success',
                        'message': 'Login logged to File (Fallback)', 'entry': entry})

    except Exception as e:
        print(f"Error logging login: {e}")
        return jsonify({'error': str(e)}), 500


# ── /submit-feedback ──────────────────────────────────────────────────────
@auth_bp.route('/submit-feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.json or {}
        if not data.get('name') or not data.get('message'):
            return jsonify({'status': 'error',
                            'message': 'Name and message are required.'}), 400

        entry = {
            'name':      data.get('name'),
            'message':   data.get('message'),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        db_ref = _get_db()
        if db_ref is not None:
            db_ref['feedback'].insert_one(entry)
            print(f"✅ Feedback saved to MongoDB: {entry['name']}")
        else:
            print("⚠️ MongoDB not connected. Feedback not saved.")

        return jsonify({'status': 'success', 'message': 'Feedback received!'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── /login-google ─────────────────────────────────────────────────────────
@auth_bp.route('/login-google', methods=['POST'])
def login_google():
    """
    Issue a JWT for a Google-authenticated user.
    The frontend has already validated the Google identity and passes us the
    email + display name. We upsert the user so first-time Google users are
    auto-registered without a password.
    """
    try:
        data  = request.json or {}
        email = (data.get('email') or '').strip().lower()
        name  = (data.get('name') or 'Farmer').strip()

        if not email:
            return jsonify({'status': 'error', 'message': 'Email required'}), 400

        db_ref = _get_db()
        if db_ref is None:
            return jsonify({'status': 'error', 'message': 'Database not connected'}), 500

        # Upsert: create user if they don't already have an account
        user = find_user_by_email(db_ref, email)
        if not user:
            db_ref['users'].insert_one({
                'email': email,
                'name':  name,
                'role':  'farmer',
                'provider': 'google',
                'created_at': datetime.now().isoformat()
            })

        access_token = create_access_token(
            identity=email,
            additional_claims={'name': name, 'role': 'farmer'}
        )

        return jsonify({
            'status': 'success',
            'token':  access_token,
            'user':   {'name': name, 'email': email, 'role': 'farmer'}
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500
