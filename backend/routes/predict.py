"""
backend/routes/predict.py
--------------------------
Crop recommendation endpoint — replaces the old stamina prediction.

POST /predict
  Input  (JSON): { N, P, K, temperature, humidity, pH, rainfall }
  Output (JSON): { status, crop, confidence, model_info }

The model (ml_models/crop_model.pkl) is a RandomForestClassifier trained on
agronomically realistic ranges for 22 common Indian crops. See
ml_models/train_crop_model.py for the full training script.

Input validation:
  - All 7 fields required
  - Numeric type enforced
  - Range checks against agronomic bounds (logged but not hard-rejected —
    out-of-range values are flagged in the response so the UI can warn the user)
"""

import os
import joblib
import numpy as np
import pandas as pd
from flask import Blueprint, request, jsonify
from backend.config import Config

predict_bp = Blueprint('predict', __name__)

# ── Model loading ──────────────────────────────────────────────────────────
_crop_model = None


def _load_crop_model():
    """Load the crop model on first request (lazy load to avoid startup failure)."""
    global _crop_model
    if _crop_model is not None:
        return _crop_model
    try:
        _crop_model = joblib.load(Config.CROP_MODEL_PATH)
        print(f"✅ Crop model loaded from {Config.CROP_MODEL_PATH}")
        return _crop_model
    except FileNotFoundError:
        print(f"❌ Crop model not found at {Config.CROP_MODEL_PATH}. "
              f"Run: python ml_models/train_crop_model.py")
        return None
    except Exception as e:
        print(f"❌ Crop model load error: {e}")
        return None


# ── Agronomic input ranges (from published literature) ─────────────────────
# These are soft-bounds used for warning the user — we still run the model
# because soil tests can produce edge values in unusual conditions.
_FEATURE_BOUNDS = {
    'N':           (0,   160),   # Nitrogen kg/ha
    'P':           (5,   150),   # Phosphorus kg/ha
    'K':           (5,   210),   # Potassium kg/ha
    'temperature': (5,   48),    # °C
    'humidity':    (10,  100),   # %
    'pH':          (3.0, 10.0),  # soil pH
    'rainfall':    (15,  310),   # mm per month
}


def _validate_features(data: dict):
    """
    Validate and extract all 7 crop features from the request body.

    Returns:
        (features_array, warnings, error_message)
        On success: features_array is a list of 7 floats, error_message is None.
        On failure: features_array is None, error_message is a string.
    """
    fields = ['N', 'P', 'K', 'temperature', 'humidity', 'pH', 'rainfall']
    values = []
    warnings = []

    for field in fields:
        raw = data.get(field)
        if raw is None:
            return None, [], f"Missing required field: '{field}'"
        try:
            val = float(raw)
        except (TypeError, ValueError):
            return None, [], f"Field '{field}' must be a number. Got: {repr(raw)}"

        lo, hi = _FEATURE_BOUNDS[field]
        if not (lo <= val <= hi):
            warnings.append(
                f"'{field}' value {val} is outside typical agronomic range "
                f"[{lo}–{hi}]. Result may be less accurate."
            )
        values.append(val)

    return values, warnings, None


# ── POST /predict ─────────────────────────────────────────────────────────
@predict_bp.route('/predict', methods=['POST'])
def predict():
    """
    Crop recommendation using a trained RandomForestClassifier.
    Returns the top predicted crop and confidence score.
    """
    try:
        data = request.json
        if not data:
            return jsonify({'status': 'error',
                            'message': 'Request body must be JSON with crop features.'}), 400

        # ── Validate inputs ────────────────────────────────────────────────
        features, warnings, err = _validate_features(data)
        if err:
            return jsonify({'status': 'error', 'message': err}), 400

        # ── Load model ────────────────────────────────────────────────────
        model = _load_crop_model()
        if model is None:
            return jsonify({
                'status': 'error',
                'message': (
                    'Crop model not available. '
                    'Please run: python ml_models/train_crop_model.py'
                )
            }), 500

        # ── Predict ───────────────────────────────────────────────────────
        # Use a DataFrame so sklearn doesn't warn about missing feature names
        _FEATURE_COLS = ['N', 'P', 'K', 'temperature', 'humidity', 'pH', 'rainfall']
        feature_df = pd.DataFrame([features], columns=_FEATURE_COLS)
        crop = model.predict(feature_df)[0]

        # Get confidence from class probability (max probability across all classes)
        probas = model.predict_proba(feature_df)[0]
        confidence = round(float(np.max(probas)) * 100, 1)  # e.g. 87.3 (%)

        response = {
            'status':     'success',
            'crop':       str(crop).title(),        # e.g. "Rice" not "rice"
            'confidence': confidence,               # e.g. 87.3
            'model_info': 'RandomForest — trained on 22 Indian crops (N,P,K,Temp,Humidity,pH,Rainfall)',
            'input_features': {
                'N': features[0], 'P': features[1], 'K': features[2],
                'temperature': features[3], 'humidity': features[4],
                'pH': features[5], 'rainfall': features[6]
            }
        }

        if warnings:
            response['warnings'] = warnings

        # Phase 6: Save history if authenticated
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        from backend.models.history import save_history_entry
        try:
            verify_jwt_in_request(optional=True)
            email = get_jwt_identity()
            if email:
                db = predict_bp.db if hasattr(predict_bp, 'db') else None
                if db:
                    res_sum = {
                        'predicted_crop': response['crop'],
                        'confidence': response['confidence']
                    }
                    save_history_entry(db, email, 'crop_prediction', response['input_features'], res_sum, response['crop'])
        except Exception as e:
            print(f"Failed to save predict history: {e}")

        return jsonify(response)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Prediction error: {str(e)}'}), 500
