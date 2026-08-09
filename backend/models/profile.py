"""
backend/models/profile.py
-------------------------
MongoDB helper functions for the 'profiles' collection.
Farmer Profile - personal info, farm details, preferred crops, photo.
"""

from datetime import datetime
from backend.config import Config

PROFILE_COL = Config.PROFILE_COLLECTION

_FALLBACK_PROFILES = {
    'demo@gmail.com': {
        'email': 'demo@gmail.com',
        'name': 'Ramesh Patel',
        'phone': '9876543210',
        'village': 'Kisan Nagar',
        'district': 'Anand',
        'state': 'Gujarat',
        'farm': {
            'land_area_acres': 5.0,
            'soil_type': 'Loamy',
            'irrigation_type': 'Drip Irrigation',
            'preferred_crops': ['Wheat', 'Cotton', 'Mustard', 'Soybean']
        },
        'notification_preferences': {
            'email_enabled': True,
            'weather_alerts': True,
            'pest_alerts': True,
            'market_alerts': True,
            'scheme_alerts': True
        },
        'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
}

def get_profile_by_email(db, email: str):
    """Retrieve a farmer's profile by their email address."""
    email_key = email.lower().strip()
    if db is None:
        return _FALLBACK_PROFILES.get(email_key)
    return db[PROFILE_COL].find_one({'email': email_key}, {'_id': 0})

def upsert_profile(db, email: str, profile_data: dict):
    """Update or create a farmer's profile."""
    email_key = email.lower().strip()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Safe float conversion
    try:
        land_area = float(profile_data.get('land_area_acres') or 0.0)
    except ValueError:
        land_area = 0.0
    
    # Extract known fields
    update_doc = {
        'email': email_key,
        'name': profile_data.get('name', ''),
        'phone': profile_data.get('phone', ''),
        'village': profile_data.get('village', ''),
        'district': profile_data.get('district', ''),
        'state': profile_data.get('state', ''),
        'farm': {
            'land_area_acres': land_area,
            'soil_type': profile_data.get('soil_type', ''),
            'irrigation_type': profile_data.get('irrigation_type', ''),
            'preferred_crops': profile_data.get('preferred_crops', [])
        },
        'notification_preferences': profile_data.get('notification_preferences', {
            'email_enabled': True,
            'weather_alerts': True,
            'pest_alerts': True,
            'market_alerts': True,
            'scheme_alerts': True
        }),
        'updated_at': now
    }
    
    # Preserve photo_path if not provided (photo upload is separate)
    if 'photo_path' in profile_data:
        update_doc['photo_path'] = profile_data['photo_path']
        
    if db is None:
        _FALLBACK_PROFILES[email_key] = update_doc
        return True

    try:
        db[PROFILE_COL].update_one(
            {'email': email_key},
            {
                '$set': update_doc,
                '$setOnInsert': {'created_at': now}
            },
            upsert=True
        )
        return True
    except Exception as e:
        print(f"❌ Error in upsert_profile: {e}")
        return False

def update_profile_photo(db, email: str, photo_path: str):
    """Update just the profile photo path for a farmer."""
    email_key = email.lower().strip()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if db is None:
        if email_key not in _FALLBACK_PROFILES:
            _FALLBACK_PROFILES[email_key] = {'email': email_key}
        _FALLBACK_PROFILES[email_key]['photo_path'] = photo_path
        _FALLBACK_PROFILES[email_key]['updated_at'] = now
        return True
        
    try:
        db[PROFILE_COL].update_one(
            {'email': email_key},
            {
                '$set': {'photo_path': photo_path, 'updated_at': now},
                '$setOnInsert': {'email': email_key, 'created_at': now}
            },
            upsert=True
        )
        return True
    except Exception as e:
        print(f"❌ Error in update_profile_photo: {e}")
        return False
