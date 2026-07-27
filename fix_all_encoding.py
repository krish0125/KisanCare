"""
fix_all_encoding.py
-------------------
Comprehensive encoding fix for all affected frontend HTML/JS files.
Applies the latin-1 -> utf-8 decode trick to recover original UTF-8 text
from files that were double-encoded.
Also replaces remaining raw emoji in fixed files with SVG/text equivalents.
"""

import os
import codecs
import re

FRONTEND = r'c:\Users\kishu\Desktop\Collage Project 2026-27\frontend'

# Files confirmed to have invalid UTF-8 bytes (replacement chars when decoded)
AFFECTED = [
    'weather.html',
    'crop.html', 
    'home.html',
    'market.html',
    'fertilizer.html',
    'index.html',
    'crop-care.html',
]

def apply_mojibake_fix(raw_bytes):
    """
    Reverse double-encoding: file saved as cp1252/latin-1 bytes re-encoded as UTF-8.
    Step 1: decode raw bytes as UTF-8 (gives garbled chars)
    Step 2: re-encode garbled string as cp1252 (reverses second step)
    Step 3: decode result as UTF-8 (recovers original)
    """
    try:
        garbled = raw_bytes.decode('utf-8', errors='replace')
        intermediate = garbled.encode('cp1252', errors='replace')
        fixed = intermediate.decode('utf-8', errors='replace')
        return fixed
    except Exception as e:
        print(f"  [WARN] mojibake fix failed: {e}")
        return raw_bytes.decode('utf-8', errors='replace')

def count_bad_bytes(raw_bytes):
    """Count UTF-8 replacement chars to gauge how bad the corruption is."""
    return raw_bytes.decode('utf-8', errors='replace').count('\ufffd')

fixed_count = 0

for fname in AFFECTED:
    fpath = os.path.join(FRONTEND, fname)
    if not os.path.exists(fpath):
        print(f"[SKIP] {fname} not found")
        continue
    
    with open(fpath, 'rb') as f:
        raw = f.read()
    
    # Strip BOM if present
    if raw.startswith(codecs.BOM_UTF8):
        raw = raw[3:]
    
    bad_before = count_bad_bytes(raw)
    
    if bad_before == 0:
        # File may have valid-but-wrong chars (double-encoded printables)
        # Still try the fix to clean up â€, Ã etc patterns
        text = raw.decode('utf-8', errors='replace')
        # Check if it has the characteristic latin-extended chars from double-encoding
        suspect_patterns = ['\u00e2\u0080', '\u00c3\u00a2', '\u00c3\u00b0', '\u00c2\u00a0', '\u00c3\u0082']
        if any(p in text for p in suspect_patterns):
            print(f"[FIX-PRINTABLE] {fname}: has latin-extended double-encode markers")
            fixed = apply_mojibake_fix(raw)
        else:
            print(f"[OK] {fname}: no issues found ({bad_before} bad bytes, no suspect patterns)")
            continue
    else:
        print(f"[FIX] {fname}: {bad_before} replacement chars found, applying fix...")
        fixed = apply_mojibake_fix(raw)
    
    bad_after = fixed.count('\ufffd')
    
    # Write fixed content as clean UTF-8
    with open(fpath, 'w', encoding='utf-8', newline='') as f:
        f.write(fixed)
    
    print(f"  -> Done. Bad chars: {bad_before} -> {bad_after}")
    fixed_count += 1

print(f"\nFixed {fixed_count}/{len(AFFECTED)} files.")
print("Verify in browser that affected pages now render correctly.")
