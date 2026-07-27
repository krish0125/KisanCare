"""
backend/scripts/create_admin.py
-------------------------------
CLI script to promote a user to 'admin' role in MongoDB.
Run this manually via the command line:
python backend/scripts/create_admin.py --email <user_email>
"""

import sys
import os
import argparse
from pymongo import MongoClient

# Ensure the backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.config import Config

def main():
    parser = argparse.ArgumentParser(description="Promote a user to admin")
    parser.add_argument('--email', required=True, help="Email of the user to promote")
    args = parser.parse_args()
    
    email = args.email.strip().lower()
    
    try:
        client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[Config.DB_NAME]
        
        # Check if the user exists
        user = db[Config.LOGIN_COLLECTION].find_one({'email': email})
        if not user:
            print(f"ERROR: User with email '{email}' not found.")
            sys.exit(1)
            
        if user.get('role') == 'admin':
            print(f"INFO: User '{email}' is already an admin.")
            sys.exit(0)
            
        # Update role to admin
        result = db[Config.LOGIN_COLLECTION].update_one(
            {'email': email},
            {'$set': {'role': 'admin'}}
        )
        
        if result.modified_count == 1:
            print(f"SUCCESS: Successfully promoted '{email}' to admin.")
        else:
            print(f"ERROR: Failed to update '{email}'.")
            
    except Exception as e:
        print(f"ERROR: Error connecting to database or updating user: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
