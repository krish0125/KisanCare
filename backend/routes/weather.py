"""
backend/routes/weather.py
--------------------------
Weather intelligence endpoint for KisanCare.

GET /api/weather?city=<name>
GET /api/weather?lat=<float>&lon=<float>

Response (both live and mock share the same shape):
  {
    "status":   "success" | "mock",
    "data_note": str,        # present only when status == "mock"
    "location": str,
    "country":  str,
    "current": {
      "temp":        float,   # °C
      "feels_like":  float,   # °C
      "temp_min":    float,
      "temp_max":    float,
      "humidity":    int,     # %
      "wind_speed":  float,   # m/s
      "wind_deg":    int,     # degrees
      "conditions":  str,     # e.g. "Clear", "Rain"
      "description": str,     # e.g. "light rain"
      "icon":        str,     # OWM icon code, e.g. "10d"
      "rain_1h":     float,   # mm in last hour
      "sunrise":     str,     # "HH:MM"
      "sunset":      str,     # "HH:MM"
      "uv_index":    float | null
    },
    "hourly": [              # next 24 h, one entry per 3-hour slot (OWM free tier)
      { "time": "HH:MM", "temp": float, "humidity": int,
        "conditions": str, "icon": str,
        "rain_mm": float, "rain_prob": float, "wind_speed": float }
    ],
    "daily": [               # 7 days (derived from 5-day/3h forecast)
      { "date": "Weekday DD Mon", "temp_max": float, "temp_min": float,
        "conditions": str, "icon": str, "rain_mm": float,
        "rain_prob": float, "humidity": int, "wind_speed": float }
    ],
    "advisory": {            # farming guidance from weather_advisory.py
      "irrigation": str,
      "sowing":     str,
      "spraying":   str,
      "alerts":     [str],
      "summaries":  { "irrigation": str, "sowing": str, "spraying": str }
    }
  }

Live data flow:
  1. Geocode city name → lat/lon using OWM geocoding API (if city given)
  2. Call OWM /weather (current) and /forecast (5-day 3h intervals)
  3. Parse into the standard shape above
  4. Run weather_advisory.build_advisory()
  5. Return JSON

Mock fallback (OPENWEATHER_API_KEY unset or API error):
  - Returns status="mock" with clearly synthetic data for Vadodara
  - UI should show a visible banner when status == "mock"
"""

from datetime import datetime, timezone
import requests as http_req
from flask import Blueprint, request, jsonify
from backend.config import Config
from backend.utils.weather_advisory import build_advisory

weather_bp = Blueprint('weather', __name__)

_OWM_BASE    = 'https://api.openweathermap.org'
_OWM_CURRENT = f'{_OWM_BASE}/data/2.5/weather'
_OWM_FORECAST= f'{_OWM_BASE}/data/2.5/forecast'
_OWM_GEO     = f'{_OWM_BASE}/geo/1.0/direct'


# ── Parsers ────────────────────────────────────────────────────────────────

def _fmt_time(unix_ts: int, tz_offset: int = 0) -> str:
    """Format a Unix timestamp as HH:MM adjusted for local UTC offset."""
    dt = datetime.fromtimestamp(unix_ts + tz_offset, tz=timezone.utc)
    return dt.strftime('%H:%M')


def _parse_current(data: dict, tz_offset: int = 0) -> dict:
    main     = data.get('main', {})
    wind     = data.get('wind', {})
    weather  = data.get('weather', [{}])[0]
    rain     = data.get('rain', {})
    sys_data = data.get('sys', {})
    return {
        'temp':        round(main.get('temp', 0),        1),
        'feels_like':  round(main.get('feels_like', 0),  1),
        'temp_min':    round(main.get('temp_min', 0),    1),
        'temp_max':    round(main.get('temp_max', 0),    1),
        'humidity':    main.get('humidity', 0),
        'wind_speed':  round(wind.get('speed', 0),       1),
        'wind_deg':    wind.get('deg', 0),
        'conditions':  weather.get('main', ''),
        'description': weather.get('description', ''),
        'icon':        weather.get('icon', '01d'),
        'rain_1h':     rain.get('1h', 0.0),
        'sunrise':     _fmt_time(sys_data.get('sunrise', 0), tz_offset),
        'sunset':      _fmt_time(sys_data.get('sunset',  0), tz_offset),
        'uv_index':    None,   # requires One Call API (paid); left for future
    }


