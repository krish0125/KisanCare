"""
backend/routes/chat.py
-----------------------
Chat endpoint — moved from app.py without any behaviour changes.
Both Gemini AI path and keyword-based fallback are preserved.

POST /chat
  multipart/form-data:
    message  (str)  — user message text
    language (str)  — language code, e.g. 'en', 'hi', 'gu'
    image    (file) — optional image file for vision queries
"""

from flask import Blueprint, request, jsonify
from backend.config import Config
from backend.utils.gemini import call_gemini, get_fallback_reply, LANG_NAMES

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/chat', methods=['POST'])
def chat():
    try:
        message  = (request.form.get('message') or '').strip()
        language = (request.form.get('language') or 'en').strip()
        image    = request.files.get('image')

        reply       = ''
        image_bytes = None
        image_mime  = None

        # ── Read image bytes if provided ───────────────────────────────────
        if image:
            image_bytes = image.read()
            image_mime  = image.content_type or 'image/jpeg'

        if not message and not image_bytes:
            return jsonify({'error': 'No input provided'}), 400

        # ── Try Gemini AI (with vision if image provided) ──────────────────
        if Config.gemini_key_is_set():
            gemini_reply = call_gemini(message, language, image_bytes, image_mime)
            if gemini_reply:
                reply = gemini_reply
                print(f"✅ Gemini replied [{LANG_NAMES.get(language, language)}] "
                      f"— {'image+text' if image_bytes else 'text'}")

        # ── Fallback: keyword-based reply ──────────────────────────────────
        if not reply:
            print("⚠️ Gemini unavailable — using keyword fallback")
            if image_bytes:
                reply = (
                    "🔍 **Image Received!**\n\n"
                    "I can see your uploaded image. While detailed AI vision analysis requires "
                    "the Gemini API, here are general tips:\n\n"
                    "• **Leaf yellowing** → Check N/Fe deficiency or overwatering\n"
                    "• **Brown spots** → Likely fungal — apply Mancozeb spray\n"
                    "• **Holes in leaves** → Caterpillar/insect damage — apply Spinosad\n"
                    "• **Wilting** → Check soil moisture and root health\n\n"
                    "For accurate diagnosis, describe the symptoms in text!"
                )
            else:
                reply = get_fallback_reply(message)

        return jsonify({'status': 'success', 'reply': reply})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
