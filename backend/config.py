"""
backend/config.py
-----------------
All environment-based settings for KisanCare.
Reads from environment variables (populated by python-dotenv from backend/.env).
Every value has a safe default so the app never crashes on a missing key —
but callers that need a real value must check whether it's still the placeholder.
"""

import os

# Load .env file if present (harmless if absent)
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(_env_path)
except ImportError:
    pass  # python-dotenv not installed — rely on system env vars


class Config:
    # ── MongoDB ────────────────────────────────────────────────────────────
    MONGO_URI: str = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
    DB_NAME: str = 'kisancare_db'
    LOGIN_COLLECTION: str = 'login'

    # ── JWT ────────────────────────────────────────────────────────────────
    # Must be ≥32 bytes for SHA-256 (RFC 7518 §3.2). Set a real secret in backend/.env.
    JWT_SECRET_KEY: str = os.environ.get('JWT_SECRET_KEY', 'CHANGE_THIS_IN_PROD_USE_32_BYTES!!')
    JWT_ACCESS_TOKEN_EXPIRES: int = 86400  # 24 hours in seconds

    # ── Gemini AI ──────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = os.environ.get('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY')

    # ── OpenWeatherMap (Phase 2 backend proxy) ─────────────────────────────
    OPENWEATHER_API_KEY: str = os.environ.get('OPENWEATHER_API_KEY', '')

    # ── data.gov.in APMC market prices ────────────────────────────────────
    DATA_GOV_IN_API_KEY: str = os.environ.get('DATA_GOV_IN_API_KEY', '')

    # ── ML Model paths ─────────────────────────────────────────────────────
    _BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # project root
    CROP_MODEL_PATH: str = os.path.join(_BASE_DIR, 'ml_models', 'crop_model.pkl')
    DISEASE_MODEL_PATH: str = os.path.join(_BASE_DIR, 'ml_models', 'disease_model.h5')
    DISEASE_CLASSES_PATH: str = os.path.join(_BASE_DIR, 'ml_models', 'disease_classes.json')
    DISEASE_INFO_PATH: str = os.path.join(_BASE_DIR, 'ml_models', 'disease_info.json')
    
    # ── Uploads & Disease Detection ───────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 5
    DISEASE_CONFIDENCE_THRESHOLD: float = 0.60

    # ── Rate limiting ──────────────────────────────────────────────────────
    # Format understood by flask-limiter
    LOGIN_RATE_LIMIT: str = '10 per minute'
    SIGNUP_RATE_LIMIT: str = '5 per minute'

    # ── CORS ───────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = '*'   # tighten in Phase 10 (deployment)

    # ── Phase 6 Constants ──────────────────────────────────────────────────
    UPLOAD_PROFILE_DIR: str = os.path.join(_BASE_DIR, 'uploads', 'profiles')
    PROFILE_COLLECTION: str = 'profiles'
    HISTORY_COLLECTION: str = 'crop_history'
    CYCLES_COLLECTION: str  = 'crop_cycles'
    
    # Fertilizer cost estimates (₹/kg), clearly labelled as rough estimates
    FERT_COST_N_PER_KG: float = 22.0   # Urea equivalent
    FERT_COST_P_PER_KG: float = 48.0   # DAP equivalent
    FERT_COST_K_PER_KG: float = 35.0   # MOP equivalent

    @classmethod
    def gemini_key_is_set(cls) -> bool:
        """Returns True only if a real Gemini key has been configured."""
        return bool(cls.GEMINI_API_KEY) and cls.GEMINI_API_KEY != 'YOUR_GEMINI_API_KEY'

    @classmethod
    def data_gov_key_is_set(cls) -> bool:
        """Returns True only if a real data.gov.in key has been configured."""
        return bool(cls.DATA_GOV_IN_API_KEY)
