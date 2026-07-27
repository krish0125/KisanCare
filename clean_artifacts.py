import os
import re

FRONTEND = r'c:\Users\kishu\Desktop\Collage Project 2026-27\frontend'

# Artifacts left over from mojibake double encoding of emojis
artifacts = [
    '\ufffd',      # Replacement char
    'âœ…',       # Corrupted checkmark
    'â Œ',       # Corrupted cross
    'âš\xa0ï¸',  # Corrupted warning
    'â€¦',       # Corrupted ellipsis
    'â€\x8d',    # ZWJ
    'âœ',
    'ï¸',
    'âš',
]

for root, dirs, files in os.walk(FRONTEND):
    dirs[:] = [d for d in dirs if d not in ('images', '__pycache__')]
    for fname in files:
        if not fname.endswith(('.html', '.js')): continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        orig = content
        for a in artifacts:
            content = content.replace(a, '')
            
        if content != orig:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Cleaned artifacts from {fname}")

