"""
backend/routes/schemes.py
-------------------------
Government Schemes endpoints.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.scheme import get_all_schemes
from backend.utils.eligibility_matcher import check_eligibility

schemes_bp = Blueprint('schemes', __name__)

def _get_db():
    return schemes_bp.db if hasattr(schemes_bp, 'db') else None

@schemes_bp.route('/api/schemes', methods=['GET'])
def list_schemes():
    """Get all active schemes (public)."""
    db = _get_db()
    if not db:
        return jsonify({'status': 'error', 'message': 'Database not connected'}), 500
        
    schemes = get_all_schemes(db)
    return jsonify({'status': 'success', 'data': schemes})

@schemes_bp.route('/api/schemes/eligible', methods=['GET'])
@jwt_required()
def list_eligible_schemes():
    """Get all active schemes, with eligible ones flagged for the logged-in user."""
    db = _get_db()
    if not db:
        return jsonify({'status': 'error', 'message': 'Database not connected'}), 500
        
    email = get_jwt_identity()
    
    # Get user profile
    profile = db.profiles.find_one({"email": email})
    
    schemes = get_all_schemes(db)
    
    if profile:
        for scheme in schemes:
            scheme['you_may_be_eligible'] = check_eligibility(profile, scheme)
            
    return jsonify({'status': 'success', 'data': schemes})
