"""
backend/utils/irrigation_advisory.py
--------------------------------------
Pure, stateless functions that turn farmer-supplied soil inputs and live weather
forecast data into an irrigation recommendation.  No I/O, no Flask imports —
easy to unit-test.

APPROACH
---------
This is a rule-based advisory, NOT a trained ML model.  Rules are derived from
general ICAR / FAO crop-water guidance.  All thresholds are defined as named
constants below — tune them here, not inside the logic functions.

INPUT PARAMETERS
-----------------
  soil_type    : "sandy" | "loamy" | "clay" | "black_cotton" | "red_laterite"
  soil_moisture: "dry" | "moist" | "wet"   (farmer's visual estimate)
  crop         : str  (one of the 8 supported crops)
  growth_stage : "sowing" | "vegetative" | "flowering" | "maturity"
  rain_forecast: list of hourly dicts [{rain_mm, rain_prob}, ...]  (next 48 h)
  current_temp : float  (°C)
  current_humidity: int (%)

OUTPUT KEYS
------------
  recommendation    : "irrigate_now" | "irrigate_soon" | "defer_rain_coming" | "sufficient"
  water_quantity_mm : int   — estimated mm of water to apply per irrigation event
  timing            : str   — best time of day to irrigate
  reasoning         : str   — human-readable explanation of why this recommendation was made
  water_saving_tip  : str   — one actionable water-conservation tip

DISCLAIMER (always shown in UI)
---------------------------------
Based on your inputs — not live soil sensor data.

# TODO: Phase 6 — accept soil_moisture pre-filled from saved crop history sensor data
"""

from typing import List, Dict, Any

# ── Thresholds (single source of truth) ──────────────────────────────────────

# Skip irrigation if ≥ this much rain (mm) is forecast in the next 48 h
SKIP_IRRIGATION_RAIN_MM_48H: float = 8.0

# Skip irrigation if rain probability in next 24 h exceeds this (0–1 fraction)
SKIP_IRRIGATION_RAIN_PROB:   float = 0.60

# High temperature threshold (°C) — bumps urgency of irrigation
HIGH_TEMP_C: float = 38.0

# Low humidity threshold (%) — indicates elevated evapotranspiration demand
LOW_HUMIDITY_PCT: int = 40

# ── Base water quantities per growth stage (mm/event) ────────────────────────
# Derived from FAO-56 crop evapotranspiration tables (simplified for Indian crops).
# These are the amounts for a loamy soil / average temperature.
# Multiplied by soil-type and temperature modifiers below.
STAGE_BASE_WATER_MM: Dict[str, int] = {
    "sowing":     25,   # light irrigation to establish germination
    "vegetative": 35,   # moderate — leaf area expansion
    "flowering":  45,   # highest demand — reproductive stage is most sensitive
    "maturity":   20,   # reduce — crop nearing harvest, excess water harmful
}

# ── Soil-type water-retention multipliers ─────────────────────────────────────
# Sandy soils retain less → need more frequent, smaller applications.
# Clay soils retain more → larger, less-frequent applications.
SOIL_TYPE_WATER_FACTOR: Dict[str, float] = {
    "sandy":        1.25,   # drains fast — apply more per event
    "loamy":        1.00,   # baseline
    "clay":         0.80,   # retains well — apply less per event
    "black_cotton": 0.75,   # high swell/shrink clay — easily waterlogged
    "red_laterite": 1.15,   # low organic matter, moderate drainage
}

# ── Temperature-demand multiplier ─────────────────────────────────────────────
# When temperature is high, evapotranspiration increases — raise quantity slightly.
TEMP_DEMAND_FACTOR_HIGH: float = 1.20   # applied when temp > HIGH_TEMP_C
TEMP_DEMAND_FACTOR_NORMAL: float = 1.00

# ── Timing message lookup (constant, no logic needed) ────────────────────────
TIMING_MESSAGE: str = (
    "Irrigate in the early morning (5–8 AM) or late evening (6–8 PM) to "
    "minimise evaporation loss. Avoid mid-day irrigation when temperatures "
    "are highest."
)

