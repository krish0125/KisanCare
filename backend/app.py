from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for Frontend communication

# Load the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), '../ml_models/stamina_model.pkl')
model = None

def load_model():
    global model
    try:
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None

load_model()

@app.route('/')
def home():
    return "Farmer Stamina Prediction API is Running!"

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'Model not loaded. Train the model first!'}), 500
    
    try:
        data = request.json
        # Extract features
        features = [
            float(data.get('hours_worked', 0)),
            float(data.get('temperature', 25)),
            float(data.get('hydration', 0)),
            float(data.get('sleep', 8))
        ]
        
        # Predict
        prediction = model.predict([features])[0]
        
        return jsonify({
            'stamina_score': round(prediction, 2),
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
