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

def save_history_entry(db, email: str, entry_type: str, input_summary: dict, result_summary: dict, crop: Optional[str] = None):
    """
    Save an activity to the user's history timeline.
    
    Args:
        db: MongoDB database instance
        email: User's email (JWT identity)
        entry_type: 'crop_prediction', 'disease_detection', 'irrigation_advice', 'pest_risk', 'fertilizer_calc'
        input_summary: Dictionary of the user's inputs
        result_summary: Dictionary of the system's output
        crop: Associated crop name, if applicable
    """
    if db is None:
        return False
        
    doc = {
        'email': email.lower().strip(),
        'type': entry_type,
        'input_summary': input_summary,
        'result_summary': result_summary,
        'crop': crop.title() if crop else None,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
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
    if db is None:
        return []
        
    query = {'email': email.lower().strip()}
    if type_filter and type_filter.lower() != 'all':
        query['type'] = type_filter
        
    try:
        cursor = db[HISTORY_COL].find(query, {'_id': 0}).sort('timestamp', -1).skip(offset).limit(limit)
        return list(cursor)
    except Exception as e:
        print(f"❌ Error fetching history: {e}")
        return []
