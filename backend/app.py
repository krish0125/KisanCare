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

# load_model() removed from top-level to prevent startup block

@app.route('/')
def home():
    return "Farmer Stamina Prediction API is Running!"

@app.route('/predict', methods=['POST'])
def predict():
    global model
    if model is None:
        load_model()

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

# ── MongoDB Setup ──────────────────────────────────────────────────────────
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME    = 'kisancare_db'
LOGIN_COL  = 'login'   # collection name as requested by user

import re

def is_valid_email(email):
    """Validate email: must have local part, @ symbol, domain with valid TLD."""
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.(com|net|org|in|co\.in|edu|gov|io|gg|biz|info|me|yahoo\.com|outlook\.com|hotmail\.com|gmail\.com|rediffmail\.com)$'
    return bool(re.match(pattern, email.lower().strip()))

def is_strong_password(password):
    """
    At least 8 characters, one uppercase, one lowercase, one digit, one special char.
    Returns (bool, error_message)
    """
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long.'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter (A-Z).'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter (a-z).'
    if not re.search(r'[0-9]', password):
        return False, 'Password must contain at least one digit (0-9).'
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-\[\]\\/+=~`]', password):
        return False, 'Password must contain at least one special character (!@#$%^&* etc.)'
    return True, ''

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    print(f"✅ Connected to MongoDB at {MONGO_URI}")

    # Seed a demo user in the 'login' collection (hashed password)
    login_col = db[LOGIN_COL]
    if not login_col.find_one({'email': 'demo@gmail.com'}):
        demo_user = {
            'name': 'Demo User',
            'email': 'demo@gmail.com',
            'password': generate_password_hash('Demo@1234'),
            'phone': '',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        login_col.insert_one(demo_user)
        print("✅ Demo User seeded in 'login' collection: demo@gmail.com / Demo@1234")

except Exception as e:
    print(f"⚠️  Warning: Could not connect to MongoDB — {e}")
    client = None
    db = None

@app.route('/login', methods=['POST'])
def login():
    global db, client
    try:
        data    = request.json
        email   = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()

        # ── Basic presence check ──────────────────────────────
        if not email or not password:
            return jsonify({'status': 'error', 'message': 'Email and password are required.'}), 400

        # ── Email format validation ───────────────────────────
        if not is_valid_email(email):
            return jsonify({'status': 'error', 'message': 'Invalid email format. Use a valid email like user@gmail.com'}), 400

        # ── Ensure DB ─────────────────────────────────────────
        if db is None:
            if client:
                db = client[DB_NAME]
            else:
                return jsonify({'status': 'error', 'message': 'Database not connected'}), 500

        print(f"🔍 Login attempt for: {email}")

        login_col = db[LOGIN_COL]
        user = login_col.find_one({'email': email})

        if not user:
            print("❌ User not found in 'login' collection")
            return jsonify({'status': 'error', 'message': 'No account found with this email. Please Sign Up first.'}), 401

        # ── Password check (hashed) ─────────────────────────
        if not check_password_hash(user['password'], password):
            print("❌ Password mismatch")
            return jsonify({'status': 'error', 'message': 'Incorrect password. Please try again.'}), 401

        print(f"✅ Login successful: {email}")
        return jsonify({
            'status': 'success',
            'message': 'Login Successful',
            'user': {'name': user.get('name', 'User'), 'email': user['email']}
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Server Error: {str(e)}'}), 500

@app.route('/signup', methods=['POST'])
def signup():
    global db, client
    try:
        data     = request.json
        name     = (data.get('name') or '').strip()
        email    = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        phone    = (data.get('phone') or '').strip()

        # ── Field presence check ──────────────────────────────
        if not name or not email or not password:
            return jsonify({'status': 'error', 'message': 'Name, email, and password are required.'}), 400

        # ── Email format validation ───────────────────────────
        if not is_valid_email(email):
            return jsonify({'status': 'error', 'message': 'Invalid email format. Use a valid email like user@gmail.com or user@yahoo.com'}), 400

        # ── Password strength validation ──────────────────────
        ok, err_msg = is_strong_password(password)
        if not ok:
            return jsonify({'status': 'error', 'message': err_msg}), 400

        # ── Ensure DB ─────────────────────────────────────────
        if db is None:
            if client:
                db = client[DB_NAME]
            else:
                return jsonify({'status': 'error', 'message': 'Database not connected'}), 500

        login_col = db[LOGIN_COL]

        # ── Duplicate check ───────────────────────────────────
        if login_col.find_one({'email': email}):
            return jsonify({'status': 'error', 'message': 'Email already registered! Please Login.'}), 400

        # ── Hash password & store ─────────────────────────────
        new_user = {
            'name': name,
            'email': email,
            'password': generate_password_hash(password),   # PBKDF2 hashed — never stored as plain text
            'phone': phone,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        login_col.insert_one(new_user)
        print(f"✅ New user registered in 'login' collection: {email}")

        return jsonify({'status': 'success', 'message': 'Account Created Successfully!'})

    except Exception as e:
        print(f"❌ Signup Error: {e}")
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

# ── Gemini AI Integration ──────────────────────────────────────────────────
# Install:  pip install google-genai
# Docs:     https://ai.google.dev/gemini-api/docs
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY')

# Language name lookup (used in system prompt)
LANG_NAMES = {
    'en': 'English', 'hi': 'Hindi', 'gu': 'Gujarati', 'mr': 'Marathi',
    'pa': 'Punjabi', 'ta': 'Tamil', 'te': 'Telugu', 'bn': 'Bengali',
    'kn': 'Kannada', 'ml': 'Malayalam', 'or': 'Odia', 'ur': 'Urdu'
}

def call_gemini(user_message, language_code='en', image_bytes=None, image_mime=None):
    """Call Google Gemini API and return the response text. Supports image input."""
    try:
        from google import genai
        from google.genai import types

        client_gemini = genai.Client(api_key=GEMINI_API_KEY)
        lang_name = LANG_NAMES.get(language_code, 'English')

        system_prompt = (
            f"You are 'KisanCare AI', an expert Indian farming, agriculture, and agronomy assistant built for Indian farmers. "
            f"The farmer is communicating in {lang_name}. "
            f"CRITICAL RULE: You MUST reply ENTIRELY in {lang_name} language only. "
            f"Use the native script of {lang_name} (e.g., Devanagari for Hindi, Gujarati script for Gujarati). "
            f"Do NOT mix languages or use English inside a non-English reply. "
            f"\n\nYour expertise covers ALL of the following farming topics:\n"
            f"1. CROPS: Wheat, Rice/Paddy, Cotton, Tomato, Potato, Onion, Sugarcane, Banana, Maize, Pulses, Oilseeds, "
            f"   Vegetables, Fruits - sowing time, variety selection, yield optimization\n"
            f"2. FERTILIZERS: Urea (46%N), DAP (18:46:0), MOP (0:0:60), NPK blends, Nano Urea, "
            f"   Zinc Sulphate, Boron, micronutrients, dose calculation per acre, timing\n"
            f"3. SOIL HEALTH: pH management, soil testing, organic matter, macro/micro nutrients, "
            f"   green manuring, soil amendments (lime, gypsum, FYM, vermicompost)\n"
            f"4. PEST & DISEASE CONTROL: IPM, bio-pesticides, neem oil, chemical pesticides (dose & safety), "
            f"   fungicides, disease identification, prevention strategies\n"
            f"5. IRRIGATION: Drip vs sprinkler vs flood, water scheduling, critical stages, PM Sinchai Yojana\n"
            f"6. WEATHER & CLIMATE: Farming advisories for heat/cold/drought/flood, spray timing in weather\n"
            f"7. MARKET & PRICES: MSP 2024-25, APMC mandi rates, eNAM platform, how to sell crops\n"
            f"8. GOVERNMENT SCHEMES: PM-Kisan (₹6000/yr), KCC loan (4% interest), PMFBY crop insurance, "
            f"   Soil Health Card, PM Sinchai Yojana, RKVY, FPO, e-Shram, Agri Infra Fund\n"
            f"9. ORGANIC FARMING: Zero Budget Natural Farming, Jeevamrit, Panchagavya, SRI method, ZBNF\n"
            f"10. SEED SELECTION: Hybrid vs OP, Bt varieties, certified seed, seed treatment, germination test\n"
            f"11. FARM MACHINERY: Tractors, power tillers, harvester, spray machines, correct usage\n"
            f"12. ANIMAL HUSBANDRY: Dairy, poultry, goat farming basics if asked\n"
            f"\nFORMATTING RULES:\n"
            f"- Use emojis to make responses friendly and visual\n"
            f"- Use **bold** for headings, bullet points (•) for lists\n"
            f"- Use tables (| col | col |) for comparisons and dose charts\n"
            f"- Keep responses 150-350 words — informative but not overwhelming\n"
            f"- For image questions: describe what you see and give specific farming advice\n"
            f"- If greeting: greet warmly in {lang_name} and list main topics you can help with\n"
            f"- NEVER talk about non-agriculture topics. Politely redirect to farming topics."
        )

        contents = []

        # If image is attached, use vision model
        if image_bytes and image_mime:
            contents = [
                types.Part.from_bytes(data=image_bytes, mime_type=image_mime),
                types.Part.from_text(text=f"{system_prompt}\n\nFarmer's question about the uploaded image: {user_message or 'Please analyze this farm/crop/pest/soil image and give advice.'}")
            ]
        else:
            contents = [f"{system_prompt}\n\nFarmer's Question: {user_message}"]

        response = client_gemini.models.generate_content(
            model='gemini-2.0-flash',
            contents=contents
        )

        return response.text.strip()

    except ImportError:
        print("⚠️ google-genai package not installed. Run: pip install google-genai")
        return None
    except Exception as e:
        print(f"⚠️ Gemini API Error: {e}")
        return None


def get_fallback_reply(message):
    """Old keyword-based fallback when Gemini is not available."""
    message = message.lower()

    if any(w in message for w in ["weather", "rain", "temperature", "climate", "forecast", "cloud"]):
        return "🌤️ **Weather Update:**\nBased on general data, the forecast predicts clear skies with a temperature around 25°C-30°C.\n\n⚠️ *Advisory:* It's a good time for spraying fertilizers or harvesting if crops are ready."

    elif any(w in message for w in ["price", "market", "rate", "cost", "mandi", "sell"]):
        return "💰 **Market Prices (Estimated):**\n- 🌾 **Wheat:** ₹2,100/quintal\n- 🍚 **Rice:** ₹2,800/quintal\n- 🍅 **Tomato:** ₹40/kg\n- 🥔 **Potato:** ₹25/kg\n- 🧅 **Onion:** ₹35/kg\n\n*Prices may vary based on your local Mandi.*"

    elif "wheat" in message:
        return "🌾 **Wheat Farming Tips:**\n- **Sowing Time:** November to December\n- **Irrigation:** 4-6 waterings at critical stages\n- **Fertilizer:** NPK ratio 4:2:1\n- **Harvest:** When grains harden and straw turns golden."

    elif "rice" in message or "paddy" in message:
        return "🍚 **Paddy (Rice):**\n- **Season:** Kharif (June-July)\n- **Water:** Flood irrigation early stages\n- **Protection:** Watch for Stem Borer and Blast disease."

    elif "cotton" in message:
        return "☁️ **Cotton Farming:**\n- **Soil:** Black soil is best\n- **Pests:** Bollworms — use pheromone traps\n- **Harvest:** Pick dry bolls in the morning."

    elif any(w in message for w in ["water", "irrigation", "drip", "sprinkler"]):
        return "💧 **Irrigation Advice:**\n- **Drip:** Saves 50-70% water, best for veggies/fruits\n- **Sprinkler:** Good for wheat/pulses\n- **Tip:** Irrigate early morning or late evening."

    elif any(w in message for w in ["soil", "fertilizer", "urea", "compost", "dap", "npk"]):
        return "🌱 **Soil & Nutrition:**\n- **Soil Test:** Every 3 years\n- **Organic:** Vermicompost or Cow Dung manure\n- **N-P-K:** Nitrogen for growth, Phosphorus for roots, Potassium for strength."

    elif any(w in message for w in ["pest", "bug", "insect", "worm", "disease", "virus", "fungus"]):
        return "🐛 **Pest Control:**\n- **Prevention:** Crop rotation breaks pest cycles\n- **Organic:** Neem Oil spray\n- **Chemical:** Consult a local expert before using."

    elif any(w in message for w in ["hello", "hi", "hey", "namaste", "help"]):
        return "👋 **Namaste! I am your Kisan Assistant.**\n\nI can help with:\n- 🌤️ Weather\n- 💰 Mandi Prices\n- 🌾 Crop Advice\n- 🐛 Pest Control\n\n*Ask me anything!*"

    else:
        return "🤔 I can help with **Farming, Crops, Weather, and Market Prices**.\n\nTry asking:\n- *\"What is the price of Wheat?\"*\n- *\"How to grow Tomatoes?\"*\n- *\"Weather forecast today\"*"


@app.route('/chat', methods=['POST'])
def chat():
    try:
        message  = (request.form.get('message') or '').strip()
        language = (request.form.get('language') or 'en').strip()
        image    = request.files.get('image')

        reply = ""
        image_bytes = None
        image_mime  = None

        # Read image bytes if provided
        if image:
            image_bytes = image.read()
            image_mime  = image.content_type or 'image/jpeg'

        if not message and not image_bytes:
            return jsonify({'error': 'No input provided'}), 400

        # ── Try Gemini AI (with vision if image provided) ─────────
        if GEMINI_API_KEY and GEMINI_API_KEY != 'YOUR_GEMINI_API_KEY':
            gemini_reply = call_gemini(message, language, image_bytes, image_mime)
            if gemini_reply:
                reply = gemini_reply
                print(f"✅ Gemini replied [{LANG_NAMES.get(language, language)}] — {'image+text' if image_bytes else 'text'}")

        # ── Fallback: keyword-based reply ─────────────────────────
        if not reply:
            print("⚠️ Gemini unavailable — using keyword fallback")
            if image_bytes:
                reply = (
                    f"🔍 **Image Received!**\n\n"
                    f"I can see your uploaded image. While detailed AI vision analysis requires the Gemini API, "
                    f"here are general tips:\n\n"
                    f"• **Leaf yellowing** → Check N/Fe deficiency or overwatering\n"
                    f"• **Brown spots** → Likely fungal — apply Mancozeb spray\n"
                    f"• **Holes in leaves** → Caterpillar/insect damage — apply Spinosad\n"
                    f"• **Wilting** → Check soil moisture and root health\n\n"
                    f"For accurate diagnosis, describe the symptoms in text!"
                )
            else:
                reply = get_fallback_reply(message)

        return jsonify({'status': 'success', 'reply': reply})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/apmc', methods=['GET'])
def get_apmc_data():
    import requests
    try:
        api_key = request.args.get('api_key', 'YOUR_API_KEY')
        state = request.args.get('state', 'Gujarat')
        commodity = request.args.get('commodity', 'Wheat')
        
        url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        params = {
            "api-key": api_key,
            "format": "json",
            "filters[state]": state,
            "filters[commodity]": commodity,
            "limit": 10
        }
        
        # Don't make external request if API key is not provided to save time/errors
        if api_key != "YOUR_API_KEY" and api_key != "":
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return jsonify(data.get('records', []))
        
        # Fallback Mock Data for College Project Viva
        print("Gov API missing key or failed. Returning mock APMC data.")
        # Vary prices slightly based on state/commodity for realism
        base_price = 2200 if commodity.lower() == 'wheat' else (2800 if commodity.lower() == 'rice' else 5000)
        mock_data = [
            {"market": f"{state} Central", "modal_price": base_price + 50},
            {"market": f"{state} North", "modal_price": base_price - 100},
            {"market": f"{state} South", "modal_price": base_price + 150},
            {"market": f"{state} East", "modal_price": base_price - 50},
            {"market": f"{state} West", "modal_price": base_price + 20}
        ]
        return jsonify(mock_data)
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch APMC data", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
