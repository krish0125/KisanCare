import os
import sys
from pymongo import MongoClient

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.config import Config

"""
WARNING: 
These scheme details are for demonstration and seeded manually.
Scheme details (especially deadlines and eligibility) should be verified 
against official government sources before relying on them in a production setting.
"""

INITIAL_SCHEMES = [
    {
        "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "description": "Financial support of ₹6,000 per year in three equal installments to all landholding farmer families.",
        "eligibility": {
            "max_land_area": 5.0, # Originally marginal/small, now extended to all, but keeping 5 acres for heuristic
            "states": [],
            "crops": []
        },
        "required_documents": ["Aadhaar Card", "Bank Account Details", "Land Holding Papers"],
        "last_date": "2026-12-31", # Arbitrary future date for demo
        "benefits": "₹6,000 per year directly to bank account.",
        "application_guidance_url": "https://pmkisan.gov.in/",
        "is_active": True
    },
    {
        "name": "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
        "description": "Comprehensive crop insurance scheme from pre-sowing to post-harvest losses.",
        "eligibility": {
            "max_land_area": None,
            "states": [],
            "crops": ["wheat", "rice", "cotton", "sugarcane", "maize"] # Example crops
        },
        "required_documents": ["Aadhaar Card", "Bank Account Details", "Land Ownership Record", "Sowing Certificate"],
        "last_date": "2026-07-31", # Kharif season deadline example
        "benefits": "Insurance cover for crop failure.",
        "application_guidance_url": "https://pmfby.gov.in/",
        "is_active": True
    },
    {
        "name": "Soil Health Card Scheme",
        "description": "Provides information to farmers on nutrient status of their soil along with recommendation on appropriate dosage of nutrients.",
        "eligibility": {
            "max_land_area": None,
            "states": [],
            "crops": []
        },
        "required_documents": ["Soil Sample"],
        "last_date": "2026-12-31",
        "benefits": "Free soil testing and customized fertilizer recommendations.",
        "application_guidance_url": "https://soilhealth.dac.gov.in/",
        "is_active": True
    },
    {
        "name": "KCC (Kisan Credit Card)",
        "description": "Provides farmers with timely access to credit for their agricultural needs at lower interest rates.",
        "eligibility": {
            "max_land_area": None,
            "states": [],
            "crops": []
        },
        "required_documents": ["Aadhaar Card", "PAN Card", "Land Documents", "Passport Size Photo"],
        "last_date": "2026-12-31",
        "benefits": "Short term credit limit with subsidized interest rates.",
        "application_guidance_url": "https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card",
        "is_active": True
    },
    {
        "name": "Mukhya Mantri Kisan Sahay Yojana (Gujarat)",
        "description": "Financial assistance to farmers against crop loss due to natural calamities.",
        "eligibility": {
            "max_land_area": None,
            "states": ["Gujarat"],
            "crops": []
        },
        "required_documents": ["Aadhaar Card", "7/12 & 8-A land records", "Bank Passbook"],
        "last_date": "2026-10-31",
        "benefits": "₹20,000 to ₹25,000 per hectare for crop loss.",
        "application_guidance_url": "https://agri.gujarat.gov.in/",
        "is_active": True
    }
]

def seed_schemes():
    try:
        client = MongoClient(Config.MONGO_URI)
        db = client[Config.DB_NAME]
        
        # Clear existing schemes to avoid duplicates during seeding
        db.schemes.delete_many({})
        print("Cleared existing schemes.")
        
        # Insert initial schemes
        result = db.schemes.insert_many(INITIAL_SCHEMES)
        print(f"Successfully seeded {len(result.inserted_ids)} schemes.")
        
    except Exception as e:
        print(f"Error seeding schemes: {e}")

if __name__ == "__main__":
    seed_schemes()
