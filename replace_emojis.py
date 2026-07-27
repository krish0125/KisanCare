import os
import re

FRONTEND = r'c:\Users\kishu\Desktop\Collage Project 2026-27\frontend'

# Map common emojis to Material Icons HTML
emoji_map = {
    '🌿': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">eco</span>',
    '🌾': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">grass</span>',
    '💧': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">water_drop</span>',
    '📍': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">place</span>',
    '🐛': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">pest_control</span>',
    '🐞': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">bug_report</span>',
    '🧮': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">calculate</span>',
    '🧑‍🌾': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">agriculture</span>',
    '📋': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">history</span>',
    '💰': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">payments</span>',
    '🤖': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">smart_toy</span>',
    '🌡️': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">thermostat</span>',
    '🌡': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">thermostat</span>',
    '☁️': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">cloud</span>',
    '☁': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">cloud</span>',
    '☀️': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">wb_sunny</span>',
    '☀': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">wb_sunny</span>',
    '☔': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">umbrella</span>',
    '🧪': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">science</span>',
    '📊': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">bar_chart</span>',
    '📄': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">description</span>',
    '🚜': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">agriculture</span>',
    '⚠️': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">warning</span>',
    '⚠': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">warning</span>',
    '✅': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">check_circle</span>',
    '❌': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">cancel</span>',
    '⚙️': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">settings</span>',
    '⚙': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">settings</span>',
    '🌱': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">yard</span>',
    '🍎': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">apple</span>',
    '📈': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">trending_up</span>',
    '📉': '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">trending_down</span>',
}

# Regex to match any emoji character, we will replace known ones and remove the rest
emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]|[\u2600-\u27BF](?:\uFE0F)?|[\u2300-\u23FF](?:\uFE0F)?|[\u2B50\u2B55]')

for root, dirs, files in os.walk(FRONTEND):
    # Don't modify external libraries or images
    dirs[:] = [d for d in dirs if d not in ('images', '__pycache__', 'i18n')]
    
    for fname in files:
        if not fname.endswith(('.html', '.js')):
            continue
            
        fpath = os.path.join(root, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # Explicit replacements first
        for emoji, html in emoji_map.items():
            content = content.replace(emoji, html)
            
        # Strip remaining unmapped emojis
        def replacer(match):
            e = match.group(0)
            if e in emoji_map:
                return emoji_map[e]
            return '' # strip unknown emojis to prevent mojibake
            
        content = emoji_pattern.sub(replacer, content)
        
        # Cleanup potential double-encoded emoji markers like \u00e2\u0080
        # No, that's already fixed by the decoding pass for the most part.
        
        if content != original_content:
            with open(fpath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f"Removed emojis from {fname}")

print("Emoji replacement complete.")
