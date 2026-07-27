"""
backend/routes/history.py
-------------------------
Crop history timeline endpoints.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.history import get_history

history_bp = Blueprint('history', __name__)

def _get_db():
    return history_bp.db if hasattr(history_bp, 'db') else None

@history_bp.route('/api/history', methods=['GET'])
@jwt_required()
def fetch_history():
    email = get_jwt_identity()
    db = _get_db()
    
    type_filter = request.args.get('type')
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
    except ValueError:
        limit = 50
        offset = 0
        
    records = get_history(db, email, type_filter, limit, offset)
    return jsonify({'status': 'success', 'data': records})
