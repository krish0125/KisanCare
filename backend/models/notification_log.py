"""
backend/models/notification_log.py
----------------------------------
Model functions for interacting with the `notifications_log` collection.
"""

from typing import List, Dict, Any
from datetime import datetime

def log_notification(db, user_id: str, channel: str, trigger_type: str, message: str, status: str) -> bool:
    """Log a notification attempt to the database."""
    if not db:
        return False
        
    log_entry = {
        "user_id": user_id,
        "channel": channel,
        "trigger_type": trigger_type,
        "message": message,
        "status": status,
        "sent_at": datetime.utcnow()
    }
    
    try:
        db.notifications_log.insert_one(log_entry)
        return True
    except Exception as e:
        print(f"Error logging notification: {e}")
        return False

def get_user_notifications(db, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve the recent notification log for a specific user."""
    if not db:
        return []
        
    try:
        logs = list(db.notifications_log.find(
            {"user_id": user_id},
            {'_id': 0}
        ).sort("sent_at", -1).limit(limit))
        return logs
    except Exception as e:
        print(f"Error retrieving notifications: {e}")
        return []
