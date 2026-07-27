"""
backend/extensions.py
---------------------
Shared Flask extension instances.
Created here (un-initialised) and bound to the Flask app in app.py via init_app().
This avoids circular imports between routes and the app factory.
"""

from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

cors = CORS()
jwt = JWTManager()

# Rate limiter — uses client IP as key by default
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],          # no global limit; per-route limits set in routes/auth.py
    storage_uri='memory://',    # in-memory; swap for Redis URI in production
)
