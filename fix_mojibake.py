import re, codecs, os

# ============================================================
# Targeted fix: restore original characters in the 5 affected
# HTML files that have double-encoded (mojibake) text.
# 
# The files are valid UTF-8 on disk. The "Ã°Å¸..." sequences
# ARE the garbled characters — they are the UTF-8 bytes of
# the original emoji/text, misread as Latin-1 and then
# re-encoded as UTF-8. 
#
# Fix: read each byte sequence as Latin-1, then decode as UTF-8
# to get back the original character.
# ============================================================

AFFECTED = ['crop.html', 'home.html', 'weather.html', 'fertilizer.html', 'market.html']

def fix_mojibake(text):
    """
    Find sequences of characters that look like double-encoded UTF-8
    and restore them to their original Unicode characters.
    
    Pattern: sequences containing Ã, Å, Â (U+00C3, U+00C5, U+00C2) 
    followed by continuation characters typical of double-encoded UTF-8.
    """
    result = []
    i = 0
    encoded = text.encode('latin-1', errors='replace')
    
    # Try to decode the whole thing via latin-1 -> utf-8
    # This works if the file was originally UTF-8 misread as Latin-1 then re-encoded as UTF-8
    try:
        fixed = encoded.decode('utf-8', errors='replace')
        return fixed
    except Exception:
        return text

total_fixed = 0

for fname in AFFECTED:
    fpath = f'frontend/{fname}'
    
    with open(fpath, 'rb') as f:
        raw = f.read()
    
    # Remove BOM if present
    if raw.startswith(codecs.BOM_UTF8):
        raw = raw[3:]
    
    # The file bytes are valid UTF-8 representing garbled text.
    # Read as UTF-8 to get the garbled string, then re-encode as Latin-1
    # (which reverses the second incorrect encoding step), then decode
    # as UTF-8 (which reverses the first incorrect step).
    
    garbled_text = raw.decode('utf-8', errors='replace')
    
    # Re-encode as latin-1 to get the intermediate bytes
    try:
        intermediate = garbled_text.encode('latin-1', errors='replace')
    except Exception as e:
        print(f"[ERROR] {fname}: could not re-encode as latin-1: {e}")
        continue
    
    # Decode as UTF-8 to get the original text
    try:
        fixed_text = intermediate.decode('utf-8', errors='replace')
    except Exception as e:
        print(f"[ERROR] {fname}: could not decode intermediate as utf-8: {e}")
        continue
    
    # Save as UTF-8 (no BOM)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(fixed_text)
    
    # Count remaining garbled sequences
    remaining = fixed_text.count('Ã°') + fixed_text.count('\u00c3\u00b0')
    print(f"[OK] {fname}: fixed. Remaining mojibake count: {remaining}")
    total_fixed += 1

print(f"\nDone. Fixed {total_fixed} files.")
