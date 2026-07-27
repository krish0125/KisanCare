"""
backend/routes/admin.py
-----------------------
Admin blueprint for managing farmers, schemes, notifications, and viewing stats.
All endpoints are protected by @admin_required.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from bson import ObjectId
from datetime import datetime

from backend.config import Config
from backend.utils.auth_decorators import admin_required
from backend.utils.fertilizer_reference import FERTILIZER_REQUIREMENTS
from backend.utils.pest_risk import PEST_RISK_TABLE

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ── DB accessor ───────────────────────────────────────────────────────────
db = None  # Injected in app.py

def _get_db():
    return admin_bp.db if hasattr(admin_bp, 'db') else None

# ── 1. Farmers ─────────────────────────────────────────────────────────────
@admin_bp.route('/farmers', methods=['GET'])
@jwt_required()
@admin_required()
def get_farmers():
    """List farmers (reduced view)."""
    db_ref = _get_db()
    if not db_ref:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        # Reduced view
        cursor = db_ref[Config.LOGIN_COLLECTION].find(
            {'role': 'farmer'}, 
            {'_id': 1, 'name': 1, 'email': 1, 'created_at': 1}
        )
        farmers = []
        for doc in cursor:
            doc['_id'] = str(doc['_id'])
            farmers.append(doc)
        return jsonify({'status': 'success', 'data': farmers})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/farmers/<farmer_id>', methods=['GET'])
@jwt_required()
@admin_required()
def get_farmer_detail(farmer_id):
    """Full details for a specific farmer (drill-down)."""
    db_ref = _get_db()
    if not db_ref:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        farmer = db_ref[Config.LOGIN_COLLECTION].find_one({'_id': ObjectId(farmer_id)})
        if not farmer:
            return jsonify({'error': 'Farmer not found'}), 404
        farmer['_id'] = str(farmer['_id'])
        # Never send password hash
        farmer.pop('password', None)
        return jsonify({'status': 'success', 'data': farmer})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ── 2. Schemes CRUD ────────────────────────────────────────────────────────
@admin_bp.route('/schemes', methods=['GET'])
@jwt_required()
@admin_required()
def get_schemes():
    db_ref = _get_db()
    if not db_ref:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        # Get all schemes, not just active
        schemes = list(db_ref.schemes.find({}))
        for s in schemes:
            s['_id'] = str(s['_id'])
        return jsonify({'status': 'success', 'data': schemes})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/schemes', methods=['POST'])
@jwt_required()
@admin_required()
def create_scheme():
    db_ref = _get_db()
    if not db_ref:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        data = request.json
        if not data or not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        scheme_doc = {
            'name': data.get('name'),
            'description': data.get('description', ''),
            'eligibility': data.get('eligibility', {}),
            'url': data.get('url', ''),
            'is_active': data.get('is_active', True),
            'created_at': datetime.utcnow()
        }
        db_ref.schemes.insert_one(scheme_doc)
        scheme_doc['_id'] = str(scheme_doc['_id'])
        return jsonify({'status': 'success', 'message': 'Scheme created', 'data': scheme_doc})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/schemes/<scheme_id>', methods=['PUT'])
@jwt_required()
@admin_required()
def update_scheme(scheme_id):
    db_ref = _get_db()
    if not db_ref:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        data = request.json
        update_data = {
            'name': data.get('name'),
            'description': data.get('description'),
            'eligibility': data.get('eligibility'),
            'url': data.get('url'),
            'is_active': data.get('is_active'),
            'updated_at': datetime.utcnow()
        }
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = db_ref.schemes.update_one({'_id': ObjectId(scheme_id)}, {'$set': update_data})
        if result.matched_count == 0:
            return jsonify({'error': 'Scheme not found'}), 404
            
        return jsonify({'status': 'success', 'message': 'Scheme updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/schemes/<scheme_id>', methods=['DELETE'])
@jwt_required()
@admin_required()
def delete_scheme(scheme_id):
    db_ref = _get_db()
    if not db_ref:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        result = db_ref.schemes.delete_one({'_id': ObjectId(scheme_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Scheme not found'}), 404
        return jsonify({'status': 'success', 'message': 'Scheme deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ── 3. Notifications ───────────────────────────────────────────────────────
@admin_bp.route('/notifications', methods=['GET'])
@jwt_required()
@admin_required()
def get_all_notifications():
    db_ref = _get_db()
    if not db_ref:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        logs = list(db_ref.notifications_log.find().sort('sent_at', -1).limit(100))
        for log in logs:
            log['_id'] = str(log['_id'])
        return jsonify({'status': 'success', 'data': logs})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ── 4. Stats ───────────────────────────────────────────────────────────────
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required()
def get_stats():
    db_ref = _get_db()
    if not db_ref:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        total_farmers = db_ref[Config.LOGIN_COLLECTION].count_documents({'role': 'farmer'})
        total_schemes = db_ref.schemes.count_documents({'is_active': True})
        total_notifications = db_ref.notifications_log.count_documents({})
        return jsonify({
            'status': 'success',
            'data': {
                'total_farmers': total_farmers,
                'active_schemes': total_schemes,
                'total_notifications': total_notifications
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ── 5. Reference Data (Read-Only) ──────────────────────────────────────────
@admin_bp.route('/fertilizer-reference', methods=['GET'])
@jwt_required()
@admin_required()
def get_fertilizer_reference():
    return jsonify({
        'status': 'success', 
        'editable': False, 
        'note': 'Edit via code + redeploy',
        'data': FERTILIZER_REQUIREMENTS
    })

@admin_bp.route('/pest-reference', methods=['GET'])
@jwt_required()
@admin_required()
def get_pest_reference():
    return jsonify({
        'status': 'success', 
        'editable': False, 
        'note': 'Edit via code + redeploy',
        'data': PEST_RISK_TABLE
    })
