from pymongo import MongoClient
import os

# 1. Connect
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/') 
client = MongoClient(MONGO_URI)
db = client['kisancare_db']
users_col = db['users']

def add_user(email, password, name):
    if users_col.find_one({'email': email}):
        print(f"❌ User already exists: {email}")
        return

    user = {
        'email': email,
        'password': password,
        'name': name
    }
    users_col.insert_one(user)
    print(f"✅ User Created Successfully!\nEmail: {email}\nPassword: {password}\nName: {name}")

# --- EDIT HERE TO ADD NEW USER ---
print("--- Adding New User ---")
add_user("kishan@gmail.com", "kishan123", "Kishan (Farmer)")

# You can add more lines like this:
# add_user("newuser@gmail.com", "pass123", "New User")
