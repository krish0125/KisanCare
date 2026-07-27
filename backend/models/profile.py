"""
backend/models/profile.py
-------------------------
MongoDB helper functions for the 'profiles' collection.
Farmer Profile - personal info, farm details, preferred crops, photo.
"""

from datetime import datetime
from backend.config import Config

PROFILE_COL = Config.PROFILE_COLLECTION

def get_profile_by_email(db, email: str):
    """Retrieve a farmer's profile by their email address."""
    if db is None:
        return None
    return db[PROFILE_COL].find_one({'email': email.lower().strip()}, {'_id': 0})

def upsert_profile(db, email: str, profile_data: dict):
    """Update or create a farmer's profile."""
    if db is None:
        return False
    
    email = email.lower().strip()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Safe float conversion
    try:
        land_area = float(profile_data.get('land_area_acres') or 0.0)
    except ValueError:
        land_area = 0.0
    
    # Extract known fields
    update_doc = {
        'email': email,
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
        
    try:
        db[PROFILE_COL].update_one(
            {'email': email},
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
    if db is None:
        return False
        
    try:
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        db[PROFILE_COL].update_one(
            {'email': email.lower().strip()},
            {
                '$set': {'photo_path': photo_path, 'updated_at': now},
                '$setOnInsert': {'email': email.lower().strip(), 'created_at': now}
            },
            upsert=True
        )
        return True
    except Exception as e:
        print(f"❌ Error in update_profile_photo: {e}")
        return False
