from pymongo import MongoClient
from datetime import datetime
import os

# 1. Connect to MongoDB
# Make sure your MongoDB is running!
print("Connecting to MongoDB...")
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/') 
client = MongoClient(MONGO_URI)
db = client['kisancare_db']

# 2. Define the data you want to add
# Example: Adding a fake login history entry
new_login_entry = {
    'email': 'manual_test@example.com',
    'device': 'Python Script',
    'version': '1.0',
    'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

# 3. Insert the data
try:
    collection = db['login_history']
    result = collection.insert_one(new_login_entry)
    print("✅ Data added successfully!")
    print(f"Inserted ID: {result.inserted_id}")
    print(f"Data: {new_login_entry}")
except Exception as e:
    print("❌ Failed to add data.")
    print(f"Error: {e}")
    print("Is your MongoDB server running?")
