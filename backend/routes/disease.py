"""
backend/routes/disease.py
--------------------------
Disease Detection endpoint for KisanCare.

POST /api/disease/analyze
Accepts multipart/form-data:
  - image: file (jpg/png/webp)
  - language: str (e.g. 'en', 'hi') [optional, default='en']

Returns:
{
  "status": "success" | "mock",
  "data": {
    "disease_name": "...",
    "severity": "...",
    "confidence": "...",
    "organic_treatment": "...",
    "chemical_treatment": "..."
  }
}
"""

import os
import json
import uuid
import numpy as np
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from backend.config import Config
from backend.extensions import limiter

disease_bp = Blueprint('disease', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Lazy-loaded model to prevent crash on startup if file is missing
_MODEL = None
_CLASSES = None
_DISEASE_INFO = None

def load_model_and_classes():
    global _MODEL, _CLASSES, _DISEASE_INFO
    
    if _MODEL is not None:
        return True
        
    if not os.path.exists(Config.DISEASE_MODEL_PATH):
        return False
        
    try:
        # Lazy import to avoid crashing if tensorflow is not installed
        import tensorflow as tf
        _MODEL = tf.keras.models.load_model(Config.DISEASE_MODEL_PATH)
        
        with open(Config.DISEASE_CLASSES_PATH, 'r') as f:
            # Map index (str) to class name
            _CLASSES = json.load(f)
            
        with open(Config.DISEASE_INFO_PATH, 'r') as f:
            _DISEASE_INFO = json.load(f)
            
        return True
    except Exception as e:
        print(f"⚠️ Error loading disease model: {e}")
        return False

@disease_bp.route('/api/disease-detect', methods=['POST'])
@limiter.limit("5 per minute")
def detect_disease():
    if not load_model_and_classes():
        return jsonify({'status': 'model_not_trained', 'message': 'The disease detection model is not trained yet. Please run the training script.'})

    if 'image' not in request.files:
        return jsonify({'status': 'error', 'message': 'No image provided.'}), 400
        
    file = request.files['image']
    crop_type = request.form.get('crop_type', '').strip().lower()
    
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected image.'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'status': 'error', 'message': 'Invalid file type. Allowed: jpg, jpeg, png.'}), 400

    # Save temporarily to uploads/
    upload_dir = os.path.join(os.path.dirname(Config._BASE_DIR), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    filepath = os.path.join(upload_dir, unique_filename)
    
    file.save(filepath)
    
    # Check file size after saving
    if os.path.getsize(filepath) > Config.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        os.remove(filepath)
        return jsonify({'status': 'error', 'message': f'File size exceeds {Config.MAX_UPLOAD_SIZE_MB}MB limit.'}), 400

    try:
        from PIL import Image
        from tensorflow.keras.preprocessing.image import img_to_array
        
        # Load and preprocess
        img = Image.open(filepath).convert('RGB')
        img = img.resize((224, 224))
        img_array = img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0) / 255.0
        
        # Predict
        predictions = _MODEL.predict(img_array)[0]
        max_index = np.argmax(predictions)
        confidence = float(predictions[max_index])
        
        # _CLASSES maps string index to class name, e.g. "0": "Tomato___Early_blight"
        predicted_class = _CLASSES.get(str(max_index), "Unknown")
        
        # Delete file after processing unless saveToHistory is passed
        save_to_history = request.form.get('saveToHistory', 'false').lower() == 'true'
        
        # We always remove the image for storage reasons in this phase
        if os.path.exists(filepath):
            os.remove(filepath)
            
        # Get info
        info = _DISEASE_INFO.get(predicted_class) or _DISEASE_INFO.get('default', {})
            
        # Confidence check
        if confidence < Config.DISEASE_CONFIDENCE_THRESHOLD:
            return jsonify({
                'status': 'success',
                'low_confidence': True,
                'message': 'Not confident enough to diagnose — try a clearer, closer photo of the affected leaf.',
                'confidence': confidence
            })
            
        # Crop mismatch check (e.g. Tomato___Early_blight -> crop species is 'tomato')
        predicted_species = predicted_class.split('___')[0].lower()
        if crop_type and crop_type != 'unknown':
            if predicted_species != crop_type:
                return jsonify({
                    'status': 'error',
                    'message': f"Crop mismatch: The image looks like {predicted_species}, but you selected {crop_type}. Please re-check input."
                })
                
        if save_to_history:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            from backend.models.history import save_history_entry
            try:
                verify_jwt_in_request(optional=True)
                email = get_jwt_identity()
                if email:
                    db = disease_bp.db if hasattr(disease_bp, 'db') else None
                    if db:
                        input_sum = {'crop_type': crop_type}
                        res_sum = {
                            'disease': predicted_class,
                            'confidence': confidence,
                            'organic_treatment': info.get('organic_treatment', 'Unknown')
                        }
                        save_history_entry(db, email, 'disease_detection', input_sum, res_sum, crop_type)
            except Exception as e:
                print(f"Failed to save disease history: {e}")
                
        return jsonify({
            'status': 'success',
            'disease': predicted_class,
            'confidence': confidence,
            'cause': info.get('cause', 'Unknown'),
            'prevention': info.get('prevention', 'Unknown'),
            'organic_treatment': info.get('organic_treatment', 'Unknown'),
            'chemical_treatment': info.get('chemical_treatment', 'Unknown'),
            'fertilizer_suggestion': info.get('fertilizer_suggestion', 'Unknown')
        })

    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500
