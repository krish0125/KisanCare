"""
backend/utils/weather_advisory.py
-----------------------------------
Pure, stateless functions that turn raw forecast data into farming-relevant
advisory text and alert codes. No I/O, no Flask imports — easy to unit-test.

ADVISORY THRESHOLDS
--------------------
All thresholds are defined as constants below. They are defensible starting points
from general agronomic guidance (ICAR recommendations, FAO crop calendars).
They are NOT validated against a specific crop/region combination.
Tune them here rather than scattering magic numbers through routes/weather.py.

  FROST_TEMP_C          =  4   Minimum temp below which frost risk is flagged
  HEATWAVE_TEMP_C       = 40   Maximum temp above which heatwave is flagged
  HEATWAVE_DAYS         =  2   Consecutive days above HEATWAVE_TEMP_C to trigger alert
  HEAVY_RAIN_MM_DAILY   = 50   Daily rainfall (mm) above which heavy-rain alert fires
  MODERATE_RAIN_MM      = 15   Daily rainfall threshold for "rain expected" guidance
  SPRAY_MAX_WIND_KMH    = 20   Wind speed above which spraying is not recommended
                                (drift risk + product loss)
  SPRAY_MAX_RAIN_PROB   = 0.5  Rain probability above which spraying is not recommended
  IRRIGATION_RAIN_MM    = 10   If ≥ this much rain forecast in next 48h, defer irrigation
  HIGH_HUMIDITY_PCT     = 85   High humidity — fungal disease risk increases
  LOW_HUMIDITY_PCT      = 30   Low humidity — irrigation demand increases
"""

from typing import List, Dict, Any

# ── Thresholds (single source of truth) ──────────────────────────────────────
FROST_TEMP_C          = 4     # °C
HEATWAVE_TEMP_C       = 40    # °C
HEATWAVE_DAYS         = 2     # consecutive forecast days
HEAVY_RAIN_MM_DAILY   = 50    # mm / day
MODERATE_RAIN_MM      = 15    # mm / day
SPRAY_MAX_WIND_KMH    = 20    # km/h
SPRAY_MAX_RAIN_PROB   = 0.5   # 0–1 fraction (50%)
IRRIGATION_RAIN_MM    = 10    # mm in next 48 h
HIGH_HUMIDITY_PCT     = 85    # %
LOW_HUMIDITY_PCT      = 30    # %


def _kmh_to_ms(kmh: float) -> float:
    """Convert km/h to m/s (OpenWeatherMap uses m/s)."""
    return kmh / 3.6


