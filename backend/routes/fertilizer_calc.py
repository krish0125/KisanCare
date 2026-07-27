"""
backend/routes/fertilizer_calc.py
---------------------------------
Fertilizer calculation endpoints.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from backend.utils.fertilizer_reference import calculate_fertilizer
from backend.models.history import save_history_entry

fertilizer_calc_bp = Blueprint('fertilizer_calc', __name__)

def _get_db():
    return fertilizer_calc_bp.db if hasattr(fertilizer_calc_bp, 'db') else None

@fertilizer_calc_bp.route('/api/fertilizer-calculate', methods=['POST'])
@jwt_required(optional=True)
def calculate_fert():
    data = request.json or {}
    
    crop = data.get('crop')
    try:
        land_area_acres = float(data.get('land_area_acres', 0))
    except (ValueError, TypeError):
        land_area_acres = 0
        
    growth_stage = data.get('growth_stage')
    soil_test = data.get('soil_test_override')
    
    if not crop or not land_area_acres or not growth_stage:
        return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        
    result = calculate_fertilizer(crop, land_area_acres, growth_stage, soil_test)
    
    # Check if authenticated and save to history
    verify_jwt_in_request(optional=True)
    email = get_jwt_identity()
    
    if email:
        db = _get_db()
        input_summary = {
            'crop': crop,
            'land_area_acres': land_area_acres,
            'growth_stage': growth_stage,
            'soil_test_provided': bool(soil_test)
        }
        result_summary = {
            'N_kg': result['N_kg'],
            'P_kg': result['P_kg'],
            'K_kg': result['K_kg'],
            'estimated_cost_inr': result['estimated_cost_inr']
        }
        save_history_entry(db, email, 'fertilizer_calc', input_summary, result_summary, crop)
        
    return jsonify({'status': 'success', 'data': result})
