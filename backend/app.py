from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
from pymongo import MongoClient
import json
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import random
import time

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

@app.route('/login-phone', methods=['POST'])
def login_phone():
    global db, client
    try:
        data = request.json
        phone = data.get('phone')
        otp = data.get('otp')
        
        # Ensure DB is active
        if db is None:
             print("❌ Database variable is None. Reconnecting...")
             if client:
                 db = client[DB_NAME]
             else:
                 return jsonify({'status': 'error', 'message': 'Database not connected'}), 500

        print(f"🔍 Checking Phone Login for: {phone}, OTP used: {otp}")
        
        users_col = db['users']
        user = users_col.find_one({'phone': phone})
        
        # Update details to store in DB
        update_data = {
            'last_login': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'last_otp': otp,
            'last_login_method': 'phone'
        }
        
        if user:
             # Update existing user
             users_col.update_one({'phone': phone}, {'$set': update_data})
             print(f"✅ User Logged In (Phone): {user.get('name')}")
             
             return jsonify({
                'status': 'success', 
                'message': 'Login Successful',
                'user': {'name': user.get('name', 'User'), 'email': user.get('email', ''), 'phone': user.get('phone')}
             })
        else:
            # Create new user
            new_user = {
                'name': 'Farmer User', 
                'phone': phone,
                'email': '', 
                'password': '', 
                'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                **update_data # Include the OTP and login method
            }
            users_col.insert_one(new_user)
            print(f"✅ New Phone User Created with OTP: {phone}")
            
            return jsonify({
                'status': 'success', 
                'message': 'Account Created & Logged In',
                'user': {'name': 'Farmer User', 'phone': phone}
            })
            
    except Exception as e:
        print(f"⚠️ Exception in Phone Login: {e}")
        return jsonify({'status': 'error', 'message': f"Server Error: {str(e)}"}), 500