def _parse_forecast_list(forecast_list: list, tz_offset: int = 0):
    """
    Parse OWM /forecast items (3-hour slots) into:
      - hourly:  first 8 entries = next 24 h
      - daily:   one representative entry per day (noon slot or first of day)
    """
    hourly = []
    daily_map: dict = {}   # date_str → list of 3h slots

    for item in forecast_list:
        dt_txt  = item.get('dt_txt', '')        # "2024-07-25 12:00:00"
        date_str = dt_txt[:10]                  # "2024-07-25"
        time_str = dt_txt[11:16]               # "12:00"

        main     = item.get('main', {})
        wind     = item.get('wind', {})
        weather  = item.get('weather', [{}])[0]
        rain     = item.get('rain', {})
        pop      = item.get('pop', 0)           # probability of precipitation 0-1

        slot = {
            'time':       time_str,
            'date':       date_str,
            'temp':       round(main.get('temp', 0), 1),
            'temp_min':   round(main.get('temp_min', 0), 1),
            'temp_max':   round(main.get('temp_max', 0), 1),
            'humidity':   main.get('humidity', 0),
            'conditions': weather.get('main', ''),
            'description':weather.get('description', ''),
            'icon':       weather.get('icon', '01d'),
            'rain_mm':    round(rain.get('3h', 0.0), 1),
            'rain_prob':  round(pop, 2),
            'wind_speed': round(wind.get('speed', 0), 1),
        }

        # Hourly: first 8 slots = 24 h
        if len(hourly) < 8:
            hourly.append(slot)

        # Daily: group by date
        if date_str not in daily_map:
            daily_map[date_str] = []
        daily_map[date_str].append(slot)

    # Build daily summary: max temp, min temp, dominant conditions, total rain
    daily = []
    for date_str in sorted(daily_map.keys())[:7]:
        slots  = daily_map[date_str]
        dt_obj = datetime.strptime(date_str, '%Y-%m-%d')
        label  = dt_obj.strftime('%a %d %b')   # e.g. "Thu 25 Jul"

        temps      = [s['temp'] for s in slots]
        rain_probs = [s['rain_prob'] for s in slots]
        # Use the noon slot (12:00) or last slot for conditions/icon
        rep = next((s for s in slots if s['time'] == '12:00'), slots[-1])

        daily.append({
            'date':       label,
            'temp_max':   round(max(temps), 1),
            'temp_min':   round(min(temps), 1),
            'conditions': rep['conditions'],
            'description':rep['description'],
            'icon':       rep['icon'],
            'rain_mm':    round(sum(s['rain_mm'] for s in slots), 1),
            'rain_prob':  round(max(rain_probs), 2),
            'humidity':   round(sum(s['humidity'] for s in slots) / len(slots)),
            'wind_speed': round(max(s['wind_speed'] for s in slots), 1),
        })

    return hourly, daily


# ── Mock data (clearly synthetic, used when API key is absent) ────────────

def _mock_response(city: str) -> dict:
    """
    Return a clearly-labeled mock weather response.
    Values are plausible for a central-India summer day but are NOT real.
    The frontend must display a 'Demo data' banner when status == 'mock'.
    """
    mock_current = {
        'temp': 31.0, 'feels_like': 34.0, 'temp_min': 27.0, 'temp_max': 36.0,
        'humidity': 68, 'wind_speed': 3.5, 'wind_deg': 230,
        'conditions': 'Clouds', 'description': 'scattered clouds',
        'icon': '03d', 'rain_1h': 0.0,
        'sunrise': '06:12', 'sunset': '19:28', 'uv_index': None,
    }
    mock_hourly = [
        {'time': f'{h:02d}:00', 'temp': 29.0 + h*0.3, 'humidity': 65,
         'conditions': 'Clouds', 'icon': '03d', 'rain_mm': 0.0,
         'rain_prob': 0.1, 'wind_speed': 3.0}
        for h in range(0, 24, 3)
    ]
    mock_daily = [
        {'date': f'Day {i+1}', 'temp_max': 36.0, 'temp_min': 26.0,
         'conditions': 'Clear', 'description': 'clear sky',
         'icon': '01d', 'rain_mm': 0.0, 'rain_prob': 0.05,
         'humidity': 60, 'wind_speed': 3.0}
        for i in range(7)
    ]
    mock_advisory = build_advisory(mock_current, mock_daily, mock_hourly)

    return {
        'status':    'mock',
        'data_note': (
            'DEMO DATA — not real weather. '
            'Set OPENWEATHER_API_KEY in backend/.env for live forecasts.'
        ),
        'location': city or 'Demo City',
        'country':  'IN',
        'current':  mock_current,
        'hourly':   mock_hourly,
        'daily':    mock_daily,
        'advisory': mock_advisory,
    }