def build_advisory(current: Dict, daily: List[Dict], hourly: List[Dict]) -> Dict:
    """
    Build a farming advisory from structured weather data.

    Args:
        current: dict with keys: temp, humidity, wind_speed (m/s), rain_1h, conditions
        daily:   list of dicts, each with: date, temp_max, temp_min, rain_mm,
                 rain_prob, humidity, wind_speed (m/s), conditions
        hourly:  list of dicts for next 24h (same shape as daily items minus temp_min)

    Returns:
        {
          "irrigation":  str,  # "recommended" | "not_needed" | "defer_rain_coming"
          "sowing":      str,  # "good" | "caution" | "not_advised"
          "spraying":    str,  # "good" | "not_advised" (wind/rain reason)
          "alerts":      list of str,  # e.g. ["frost_warning", "heavy_rain", ...]
          "summaries":   dict of str → str  # human-readable sentences per advisory
        }
    """
    alerts = []
    rain_next_48h = 0.0

    # ── Alert: Frost ──────────────────────────────────────────────────────────
    for day in daily[:3]:  # look 3 days ahead for frost
        if day.get('temp_min', 99) < FROST_TEMP_C:
            alerts.append('frost_warning')
            break

    # ── Alert: Heatwave (N consecutive days above threshold) ─────────────────
    hot_days = 0
    for day in daily[:7]:
        if day.get('temp_max', 0) > HEATWAVE_TEMP_C:
            hot_days += 1
        else:
            hot_days = 0
        if hot_days >= HEATWAVE_DAYS:
            alerts.append('heatwave')
            break

    # ── Alert: Heavy rain ─────────────────────────────────────────────────────
    for day in daily[:3]:
        if day.get('rain_mm', 0) >= HEAVY_RAIN_MM_DAILY:
            alerts.append('heavy_rain')
            break

    # ── Alert: High humidity (fungal risk) ───────────────────────────────────
    if current.get('humidity', 0) >= HIGH_HUMIDITY_PCT:
        alerts.append('high_humidity_fungal_risk')

    # ── Alert: Storm / Thunderstorm ───────────────────────────────────────────
    conditions_lower = str(current.get('conditions', '')).lower()
    if any(w in conditions_lower for w in ['thunderstorm', 'storm']):
        alerts.append('storm_warning')

    # ── Rain in next 48 h (for irrigation / sowing / spraying) ───────────────
    for h in hourly[:48]:   # hourly list may have up to 48 entries
        rain_next_48h += h.get('rain_mm', 0)

    # ── Irrigation advisory ───────────────────────────────────────────────────
    if rain_next_48h >= IRRIGATION_RAIN_MM:
        irrigation = 'defer_rain_coming'
        irr_summary = (
            f"Defer irrigation — {rain_next_48h:.0f} mm of rain forecast in the next 48 hours. "
            "Irrigating now risks waterlogging and nutrient runoff."
        )
    elif current.get('humidity', 50) >= HIGH_HUMIDITY_PCT:
        irrigation = 'not_needed'
        irr_summary = (
            "Soil moisture appears adequate — high humidity suggests plants are not under "
            "moisture stress. Monitor before irrigating."
        )
    elif current.get('humidity', 50) <= LOW_HUMIDITY_PCT or current.get('temp', 25) > HEATWAVE_TEMP_C:
        irrigation = 'recommended'
        irr_summary = (
            "Irrigation recommended — low humidity or high temperature indicates elevated "
            "water demand. Irrigate early morning to minimise evaporation loss."
        )
    else:
        irrigation = 'normal'
        irr_summary = "Normal irrigation schedule. Follow your crop-stage water requirements."

    # ── Sowing advisory ───────────────────────────────────────────────────────
    if 'frost_warning' in alerts:
        sowing = 'not_advised'
        sow_summary = (
            "Not advised — frost risk in the next 3 days could damage germinating seedlings. "
            "Wait until minimum temperatures rise above 4°C."
        )
    elif 'heavy_rain' in alerts:
        sowing = 'caution'
        sow_summary = (
            "Use caution — heavy rainfall expected. Sowing in waterlogged soil reduces "
            "germination rates. Ensure field drainage is clear."
        )
    elif 'heatwave' in alerts:
        sowing = 'caution'
        sow_summary = (
            "Use caution — extreme heat forecast. Pre-soak seeds and sow in the evening. "
            "Provide shade or mulch to conserve soil moisture."
        )
    else:
        sowing = 'good'
        sow_summary = "Weather conditions are suitable for sowing. Ensure adequate soil moisture before sowing."

    # ── Spraying advisory ─────────────────────────────────────────────────────
    current_wind_ms = current.get('wind_speed', 0)
    current_wind_kmh = current_wind_ms * 3.6

    # Check any upcoming rain probability in next 24 h
    max_rain_prob_24h = max((h.get('rain_prob', 0) for h in hourly[:24]), default=0)

    spray_reasons = []
    if current_wind_kmh > SPRAY_MAX_WIND_KMH:
        spray_reasons.append(f"wind speed {current_wind_kmh:.0f} km/h (>{SPRAY_MAX_WIND_KMH} km/h)")
    if max_rain_prob_24h > SPRAY_MAX_RAIN_PROB:
        spray_reasons.append(f"rain probability {int(max_rain_prob_24h*100)}% in next 24h")
    if 'storm_warning' in alerts:
        spray_reasons.append("thunderstorm warning active")

    if spray_reasons:
        spraying = 'not_advised'
        spray_summary = (
            "Not advised for spraying — " + "; ".join(spray_reasons) + ". "
            "Spraying in these conditions causes product drift, poor coverage, and wash-off. "
            "Wait for calm, dry conditions."
        )
    else:
        spraying = 'good'
        spray_summary = (
            "Conditions are suitable for spraying — low wind and low rain probability. "
            "Best time: early morning (6–9 AM) or late evening (5–7 PM) for maximum efficacy."
        )

    return {
        'irrigation': irrigation,
        'sowing':     sowing,
        'spraying':   spraying,
        'alerts':     alerts,
        'summaries': {
            'irrigation': irr_summary,
            'sowing':     sow_summary,
            'spraying':   spray_summary,
        }
    }
