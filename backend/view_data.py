from pymongo import MongoClient
import os

# 1. Connect
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/') 
client = MongoClient(MONGO_URI)
db = client['kisancare_db']

# 2. Read Data
print("Fetching Login History from Database...")
try:
    collection = db['login_history']
    documents = collection.find().sort('timestamp', -1).limit(5) # Get last 5
    
    count = collection.count_documents({})
    print(f"Total Records: {count}")
    print("-" * 30)
    
    for doc in documents:
        print(f"[{doc['timestamp']}] User: {doc.get('email', 'N/A')} | Device: {doc.get('device', 'N/A')}")
        
except Exception as e:
    print("❌ Error reading data.")
    print(f"Error: {e}")