# ── Water-saving tips by soil type ───────────────────────────────────────────
WATER_SAVING_TIPS: Dict[str, str] = {
    "sandy": (
        "Sandy soil drains quickly — consider drip irrigation or frequent "
        "light applications rather than one heavy flood. Mulching with straw "
        "can reduce evaporation loss by up to 30%."
    ),
    "loamy": (
        "Loamy soils are efficient for furrow or drip irrigation. Check soil "
        "moisture 5 cm below the surface before irrigating — if it clumps, "
        "it is moist enough."
    ),
    "clay": (
        "Clay soils retain water well but are prone to waterlogging. Irrigate "
        "slowly and avoid standing water. Ridged planting beds improve "
        "drainage and root aeration."
    ),
    "black_cotton": (
        "Black cotton (Vertisol) soil swells when wet and cracks when dry — "
        "avoid over-irrigation. Raised-bed or furrow irrigation is more "
        "suitable than flood irrigation."
    ),
    "red_laterite": (
        "Red laterite soils have low water-holding capacity. Organic matter "
        "(compost or green manure) added annually improves retention "
        "significantly. Drip irrigation maximises efficiency."
    ),
}


# ── Helper: compute 48-h rain totals from hourly forecast ────────────────────

def _rain_next_48h(rain_forecast: List[Dict]) -> tuple:
    """
    Compute total rain (mm) and max rain probability over the next 48 h
    from a list of hourly forecast dicts, each with optional 'rain_mm' and
    'rain_prob' keys.

    Returns:
        (total_rain_mm: float, max_rain_prob: float)
    """
    total_mm = 0.0
    max_prob = 0.0
    for slot in rain_forecast[:48]:
        total_mm += float(slot.get("rain_mm", 0) or 0)
        prob = float(slot.get("rain_prob", 0) or 0)
        if prob > max_prob:
            max_prob = prob
    return round(total_mm, 1), round(max_prob, 2)


# ── Main advisory function ────────────────────────────────────────────────────