# ── GET /api/weather ──────────────────────────────────────────────────────

@weather_bp.route('/api/weather', methods=['GET'])
def get_weather():
    """
    Fetch current + 7-day forecast and farming advisory for a location.
    Accepts ?city=<name> or ?lat=<float>&lon=<float>.
    Falls back to mock data if OPENWEATHER_API_KEY is not configured.
    """
    try:
        city = (request.args.get('city') or '').strip()
        lat  = request.args.get('lat')
        lon  = request.args.get('lon')

        # Must supply city OR lat+lon
        if not city and not (lat and lon):
            return jsonify({
                'status':  'error',
                'message': "Provide 'city' or both 'lat' and 'lon' query parameters."
            }), 400

        api_key = Config.OPENWEATHER_API_KEY

        # ── Mock fallback if key absent ───────────────────────────────────
        if not api_key:
            print("INFO: OPENWEATHER_API_KEY not set — returning mock weather data.")
            return jsonify(_mock_response(city or f'{lat},{lon}'))

        # ── Resolve city → lat/lon ────────────────────────────────────────
        if city and not (lat and lon):
            geo_resp = http_req.get(
                _OWM_GEO,
                params={'q': city, 'limit': 1, 'appid': api_key},
                timeout=8
            )
            geo_resp.raise_for_status()
            geo_data = geo_resp.json()
            if not geo_data:
                return jsonify({'status': 'error',
                                'message': f"City '{city}' not found."}), 404
            lat = geo_data[0]['lat']
            lon = geo_data[0]['lon']
            city = geo_data[0].get('name', city)  # use normalised city name

        lat, lon = float(lat), float(lon)

        # ── Current weather ───────────────────────────────────────────────
        cur_resp = http_req.get(
            _OWM_CURRENT,
            params={'lat': lat, 'lon': lon, 'appid': api_key,
                    'units': 'metric', 'lang': 'en'},
            timeout=8
        )
        cur_resp.raise_for_status()
        cur_data   = cur_resp.json()
        tz_offset  = cur_data.get('timezone', 0)   # seconds offset from UTC
        location   = cur_data.get('name', city)
        country    = cur_data.get('sys', {}).get('country', '')
        current    = _parse_current(cur_data, tz_offset)

        # ── 5-day / 3-hour forecast ───────────────────────────────────────
        fcst_resp = http_req.get(
            _OWM_FORECAST,
            params={'lat': lat, 'lon': lon, 'appid': api_key,
                    'units': 'metric', 'lang': 'en'},
            timeout=8
        )
        fcst_resp.raise_for_status()
        fcst_data  = fcst_resp.json()
        hourly, daily = _parse_forecast_list(fcst_data.get('list', []), tz_offset)

        # ── Advisory ──────────────────────────────────────────────────────
        advisory = build_advisory(current, daily, hourly)

        return jsonify({
            'status':   'success',
            'location': location,
            'country':  country,
            'current':  current,
            'hourly':   hourly,
            'daily':    daily,
            'advisory': advisory,
        })

    except http_req.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response else 500
        # 401 = bad key, 404 = city not found
        if status_code == 401:
            print("ERROR: Invalid OPENWEATHER_API_KEY — falling back to mock.")
            return jsonify(_mock_response(request.args.get('city', '')))
        return jsonify({'status': 'error',
                        'message': f'Weather API error: {str(e)}'}), 502

    except http_req.exceptions.ConnectionError:
        print("ERROR: Could not reach OpenWeatherMap — falling back to mock.")
        return jsonify(_mock_response(request.args.get('city', '')))

    except http_req.exceptions.Timeout:
        print("ERROR: OpenWeatherMap request timed out — falling back to mock.")
        return jsonify(_mock_response(request.args.get('city', '')))

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error',
                        'message': f'Weather server error: {str(e)}'}), 500