@app.route('/login-history', methods=['POST'])
def login_history():
    try:
        data = request.json
        entry = {
            'email': data.get('email'),
            'phone': data.get('phone'),  # Added phone
            'otp': data.get('otp'),      # Added OTP
            'device': data.get('device'),
            'version': data.get('version'),
            'method': data.get('method', 'email'), # Added method
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # 1. Try Saving to MongoDB
        if db is not None:
            try:
                collection = db['login_history']
                result = collection.insert_one(entry.copy()) 
                print(f"Logged to MongoDB History: {entry}")
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

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Simulate AI Processing Time
        time.sleep(1)
        
        message = request.form.get('message', '').lower()
        image = request.files.get('image')
        
        reply = ""
        
        if image:
            filename = secure_filename(image.filename)
            # In a real app, we would save the image or pass it to an ML model
            # For this project, we mock the analysis
            reply = f"I have received your image '{filename}'. \n\n"
            reply += "🔍 **Visual Analysis:**\n"
            
            # Simple keyword matching for mock responses
            if "leaf" in filename.lower() or "plant" in filename.lower():
                reply += "The plant appears to be healthy, but check for small spots which might indicate early fungal infection. Ensure proper drainage."
            elif "soil" in filename.lower():
                reply += "The soil texture looks good. If it feels too dry, consider irrigating soon."
            else:
                reply += "This looks like a crop field. Based on the visual data, the crop density seems optimal."
                
            reply += "\n\n📋 **Guidelines:**\n"
            reply += "1. Monitor water levels daily.\n"
            reply += "2. Check for pests under the leaves.\n"
            reply += "3. Ensure adequate sunlight exposure."
            
        elif message:
            # ---------------------------------------------------------
            # Enhanced Rule-Based Agri-Chatbot Logic
            # ---------------------------------------------------------
            
            # 1. Weather
            if any(word in message for word in ["weather", "rain", "temperature", "climate", "forecast", "cloud"]):
                reply = "🌤️ **Weather Update:**\nBased on general data, the forecast predicts clear skies with a temperature around 25°C-30°C. \n\n⚠️ *Advisory:* It's a good time for spraying fertilizers or harvesting if crops are ready."
                
            # 2. Market Prices
            elif any(word in message for word in ["price", "market", "rate", "cost", "mandi", "sell"]):
                reply = "💰 **Market Prices (Estimated):**\n- 🌾 **Wheat:** ₹2,100/quintal\n- 🍚 **Rice:** ₹2,800/quintal\n- 🍅 **Tomato:** ₹40/kg\n- 🥔 **Potato:** ₹25/kg\n- 🧅 **Onion:** ₹35/kg\n\n*Prices may vary based on your local Mandi.*"
                
            # 3. Specific Crops Advice
            elif "wheat" in message:
                reply = "🌾 **Wheat Farming Tips:**\n- **Sowing Time:** November to December.\n- **Irrigation:** Needs 4-6 waterings at critical stages.\n- **Fertilizer:** NPK ratio 4:2:1 is generally recommended.\n- **Harvest:** When grains harden and straw turns golden."
                
            elif "rice" in message or "paddy" in message:
                reply = "🍚 **Paddy (Rice) Cultivation:**\n- **Season:** Kharif (June-July).\n- **Water:** Requires standing water (flood irrigation) during early stages.\n- **Protection:** Watch for Stem Borer and Blast disease."
                
            elif "cotton" in message:
                reply = "☁️ **Cotton Farming:**\n- **Soil:** Black soil is best.\n- **Pests:** Highly susceptible to Bollworms setup pheromone traps.\n- **Harvest:** Pick dry bolls in the morning."
                
            elif "tomato" in message:
                 reply = "🍅 **Tomato Cultivation:**\n- **Soil:** Well-drained loamy soil.\n- **Care:** Staking is needed to support the plant.\n- **Disease:** Watch for Early Blight and Leaf Curl virus."

            # 4. Irrigation / Water
            elif any(word in message for word in ["water", "irrigation", "drip", "sprinkler"]):
                reply = "💧 **Irrigation Advice:**\n- **Drip Irrigation:** Saves 50-70% water, best for vegetables/fruits.\n- **Sprinkler:** Good for wheat and pulses.\n- **Tip:** Irrigate early morning or late evening to reduce evaporation."

            # 5. Soil / Fertilizer
            elif any(word in message for word in ["soil", "fertilizer", "urea", "compost", "land", "mud"]):
                 reply = "🌱 **Soil & Nutrition:**\n- **Soil Test:** Recommended every 3 years.\n- **Organic:** Use Vermicompost or Cow Dung manure to improve soil structure.\n- **N-P-K:** Nitrogen for growth, Phosphorus for roots, Potassium for strength."

            # 6. Pests / Diseases
            elif any(word in message for word in ["pest", "bug", "insect", "worm", "disease", "virus", "fungus"]):
                 reply = "🐛 **Pest & Disease Control:**\n- **Prevention:** Crop rotation helps break pest cycles.\n- **Organic:** Neem Oil spray is effective for many soft-bodied insects.\n- **Chemical:** Consult a local expert before using heavy pesticides."
                 
            # 7. Greetings
            elif any(word in message for word in ["hello", "hi", "hey", "greetings", "namaste"]):
                 reply = "👋 **Namaste! I am your Kisan Assistant.**\n\nI can help you with:\n- 🌤️ Weather updates\n- 💰 Mandi Prices\n- 🌾 Crop Advice (Wheat, Rice, Cotton...)\n- 🐛 Pest Control\n\n*Ask me a question or upload a photo!*"
                 
            # 8. General / Fallback
            else:
                reply = "🤔 I didn't quite catch that.\n\nI am trained to answer questions about **Farming, Crops, Weather, and Prices**.\n\nTry asking:\n- *\"What is the price of Wheat?\"*\n- *\"How to grow Tomatoes?\"*\n- *\"Weather forecast today\"*"
                
        else:
            return jsonify({'error': 'No input provided'}), 400
            
        return jsonify({'status': 'success', 'reply': reply})
        
    except Exception as e:
        print(f"Chat Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
