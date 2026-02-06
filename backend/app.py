from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
from pymongo import MongoClient
import json
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

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

from pymongo import MongoClient
import json
from datetime import datetime

# MongoDB Setup
# You can change this URI to your MongoDB Atlas connection string if using cloud
# e.g., "mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/') 
DB_NAME = 'kisancare_db'

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    print(f"Connected to MongoDB at {MONGO_URI}")
    
    # Setup Demo User
    users_col = db['users']
    if not users_col.find_one({'email': 'demo@gmail.com'}):
        # Create demo user
        demo_user = {
            'email': 'demo@gmail.com',
            'password': 'demo@123', # storing plain text as per user simple request, but usually should hash
            'name': 'Demo User'
        }
        users_col.insert_one(demo_user)
        print("✅ Demo User Created: demo@gmail.com / demo@123")

except Exception as e:
    print(f"Warning: Could not connect to MongoDB. Error: {e}")
    client = None
    db = None

@app.route('/login', methods=['POST'])
def login():
    global db, client
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        # Ensure DB is active
        if db is None:
             print("❌ Database variable is None. Reconnecting...")
             if client:
                 db = client[DB_NAME]
             else:
                 return jsonify({'status': 'error', 'message': 'Database not connected'}), 500

        print(f"🔍 Checking Login for: {email}")
        
        # Parse output
        users_collection = db['users']
        user = users_collection.find_one({'email': email})
        
        if user:
             print(f"✅ User found: {user.get('email')}")
             # Check password 
             if user.get('password') == password:
                 print("✅ Password Matched")
                 return jsonify({
                    'status': 'success', 
                    'message': 'Login Successful',
                    'user': {'name': user.get('name', 'User'), 'email': user['email']}
                 })
             else:
                 print("❌ Password Mismatch")
                 return jsonify({'status': 'error', 'message': 'Invalid Email or Password'}), 401
        else:
            print("❌ User not found")
            return jsonify({'status': 'error', 'message': 'User not found. Please Sign Up.'}), 401
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"⚠️ Exception in Login: {e}")
        return jsonify({'status': 'error', 'message': f"Server Error: {str(e)}", 'error': str(e)}), 500

@app.route('/signup', methods=['POST'])
def signup():
    global db, client
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone = data.get('phone')

        # Ensure DB is active
        if db is None:
             print("❌ Database variable is None. Reconnecting...")
             if client:
                 db = client[DB_NAME]
             else:
                 return jsonify({'status': 'error', 'message': 'Database not connected'}), 500
        
        users_col = db['users']
        
        # Check if user exists
        if users_col.find_one({'email': email}):
            return jsonify({'status': 'error', 'message': 'Email already registered! Please Login.'}), 400
            
        # Create User
        new_user = {
            'name': name,
            'email': email,
            'password': password, 
            'phone': phone,
            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        users_col.insert_one(new_user)
        print(f"✅ New User Registered: {email}")
        
        return jsonify({'status': 'success', 'message': 'Account Created Successfully!'})
        
    except Exception as e:
        print(f"Error in Signup: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Simple file based storage for login history (Fallback)
LOGIN_LOG_FILE = os.path.join(os.path.dirname(__file__), 'login_log.json')

@app.route('/login-history', methods=['GET'])
def get_login_history():
    try:
        logs = []
        
        # 1. Try Fetching from MongoDB
        if db is not None:
            try:
                collection = db['login_history']
                # Exclude _id from result or convert it to string
                cursor = collection.find({}, {'_id': 0}).sort('timestamp', -1).limit(50)
                logs = list(cursor)
                return jsonify({'status': 'success', 'source': 'mongodb', 'data': logs})
            except Exception as db_e:
                print(f"MongoDB Fetch Error: {db_e}. Falling back to file.")

        # 2. Fallback to File Storage
        if os.path.exists(LOGIN_LOG_FILE):
            try:
                with open(LOGIN_LOG_FILE, 'r') as f:
                    logs = json.load(f)
                    # Reverse to show newest first
                    logs.reverse()
            except:
                logs = []
                
        return jsonify({'status': 'success', 'source': 'file', 'data': logs})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/submit-feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.json
        entry = {
            'name': data.get('name'),
            'message': data.get('message'),
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # 1. MongoDB Save
        if db is not None:
            db['feedback'].insert_one(entry)
            print(f"Feedback saved to MongoDB: {entry}")
        else:
            print("MongoDB not connected. distinct feedback not saved.")
            
        return jsonify({'status': 'success', 'message': 'Feedback received!'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login-history', methods=['POST'])
def login_history():
    try:
        data = request.json
        entry = {
            'email': data.get('email'),
            'device': data.get('device'),
            'version': data.get('version'),
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # 1. Try Saving to MongoDB
        if db is not None:
            try:
                collection = db['login_history']
                result = collection.insert_one(entry.copy()) # Use copy to avoid mutating if we need 'entry' later
                # Convert ObjectId to string for JSON serialization if needed, though we don't return it here
                print(f"Logged to MongoDB with ID: {result.inserted_id}")
                return jsonify({'status': 'success', 'message': 'Login logged to MongoDB', 'entry': entry})
            except Exception as db_e:
                print(f"MongoDB Insert Error: {db_e}. Falling back to file.")
        
        # 2. Fallback to File Storage
        logs = []
        if os.path.exists(LOGIN_LOG_FILE):
            try:
                with open(LOGIN_LOG_FILE, 'r') as f:
                    logs = json.load(f)
            except:
                logs = []
        
        logs.append(entry)
        
        with open(LOGIN_LOG_FILE, 'w') as f:
            json.dump(logs, f, indent=4)
            
        return jsonify({'status': 'success', 'message': 'Login logged to File (Fallback)', 'entry': entry})
        
    except Exception as e:
        print(f"Error logging login: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
