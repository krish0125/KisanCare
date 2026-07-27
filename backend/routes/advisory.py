"""
backend/routes/advisory.py
---------------------------
Smart Irrigation Advisor + Pest Prediction endpoints for KisanCare.

Blueprint: advisory_bp (prefix: "")

Endpoints:

  POST /api/irrigation-advice
    Input (JSON):
      { "crop": str, "growth_stage": str, "soil_type": str,
        "soil_moisture": str, "city": str }
    Returns:
      { "status": "success"|"mock", "recommendation": str,
        "water_quantity_mm": int, "timing": str, "reasoning": str,
        "water_saving_tip": str,
        "weather_used": { "temp": float, "humidity": int,
                          "rain_forecast_48h_mm": float,
                          "rain_prob_max_pct": int } }

  POST /api/pest-risk
    Input (JSON):
      { "crop": str, "city": str }
    Returns:
      { "status": "success"|"mock", "crop": str,
        "weather_used": { "temp": float, "humidity": int },
        "pests": [ { pest_name, local_name, risk_level, risk_score,
                     description, prevention, treatment, off_season,
                     season_note } ] }

Both endpoints:
  - Fetch weather server-side from OpenWeatherMap (reusing the Phase 2 OWM
    helper logic — no new external dependencies or API keys needed).
  - Fall back to plausible demo weather when the API key is absent, matching
    the mock-fallback pattern of routes/weather.py.
  - Return { "status": "error", "message": str } with an appropriate HTTP
    status code on invalid input or server errors.

IMPORTANT: No email, SMS, or push notification code is present in this module.
Advisory results are surfaced in-app only, on demand. Proactive alerts are
planned for Phase 7 (Smart Notifications).
"""

from __future__ import annotations

from typing import Dict, List

import requests as http_req
from flask import Blueprint, request, jsonify

from backend.config import Config
from backend.utils.irrigation_advisory import get_irrigation_advice
from backend.utils.pest_risk import assess_pest_risk, get_supported_crops

advisory_bp = Blueprint("advisory", __name__)

# ── Constants: valid enum values for manual inputs ───────────────────────────

_VALID_GROWTH_STAGES = {"sowing", "vegetative", "flowering", "maturity"}

_VALID_SOIL_TYPES = {
    "sandy", "loamy", "clay", "black_cotton", "red_laterite"
}

_VALID_SOIL_MOISTURE = {"dry", "moist", "wet"}

# ── OWM helpers (reuses same endpoints as routes/weather.py) ─────────────────

_OWM_BASE     = "https://api.openweathermap.org"
_OWM_CURRENT  = f"{_OWM_BASE}/data/2.5/weather"
_OWM_FORECAST = f"{_OWM_BASE}/data/2.5/forecast"
_OWM_GEO      = f"{_OWM_BASE}/geo/1.0/direct"


def _geocode(city: str, api_key: str) -> tuple[float, float]:
    """Resolve city name to (lat, lon) using OWM geocoding API."""
    geo_resp = http_req.get(
        _OWM_GEO,
        params={"q": city, "limit": 1, "appid": api_key},
        timeout=8,
    )
    geo_resp.raise_for_status()
    geo_data = geo_resp.json()
    if not geo_data:
        raise ValueError(f"City '{city}' not found.")
    return float(geo_data[0]["lat"]), float(geo_data[0]["lon"])


