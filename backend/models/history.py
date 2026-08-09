"""
backend/models/history.py
-------------------------
MongoDB helper functions for the 'crop_history' collection.
Stores records of all predictions, disease detections, and advisories.
"""

from datetime import datetime
from backend.config import Config
from typing import Optional

HISTORY_COL = Config.HISTORY_COLLECTION

_FALLBACK_HISTORY = [
    {
        'email': 'demo@gmail.com',
        'type': 'crop_prediction',
        'input_summary': {'N': 90, 'P': 42, 'K': 43, 'temperature': 22.5, 'humidity': 68.0, 'ph': 6.5, 'rainfall': 202.4},
        'result_summary': {'recommended_crop': 'Wheat', 'confidence': 0.94},
        'crop': 'Wheat',
        'timestamp': '2026-02-05 10:15:00'
    },
    {
        'email': 'demo@gmail.com',
        'type': 'fertilizer_calc',
        'input_summary': {'crop': 'Wheat', 'land_area_acres': 3.5, 'growth_stage': 'tillering'},
        'result_summary': {'urea_kg': 190.5, 'dap_kg': 95.2, 'mop_kg': 42.0, 'estimated_cost_inr': 3850},
        'crop': 'Wheat',
        'timestamp': '2026-02-04 14:30:00'
    },
    {
        'email': 'demo@gmail.com',
        'type': 'disease_detection',
        'input_summary': {'filename': 'tomato_leaf_sample.jpg'},
        'result_summary': {'disease': 'Tomato Early Blight (Alternaria solani)', 'confidence': 0.91, 'treatment': 'Spray Mancozeb 75% WP @ 2.5g/L water'},
        'crop': 'Tomato',
        'timestamp': '2026-02-02 11:20:00'
    },
    {
        'email': 'demo@gmail.com',
        'type': 'irrigation_advice',
        'input_summary': {'crop': 'Cotton', 'soil_type': 'Black Clay', 'temperature': 34.0, 'humidity': 45.0},
        'result_summary': {'status': 'Irrigation Required', 'water_volume_liters_per_acre': 24000, 'next_schedule': 'In 2 days'},
        'crop': 'Cotton',
        'timestamp': '2026-01-28 09:45:00'
    },
    {
        'email': 'demo@gmail.com',
        'type': 'pest_risk',
        'input_summary': {'crop': 'Mustard', 'temperature': 18.0, 'humidity': 85.0},
        'result_summary': {'risk_level': 'High (Aphids & Mustard Sawfly)', 'preventative_measure': 'Spray Imidacloprid 17.8 SL @ 0.5 ml/L'},
        'crop': 'Mustard',
        'timestamp': '2026-01-20 16:10:00'
    }
]

def save_history_entry(db, email: str, entry_type: str, input_summary: dict, result_summary: dict, crop: Optional[str] = None):
    """
    Save an activity to the user's history timeline.
    """
    doc = {
        'email': email.lower().strip(),
        'type': entry_type,
        'input_summary': input_summary,
        'result_summary': result_summary,
        'crop': crop.title() if crop else None,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    if db is None:
        _FALLBACK_HISTORY.insert(0, doc)
        return True
        
    try:
        db[HISTORY_COL].insert_one(doc)
        return True
    except Exception as e:
        print(f"❌ Error saving history entry: {e}")
        return False

def get_history(db, email: str, type_filter: Optional[str] = None, limit: int = 50, offset: int = 0):
    """
    Retrieve paginated history for a user.
    """
    email_key = email.lower().strip()
    if db is None:
        filtered = [
            h for h in _FALLBACK_HISTORY 
            if (h.get('email', '').lower() == email_key or email_key == 'demo@gmail.com')
            and (not type_filter or type_filter.lower() == 'all' or h.get('type') == type_filter)
        ]
        return filtered[offset:offset+limit]
        
    query = {'email': email_key}
    if type_filter and type_filter.lower() != 'all':
        query['type'] = type_filter
        
    try:
        cursor = db[HISTORY_COL].find(query, {'_id': 0}).sort('timestamp', -1).skip(offset).limit(limit)
        return list(cursor)
    except Exception as e:
        print(f"❌ Error fetching history: {e}")
        return []
