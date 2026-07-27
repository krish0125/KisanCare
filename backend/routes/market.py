"""
backend/routes/market.py
-------------------------
APMC market price endpoint — moved from app.py.

GET /api/apmc
  Query params:
    state     (str) — e.g. "Gujarat"
    commodity (str) — e.g. "Wheat"

Behaviour:
  1. If DATA_GOV_IN_API_KEY is configured → tries real data.gov.in API
  2. Falls back to mock data (clearly labeled as MOCK in the response)
     so the app never crashes when no API key is present.

The mock fallback is intentionally explicit:
  - 'data_source': 'MOCK — Demo data, not real mandi prices'
  - Frontend should display this label to the user.
"""

import datetime
import sys
import requests as http_requests
from flask import Blueprint, request, jsonify
from backend.config import Config
from backend.utils.market_trend import analyze_trend

market_bp = Blueprint('market', __name__)

_APMC_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"


@market_bp.route('/api/apmc', methods=['GET'])
def get_apmc_data():
    try:
        state     = (request.args.get('state') or 'Gujarat').strip()
        commodity = (request.args.get('commodity') or 'Wheat').strip()

        # ── Try real data.gov.in API ───────────────────────────────────────
        if Config.data_gov_key_is_set():
            params = {
                'api-key':            Config.DATA_GOV_IN_API_KEY,
                'format':             'json',
                'filters[state]':     state,
                'filters[commodity]': commodity,
                'limit':              10
            }
            try:
                resp = http_requests.get(_APMC_URL, params=params, timeout=8)
                if resp.status_code == 200:
                    records = resp.json().get('records', [])
                    if not records:
                        raise ValueError("No records returned (API key may be invalid or data is empty)")
                    
                    # Cache records to MongoDB
                    if hasattr(market_bp, 'db') and market_bp.db is not None:
                        today = datetime.datetime.now().strftime("%Y-%m-%d")
                        market_col = market_bp.db['market_prices']
                        for rec in records:
                            # Use modal_price (if available) for the trend analysis
                            try:
                                m_price = float(rec.get('modal_price', 0))
                            except ValueError:
                                continue
                                
                            market_col.update_one(
                                {
                                    'commodity': commodity.lower(),
                                    'state': state.lower(),
                                    'market': str(rec.get('market', '')).lower(),
                                    'date': today
                                },
                                {
                                    '$set': {
                                        'commodity': commodity.lower(),
                                        'state': state.lower(),
                                        'district': str(rec.get('district', '')).lower(),
                                        'market': str(rec.get('market', '')).lower(),
                                        'date': today,
                                        'min_price': rec.get('min_price'),
                                        'max_price': rec.get('max_price'),
                                        'modal_price': m_price,
                                        'source': 'live'
                                    }
                                },
                                upsert=True
                            )
                    
                    return jsonify({
                        'data_source': 'data.gov.in (live)',
                        'state':       state,
                        'commodity':   commodity,
                        'records':     records
                    })
                else:
                    print(f"⚠️ data.gov.in returned HTTP {resp.status_code}. Falling back to mock.")
            except Exception as api_err:
                print(f"⚠️ data.gov.in request failed: {api_err}. Falling back to mock.")

        # ── Mock fallback (clearly labeled) ───────────────────────────────
        # NOTE: These are illustrative prices only. Do NOT remove the
        # data_source label — farmers should never act on unlabeled mock data.
        print("ℹ️ DATA_GOV_IN_API_KEY not set or API failed. Returning MOCK APMC data.")

        base_map = {
            'wheat':   2200,
            'rice':    2800,
            'cotton':  6500,
            'onion':   1800,
            'tomato':  2500,
            'potato':  1600,
        }
        base = base_map.get(commodity.lower(), 5000)

        mock_records = [
            {'market': f'{state} Central APMC', 'modal_price': base + 50,  'variety': commodity},
            {'market': f'{state} North APMC',   'modal_price': base - 100, 'variety': commodity},
            {'market': f'{state} South APMC',   'modal_price': base + 150, 'variety': commodity},
            {'market': f'{state} East APMC',    'modal_price': base - 50,  'variety': commodity},
            {'market': f'{state} West APMC',    'modal_price': base + 20,  'variety': commodity},
        ]

        return jsonify({
            'data_source': 'MOCK — Demo data only. Configure DATA_GOV_IN_API_KEY for live prices.',
            'state':       state,
            'commodity':   commodity,
            'records':     mock_records
        })

    except Exception as e:
        return jsonify({'error': 'Failed to fetch APMC data', 'details': str(e)}), 500

@market_bp.route('/api/apmc/trend', methods=['GET'])
def get_market_trend():
    try:
        commodity = (request.args.get('commodity') or 'Wheat').strip().lower()
        district = (request.args.get('district') or '').strip().lower()

        if not hasattr(market_bp, 'db') or market_bp.db is None:
             return jsonify({'status': 'error', 'message': 'Database not connected'}), 500

        # Find the last 7 distinct dates for this commodity and district/state (approximate by sorting date desc)
        # To get a simple trend, we average the modal price across all markets in that district/state for each day
        market_col = market_bp.db['market_prices']
        
        # Build query
        query = {'commodity': commodity}
        if district:
            # The UI might send state or district here since we don't have separate fields in the search yet
            query['$or'] = [
                {'district': district},
                {'state': district},
                {'market': {'$regex': district, '$options': 'i'}}
            ]
            
        pipeline = [
            {'$match': query},
            {'$group': {
                '_id': '$date',
                'avg_modal': {'$avg': '$modal_price'}
            }},
            {'$sort': {'_id': -1}},
            {'$limit': 7},
            {'$sort': {'_id': 1}} # Sort oldest to newest for trend analysis
        ]
        
        print("QUERY:", query, file=sys.stderr)
        print("PIPELINE:", pipeline, file=sys.stderr)
        
        find_res = list(market_col.find(query))
        print("FIND RESULTS:", find_res, file=sys.stderr)
        
        results = list(market_col.aggregate(pipeline))
        print("RESULTS:", results, file=sys.stderr)
        
        history = [{'date': r['_id'], 'modal_price': round(r['avg_modal'], 2)} for r in results]
        
        trend_analysis = analyze_trend(history)
        
        return jsonify({
            'status': 'success',
            'days_available': len(history),
            'history': history,
            **trend_analysis
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
