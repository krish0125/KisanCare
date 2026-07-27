"""
backend/utils/gemini.py
------------------------
Gemini AI integration and keyword fallback — extracted from the original app.py
without any behaviour changes. Both paths (Gemini and fallback) are preserved.
"""

import os
from backend.config import Config

# Language name lookup (used in system prompt)
LANG_NAMES = {
    'en': 'English', 'hi': 'Hindi', 'gu': 'Gujarati', 'mr': 'Marathi',
    'pa': 'Punjabi', 'ta': 'Tamil', 'te': 'Telugu', 'bn': 'Bengali',
    'kn': 'Kannada', 'ml': 'Malayalam', 'or': 'Odia', 'ur': 'Urdu'
}


def call_gemini(user_message: str, language_code: str = 'en',
                image_bytes=None, image_mime=None):
    """
    Call Google Gemini API and return the response text.
    Supports optional image input for vision queries.
    Returns None if Gemini is unavailable so the caller can fall back.
    """
    try:
        from google import genai
        from google.genai import types

        client_gemini = genai.Client(api_key=Config.GEMINI_API_KEY)
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
                types.Part.from_text(
                    text=(f"{system_prompt}\n\nFarmer's question about the uploaded image: "
                          f"{user_message or 'Please analyze this farm/crop/pest/soil image and give advice.'}")
                )
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


def get_fallback_reply(message: str) -> str:
    """
    Keyword-based fallback when Gemini is not available.
    Returns a helpful agricultural response based on keywords detected in the message.
    """
    message = message.lower()

    if any(w in message for w in ["weather", "rain", "temperature", "climate", "forecast", "cloud"]):
        return (
            "🌤️ **Weather Update:**\nBased on general data, the forecast predicts clear skies with a "
            "temperature around 25°C-30°C.\n\n⚠️ *Advisory:* It's a good time for spraying fertilizers "
            "or harvesting if crops are ready."
        )

    elif any(w in message for w in ["price", "market", "rate", "cost", "mandi", "sell"]):
        return (
            "💰 **Market Prices (Estimated):**\n- 🌾 **Wheat:** ₹2,100/quintal\n"
            "- 🍚 **Rice:** ₹2,800/quintal\n- 🍅 **Tomato:** ₹40/kg\n"
            "- 🥔 **Potato:** ₹25/kg\n- 🧅 **Onion:** ₹35/kg\n\n"
            "*Prices may vary based on your local Mandi.*"
        )

    elif "wheat" in message:
        return (
            "🌾 **Wheat Farming Tips:**\n- **Sowing Time:** November to December\n"
            "- **Irrigation:** 4-6 waterings at critical stages\n"
            "- **Fertilizer:** NPK ratio 4:2:1\n"
            "- **Harvest:** When grains harden and straw turns golden."
        )

    elif "rice" in message or "paddy" in message:
        return (
            "🍚 **Paddy (Rice):**\n- **Season:** Kharif (June-July)\n"
            "- **Water:** Flood irrigation early stages\n"
            "- **Protection:** Watch for Stem Borer and Blast disease."
        )

    elif "cotton" in message:
        return (
            "☁️ **Cotton Farming:**\n- **Soil:** Black soil is best\n"
            "- **Pests:** Bollworms — use pheromone traps\n"
            "- **Harvest:** Pick dry bolls in the morning."
        )

    elif any(w in message for w in ["water", "irrigation", "drip", "sprinkler"]):
        return (
            "💧 **Irrigation Advice:**\n- **Drip:** Saves 50-70% water, best for veggies/fruits\n"
            "- **Sprinkler:** Good for wheat/pulses\n"
            "- **Tip:** Irrigate early morning or late evening."
        )

    elif any(w in message for w in ["soil", "fertilizer", "urea", "compost", "dap", "npk"]):
        return (
            "🌱 **Soil & Nutrition:**\n- **Soil Test:** Every 3 years\n"
            "- **Organic:** Vermicompost or Cow Dung manure\n"
            "- **N-P-K:** Nitrogen for growth, Phosphorus for roots, Potassium for strength."
        )

    elif any(w in message for w in ["pest", "bug", "insect", "worm", "disease", "virus", "fungus"]):
        return (
            "🐛 **Pest Control:**\n- **Prevention:** Crop rotation breaks pest cycles\n"
            "- **Organic:** Neem Oil spray\n"
            "- **Chemical:** Consult a local expert before using."
        )

    elif any(w in message for w in ["hello", "hi", "hey", "namaste", "help"]):
        return (
            "👋 **Namaste! I am your Kisan Assistant.**\n\nI can help with:\n"
            "- 🌤️ Weather\n- 💰 Mandi Prices\n- 🌾 Crop Advice\n- 🐛 Pest Control\n\n"
            "*Ask me anything!*"
        )

    else:
        return (
            "🤔 I can help with **Farming, Crops, Weather, and Market Prices**.\n\n"
            "Try asking:\n- *\"What is the price of Wheat?\"*\n"
            "- *\"How to grow Tomatoes?\"*\n- *\"Weather forecast today\"*"
        )

def analyze_disease_image(image_bytes: bytes, image_mime: str, language_code: str = 'en') -> str:
    """
    Call Google Gemini Vision API to analyze a crop image for diseases.
    Enforces a strict JSON output format.
    Returns the raw JSON string or None if it fails.
    """
    try:
        from google import genai
        from google.genai import types

        client_gemini = genai.Client(api_key=Config.GEMINI_API_KEY)
        lang_name = LANG_NAMES.get(language_code, 'English')

        system_prompt = (
            f"You are an expert plant pathologist and agronomist. Analyze the provided image of a crop/plant. "
            f"Identify any visible diseases, nutrient deficiencies, or pest damage. "
            f"Provide your response STRICTLY as a valid JSON object. Do NOT wrap it in markdown code blocks (no ```json). "
            f"Do not include any text outside the JSON object. "
            f"All text values in the JSON must be translated to {lang_name} language (use native script). "
            f"Use the following schema:\n"
            f"{{\n"
            f"  \"disease_name\": \"Name of the disease or pest (or 'Healthy' if no issue)\",\n"
            f"  \"severity\": \"Low\", \"Medium\", or \"High\" (or \"None\"),\n"
            f"  \"confidence\": \"High\", \"Medium\", or \"Low\",\n"
            f"  \"organic_treatment\": \"Actionable organic/natural treatment steps\",\n"
            f"  \"chemical_treatment\": \"Specific chemical treatment (if necessary), including dosages if applicable. Say 'Not required' if healthy.\"\n"
            f"}}"
        )

        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=image_mime),
            types.Part.from_text(text=system_prompt)
        ]

        response = client_gemini.models.generate_content(
            model='gemini-2.0-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                temperature=0.2, # Low temperature for more deterministic JSON
                response_mime_type="application/json"
            )
        )

        return response.text.strip()

    except ImportError:
        print("⚠️ google-genai package not installed.")
        return None
    except Exception as e:
        print(f"⚠️ Gemini Vision API Error: {e}")
        return None