def _fetch_weather(city: str) -> Dict:
    """
    Fetch current weather + 48-h forecast for a city from OWM.

    Returns:
        {
          "status":   "success" | "mock",
          "temp":     float,
          "humidity": int,
          "hourly":   [ {rain_mm, rain_prob}, ... ]   # up to 48 slots
        }

    Falls back to clearly-labelled mock data if the API key is absent or OWM
    is unreachable (matching the pattern in routes/weather.py).
    """
    api_key = Config.OPENWEATHER_API_KEY
    if not api_key:
        return _mock_weather(city)

    try:
        lat, lon = _geocode(city, api_key)

        # Current weather
        cur_resp = http_req.get(
            _OWM_CURRENT,
            params={"lat": lat, "lon": lon, "appid": api_key,
                    "units": "metric", "lang": "en"},
            timeout=8,
        )
        cur_resp.raise_for_status()
        cur_data = cur_resp.json()
        main    = cur_data.get("main", {})
        temp    = round(float(main.get("temp", 25)), 1)
        humidity = int(main.get("humidity", 60))

        # 5-day / 3-hour forecast → hourly slots
        fcst_resp = http_req.get(
            _OWM_FORECAST,
            params={"lat": lat, "lon": lon, "appid": api_key,
                    "units": "metric", "lang": "en"},
            timeout=8,
        )
        fcst_resp.raise_for_status()
        fcst_list = fcst_resp.json().get("list", [])

        hourly = []
        for item in fcst_list[:16]:   # 16 × 3h = 48 h
            rain  = item.get("rain", {})
            hourly.append({
                "rain_mm":   round(float(rain.get("3h", 0)), 1),
                "rain_prob": round(float(item.get("pop", 0)), 2),
            })

        return {
            "status":   "success",
            "temp":     temp,
            "humidity": humidity,
            "hourly":   hourly,
        }

    except ValueError as e:
        # City not found — propagate as a user-facing error
        raise
    except (http_req.exceptions.HTTPError,
            http_req.exceptions.ConnectionError,
            http_req.exceptions.Timeout) as e:
        print(f"WARNING: OWM request failed ({type(e).__name__}) — falling back to mock.")
        return _mock_weather(city)


def _mock_weather(city: str) -> Dict:
    """
    Return demo weather data when API key is absent or OWM is unreachable.
    Values are plausible for a central-India summer day but are NOT real.
    The frontend shows a mock banner when status == "mock".
    """
    return {
        "status":   "mock",
        "temp":     31.0,
        "humidity": 68,
        "hourly": [
            {"rain_mm": 0.0, "rain_prob": 0.10}
            for _ in range(16)
        ],
    }


# ── Input validation helpers ──────────────────────────────────────────────────

def _require_json_field(data: Dict, field: str):
    """Return (value, None) or (None, error_message) for a required string field."""
    val = data.get(field)
    if not val or not str(val).strip():
        return None, f"Missing required field: '{field}'"
    return str(val).strip(), None


def _validate_enum(value: str, valid_set: set, field_name: str):
    """Return (normalised_value, None) or (None, error_message)."""
    normalised = value.lower().replace(" ", "_")
    if normalised not in valid_set:
        return None, (
            f"Invalid '{field_name}': '{value}'. "
            f"Allowed values: {', '.join(sorted(valid_set))}."
        )
    return normalised, None


# ── POST /api/irrigation-advice ───────────────────────────────────────────────

@advisory_bp.route("/api/irrigation-advice", methods=["POST"])
def irrigation_advice():
    """
    Return a rule-based irrigation advisory for the supplied crop, soil, and
    location.  Weather is fetched server-side from OWM.

    DISCLAIMER: advice is based on manual soil inputs, not live sensor data.
    """
    try:
        data = request.json
        if not data:
            return jsonify({
                "status":  "error",
                "message": "Request body must be JSON.",
            }), 400

        # ── Required fields ───────────────────────────────────────────────
        city, err = _require_json_field(data, "city")
        if err:
            return jsonify({"status": "error", "message": err}), 400

        crop, err = _require_json_field(data, "crop")
        if err:
            return jsonify({"status": "error", "message": err}), 400

        growth_stage_raw, err = _require_json_field(data, "growth_stage")
        if err:
            return jsonify({"status": "error", "message": err}), 400

        soil_type_raw, err = _require_json_field(data, "soil_type")
        if err:
            return jsonify({"status": "error", "message": err}), 400

        soil_moisture_raw, err = _require_json_field(data, "soil_moisture")
        if err:
            return jsonify({"status": "error", "message": err}), 400

        # ── Enum validation ───────────────────────────────────────────────
        growth_stage, err = _validate_enum(
            growth_stage_raw, _VALID_GROWTH_STAGES, "growth_stage"
        )
        if err:
            return jsonify({"status": "error", "message": err}), 400

        soil_type, err = _validate_enum(
            soil_type_raw, _VALID_SOIL_TYPES, "soil_type"
        )
        if err:
            return jsonify({"status": "error", "message": err}), 400

        soil_moisture, err = _validate_enum(
            soil_moisture_raw, _VALID_SOIL_MOISTURE, "soil_moisture"
        )
        if err:
            return jsonify({"status": "error", "message": err}), 400

        # ── Fetch weather (server-side) ───────────────────────────────────
        weather = _fetch_weather(city)

        # ── Compute irrigation advisory ───────────────────────────────────
        advisory = get_irrigation_advice(
            soil_type        = soil_type,
            soil_moisture    = soil_moisture,
            crop             = crop,
            growth_stage     = growth_stage,
            rain_forecast    = weather["hourly"],
            current_temp     = weather["temp"],
            current_humidity = weather["humidity"],
        )

        # ── Phase 6: Save history if authenticated ────────────────────────
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        from backend.models.history import save_history_entry
        try:
            verify_jwt_in_request(optional=True)
            email = get_jwt_identity()
            if email:
                db = advisory_bp.db if hasattr(advisory_bp, 'db') else None
                if db:
                    input_sum = {
                        'crop': crop,
                        'growth_stage': growth_stage,
                        'soil_type': soil_type,
                        'soil_moisture': soil_moisture,
                        'city': city
                    }
                    res_sum = {
                        'recommendation': advisory["recommendation"],
                        'water_quantity_mm': advisory["water_quantity_mm"]
                    }
                    save_history_entry(db, email, 'irrigation_advice', input_sum, res_sum, crop)
        except Exception as e:
            print(f"Failed to save irrigation history: {e}")

        return jsonify({
            "status":            weather["status"],
            "recommendation":    advisory["recommendation"],
            "water_quantity_mm": advisory["water_quantity_mm"],
            "timing":            advisory["timing"],
            "reasoning":         advisory["reasoning"],
            "water_saving_tip":  advisory["water_saving_tip"],
            "weather_used": {
                "temp":                weather["temp"],
                "humidity":            weather["humidity"],
                "rain_forecast_48h_mm": advisory["rain_forecast_48h_mm"],
                "rain_prob_max_pct":    advisory["rain_prob_max_pct"],
            },
        })

    except ValueError as e:
        # City not found from geocoding
        return jsonify({"status": "error", "message": str(e)}), 404

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "status":  "error",
            "message": f"Irrigation advisory error: {str(e)}",
        }), 500