def get_irrigation_advice(
    soil_type:        str,
    soil_moisture:    str,
    crop:             str,
    growth_stage:     str,
    rain_forecast:    List[Dict],
    current_temp:     float,
    current_humidity: int,
) -> Dict[str, Any]:
    """
    Compute an irrigation recommendation from manual soil inputs and live
    weather forecast data.

    Args:
        soil_type        : one of SOIL_TYPE_WATER_FACTOR keys (case-insensitive)
        soil_moisture    : "dry" | "moist" | "wet"
        crop             : crop name (informational only — water amounts are
                           stage-based in this phase; crop-specific ETc values
                           are a Phase 6 enhancement)
        growth_stage     : "sowing" | "vegetative" | "flowering" | "maturity"
        rain_forecast    : list of hourly dicts with 'rain_mm' and 'rain_prob'
        current_temp     : current temperature in °C
        current_humidity : current relative humidity (%)

    Returns:
        dict with keys: recommendation, water_quantity_mm, timing, reasoning,
                        water_saving_tip, rain_forecast_48h_mm, rain_prob_max
    """
    # Normalise inputs
    soil_type     = (soil_type or "loamy").lower().replace(" ", "_")
    soil_moisture = (soil_moisture or "moist").lower()
    growth_stage  = (growth_stage or "vegetative").lower()
    current_temp  = float(current_temp or 25)
    current_humidity = int(current_humidity or 60)

    # Fall back to loamy if unrecognised soil type
    if soil_type not in SOIL_TYPE_WATER_FACTOR:
        soil_type = "loamy"

    # Fall back to vegetative if unrecognised growth stage
    if growth_stage not in STAGE_BASE_WATER_MM:
        growth_stage = "vegetative"

    # ── Step 1: Check rain forecast ───────────────────────────────────────
    total_rain_mm, max_rain_prob = _rain_next_48h(rain_forecast)

    rain_is_coming = (
        total_rain_mm >= SKIP_IRRIGATION_RAIN_MM_48H
        or max_rain_prob >= SKIP_IRRIGATION_RAIN_PROB
    )

    # ── Step 2: Determine recommendation ─────────────────────────────────
    high_temp   = current_temp > HIGH_TEMP_C
    low_humidity = current_humidity < LOW_HUMIDITY_PCT

    if rain_is_coming:
        recommendation = "defer_rain_coming"
        reasoning = (
            f"Defer irrigation — {total_rain_mm:.0f} mm of rain is forecast "
            f"in the next 48 hours (max probability {int(max_rain_prob * 100)}%). "
            "Irrigating now risks waterlogging, nutrient runoff, and wasted "
            "water. Reassess after the rain passes."
        )

    elif soil_moisture == "wet":
        recommendation = "sufficient"
        reasoning = (
            "Soil is currently wet. No irrigation needed — adding more water "
            "risks waterlogging, root suffocation, and disease spread. Allow "
            "the field to dry to a moist state before the next application."
        )

    elif soil_moisture == "moist" and not high_temp and not low_humidity:
        recommendation = "sufficient"
        reasoning = (
            "Soil moisture is adequate and weather conditions are moderate. "
            "Monitor the crop over the next 1–2 days and irrigate when the "
            "topsoil (0–5 cm) begins to dry."
        )

    elif soil_moisture == "moist" and (high_temp or low_humidity):
        recommendation = "irrigate_soon"
        reasoning = (
            "Soil is currently moist, but "
            + ("high temperature" if high_temp else "")
            + (" and " if high_temp and low_humidity else "")
            + ("low humidity" if low_humidity else "")
            + f" ({current_temp:.0f}°C / {current_humidity}% RH) is increasing "
            "evapotranspiration demand. Plan irrigation within the next 12–18 hours "
            "to avoid moisture stress, especially during the "
            f"{growth_stage} stage."
        )

    else:
        # soil_moisture == "dry" OR high stress conditions
        recommendation = "irrigate_now"
        if soil_moisture == "dry":
            reasoning = (
                f"Soil is dry — immediate irrigation is required. The {growth_stage} "
                "stage has high water demand and moisture stress at this stage can "
                "significantly reduce yield."
            )
            if high_temp:
                reasoning += (
                    f" Current temperature ({current_temp:.0f}°C) further increases "
                    "evapotranspiration. Irrigate as early as possible."
                )
        else:
            reasoning = (
                f"High temperature ({current_temp:.0f}°C) and low humidity "
                f"({current_humidity}% RH) indicate high water demand. Irrigate "
                "promptly to avoid heat and moisture stress."
            )

    # ── Step 3: Compute water quantity (only relevant for irrigate_* cases) ──
    base_mm      = STAGE_BASE_WATER_MM.get(growth_stage, 35)
    soil_factor  = SOIL_TYPE_WATER_FACTOR.get(soil_type, 1.0)
    temp_factor  = TEMP_DEMAND_FACTOR_HIGH if high_temp else TEMP_DEMAND_FACTOR_NORMAL
    water_qty_mm = round(base_mm * soil_factor * temp_factor)

    # For defer/sufficient cases, return 0 quantity — no irrigation planned
    if recommendation in ("defer_rain_coming", "sufficient"):
        water_qty_mm = 0

    return {
        "recommendation":     recommendation,
        "water_quantity_mm":  water_qty_mm,
        "timing":             TIMING_MESSAGE if water_qty_mm > 0 else "No irrigation planned.",
        "reasoning":          reasoning,
        "water_saving_tip":   WATER_SAVING_TIPS.get(soil_type, WATER_SAVING_TIPS["loamy"]),
        "rain_forecast_48h_mm": total_rain_mm,
        "rain_prob_max_pct":    int(max_rain_prob * 100),
    }
