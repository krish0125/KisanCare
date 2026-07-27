"""
backend/app.py
--------------
KisanCare Flask application factory.

This file is now a thin factory that:
  1. Creates the Flask app
  2. Applies configuration from config.py
  3. Initialises shared extensions (CORS, JWT, Limiter)
  4. Connects to MongoDB
  5. Seeds the demo user
  6. Registers all route blueprints

All business logic lives in backend/routes/, backend/models/, backend/utils/.
Endpoint URLs are unchanged from the original so the existing frontend works
without any JS changes (except the crop form, updated separately).
"""

import os
import sys
from datetime import timedelta

from flask import Flask, jsonify
from pymongo import MongoClient

from backend.config import Config
from backend.extensions import cors, jwt, limiter
from backend.models.user import seed_demo_user
from backend.routes.auth import auth_bp
from backend.routes.predict import predict_bp
from backend.routes.chat import chat_bp
from backend.routes.market import market_bp
from backend.routes.weather import weather_bp
from backend.routes.disease import disease_bp
from backend.routes.advisory import advisory_bp
from backend.routes.profile import profile_bp
from backend.routes.history import history_bp
from backend.routes.fertilizer_calc import fertilizer_calc_bp
from backend.routes.expenses import expenses_bp
from backend.routes.schemes import schemes_bp
from backend.routes.admin import admin_bp

# Windows cmd/PowerShell with cp1252 encoding can't print emoji.
# This helper gracefully degrades to ASCII-safe output.
def _print(msg: str):
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode('ascii', errors='replace').decode('ascii'))

# ── App factory ────────────────────────────────────────────────────────────

def create_app() -> Flask:
    app = Flask(__name__)

    # ── Flask / JWT config ────────────────────────────────────────────────
    app.config['SECRET_KEY']                     = Config.JWT_SECRET_KEY
    app.config['JWT_SECRET_KEY']                 = Config.JWT_SECRET_KEY
    app.config['JWT_ACCESS_TOKEN_EXPIRES']       = timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
    app.config['RATELIMIT_STORAGE_URI']          = 'memory://'

    # ── Extensions ────────────────────────────────────────────────────────
    cors.init_app(app, resources={r'/*': {'origins': Config.CORS_ORIGINS}})
    jwt.init_app(app)
    limiter.init_app(app)

    # -- MongoDB connection -------------------------------------------------
    db = None
    try:
        mongo_client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
        db = mongo_client[Config.DB_NAME]
        # Ping to confirm connection is alive
        mongo_client.admin.command('ping')
        _print(f"[OK] Connected to MongoDB at {Config.MONGO_URI}")
        seed_demo_user(db)
    except Exception as e:
        _print(f"[WARN] Could not connect to MongoDB -- {e}")
        mongo_client = None
        db = None

    # ── Inject db reference into blueprints that need it ──────────────────
    auth_bp.db = db
    market_bp.db = db
    profile_bp.db = db
    history_bp.db = db
    fertilizer_calc_bp.db = db
    expenses_bp.db = db
    disease_bp.db = db
    predict_bp.db = db
    advisory_bp.db = db
    schemes_bp.db = db
    admin_bp.db = db

    # ── Register blueprints ───────────────────────────────────────────────
    app.register_blueprint(auth_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(disease_bp)
    app.register_blueprint(advisory_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(fertilizer_calc_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(schemes_bp)
    app.register_blueprint(admin_bp)

    # ── Root health-check ─────────────────────────────────────────────────
    @app.route('/')
    def health():
        return jsonify({
            'status':  'ok',
            'service': 'KisanCare API 🌿',
            'version': '1.0.0-phase1'
        })

    # ── JWT error handlers ────────────────────────────────────────────────
    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return jsonify({'status': 'error', 'message': f'Token required: {reason}'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({'status': 'error', 'message': f'Invalid token: {reason}'}), 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'status': 'error', 'message': 'Token has expired. Please log in again.'}), 401

    # ── Scheduler ─────────────────────────────────────────────────────────
    if db is not None:
        from backend.scheduler import init_scheduler
        # Avoid running multiple schedulers if reloader is active
        if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
            init_scheduler(app, db)

    return app


# ── Entry point ───────────────────────────────────────────────────────────
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5001)
