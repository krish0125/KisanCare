"""
backend/models/scheme.py
------------------------
Model functions for interacting with the `schemes` collection.
"""

from typing import List, Dict, Any, Optional

def get_all_schemes(db) -> List[Dict[str, Any]]:
    """Retrieve all active schemes from the database."""
    if not db:
        return []
    
    schemes = list(db.schemes.find({"is_active": True}, {'_id': 0}))
    return schemes

def get_scheme_by_name(db, name: str) -> Optional[Dict[str, Any]]:
    """Retrieve a specific scheme by name."""
    if not db:
        return None
        
    return db.schemes.find_one({"name": name}, {'_id': 0})
