"""
backend/routes/profile.py
-------------------------
Farmer profile and photo endpoints.
"""

import os
import uuid
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from backend.config import Config
from backend.models.profile import get_profile_by_email, upsert_profile, update_profile_photo
from backend.models.notification_log import get_user_notifications

profile_bp = Blueprint('profile', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _get_db():
    return profile_bp.db if hasattr(profile_bp, 'db') else None

@profile_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    email = get_jwt_identity()
    db = _get_db()
    
    profile = get_profile_by_email(db, email)
    if profile:
        return jsonify({'exists': True, 'profile': profile})
    return jsonify({'exists': False, 'profile': None})

@profile_bp.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    email = get_jwt_identity()
    db = _get_db()
    data = request.json or {}
    
    success = upsert_profile(db, email, data)
    if success:
        return jsonify({'status': 'success', 'message': 'Profile updated successfully'})
    return jsonify({'status': 'error', 'message': 'Failed to update profile'}), 500

@profile_bp.route('/api/profile/photo', methods=['POST'])
@jwt_required()
def upload_photo():
    email = get_jwt_identity()
    db = _get_db()
    
    if 'photo' not in request.files:
        return jsonify({'status': 'error', 'message': 'No photo provided'}), 400
        
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'status': 'error', 'message': 'Invalid file type. Allowed: jpg, jpeg, png.'}), 400
        
    os.makedirs(Config.UPLOAD_PROFILE_DIR, exist_ok=True)
    
    # Simple hash of email for filename to avoid collisions and obscure it
    import hashlib
    email_hash = hashlib.md5(email.encode()).hexdigest()
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{email_hash}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(Config.UPLOAD_PROFILE_DIR, filename)
    
    file.save(filepath)
    
    if os.path.getsize(filepath) > Config.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        os.remove(filepath)
        return jsonify({'status': 'error', 'message': f'File size exceeds {Config.MAX_UPLOAD_SIZE_MB}MB limit.'}), 400
        
    # Store the URL-accessible path (not the OS filepath) in MongoDB
    # so the frontend can reconstruct it as API_BASE + photo_path
    url_path = f'/api/profile/photo/{filename}'
    success = update_profile_photo(db, email, url_path)
    if success:
        # Return the same URL path so the frontend can display the photo immediately
        return jsonify({'status': 'success', 'message': 'Photo uploaded', 'photo_url': url_path})
        
    os.remove(filepath)
    return jsonify({'status': 'error', 'message': 'Failed to update profile record'}), 500

@profile_bp.route('/api/profile/photo/<filename>', methods=['GET'])
@jwt_required()
def get_photo(filename):
    """Serve the profile photo. Must be logged in, and must own the photo (based on email hash)."""
    email = get_jwt_identity()
    
    import hashlib
    email_hash = hashlib.md5(email.encode()).hexdigest()
    
    # The filename starts with the email_hash if it belongs to this user
    if not filename.startswith(email_hash):
        return jsonify({'status': 'error', 'message': 'Unauthorized access to photo'}), 403
        
    filepath = os.path.join(Config.UPLOAD_PROFILE_DIR, secure_filename(filename))
    if not os.path.exists(filepath):
        return jsonify({'status': 'error', 'message': 'Photo not found'}), 404
        
    return send_file(filepath)

@profile_bp.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    email = get_jwt_identity()
    db = _get_db()
    if not db:
        return jsonify({'status': 'error', 'message': 'Database not connected'}), 500
        
    notifications = get_user_notifications(db, email)
    return jsonify({'status': 'success', 'data': notifications})

