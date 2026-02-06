from pymongo import MongoClient
import os

try:
    MONGO_URI = 'mongodb://localhost:27017/'
    client = MongoClient(MONGO_URI)
    db = client['kisancare_db']
    
    print(f"✅ Connected. DB Type: {type(db)}")
    
    users = db['users']
    print(f"✅ Collection Type: {type(users)}")
    
    count = users.count_documents({})
    print(f"✅ User Count: {count}")
    
    user = users.find_one({'email': 'kishan@gmail.com'})
    print(f"✅ Found User: {user}")
    
except Exception as e:
    print(f"❌ Error: {e}")