# ── POST /api/pest-risk ───────────────────────────────────────────────────────

@advisory_bp.route("/api/pest-risk", methods=["POST"])
def pest_risk():
    """
    Return pest risk factors for the supplied crop based on current weather
    conditions fetched server-side from OWM.

    IMPORTANT: This is a rule-based lookup table, NOT an AI/ML prediction.
    The frontend MUST label results as "Common Pest Risk Factors", not
    "AI prediction".
    """
    try:
        data = request.json
        if not data:
            return jsonify({
                "status":  "error",
                "message": "Request body must be JSON.",
            }), 400

        # ── Required fields ───────────────────────────────────────────────
        city, err = _require_json_field(data, "city")
        if err:
            return jsonify({"status": "error", "message": err}), 400

        crop, err = _require_json_field(data, "crop")
        if err:
            return jsonify({"status": "error", "message": err}), 400

        # ── Validate crop is supported ────────────────────────────────────
        crop_normalised = crop.lower().strip()
        supported = get_supported_crops()
        if crop_normalised not in supported:
            return jsonify({
                "status":  "error",
                "message": (
                    f"Crop '{crop}' is not in the supported list for pest risk. "
                    f"Supported crops: {', '.join(supported)}."
                ),
            }), 400

        # ── Fetch weather (server-side) ───────────────────────────────────
        weather = _fetch_weather(city)

        # ── Assess pest risk ──────────────────────────────────────────────
        pests = assess_pest_risk(
            crop             = crop_normalised,
            current_temp     = weather["temp"],
            current_humidity = weather["humidity"],
        )

        # ── Phase 6: Save history if authenticated ────────────────────────
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        from backend.models.history import save_history_entry
        try:
            verify_jwt_in_request(optional=True)
            email = get_jwt_identity()
            if email:
                db = advisory_bp.db if hasattr(advisory_bp, 'db') else None
                if db:
                    input_sum = {
                        'crop': crop_normalised,
                        'city': city
                    }
                    res_sum = {
                        'pest_count': len(pests),
                        'high_risk_count': sum(1 for p in pests if p['risk_level'] == 'high')
                    }
                    save_history_entry(db, email, 'pest_risk', input_sum, res_sum, crop_normalised)
        except Exception as e:
            print(f"Failed to save pest history: {e}")

        return jsonify({
            "status": weather["status"],
            "crop":   crop_normalised,
            "weather_used": {
                "temp":     weather["temp"],
                "humidity": weather["humidity"],
            },
            "pests": pests,
        })

    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 404

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "status":  "error",
            "message": f"Pest risk error: {str(e)}",
        }), 500
