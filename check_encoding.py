import os, sys

# Find all emoji-like and special characters in files and print what they actually are
files_to_check = [
    r'frontend\crop-care.html',
    r'frontend\crop.html',
]

for fpath in files_to_check:
    with open(fpath, 'rb') as f:
        raw = f.read()
    text = raw.decode('utf-8', errors='replace')
    
    # Find all non-ASCII characters
    import unicodedata
    unusual = []
    for i, ch in enumerate(text):
        if ord(ch) > 127:
            try:
                name = unicodedata.name(ch, 'UNKNOWN')
            except:
                name = 'UNKNOWN'
            unusual.append((i, ch, ord(ch), name))
    
    print(f"\n=== {fpath} ===")
    print(f"Total non-ASCII chars: {len(unusual)}")
    
    # Group by category  
    by_category = {}
    for pos, ch, codepoint, name in unusual:
        cat = 'emoji' if codepoint >= 0x1F000 else ('latin' if codepoint < 0x500 else 'other')
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append((pos, ch, codepoint, name))
    
    for cat, items in by_category.items():
        print(f"  Category '{cat}': {len(items)} chars")
        for pos, ch, cp, name in items[:5]:
            ctx_start = max(0, pos-15)
            ctx_end = min(len(text), pos+15)
            ctx = text[ctx_start:ctx_end].replace('\n', ' ').replace('\r', '')
            # Write safe output
            sys.stdout.buffer.write(
                f"    U+{cp:04X} ({name}) near: ".encode('ascii', errors='replace')
            )
            sys.stdout.buffer.write(ctx.encode('ascii', errors='replace'))
            sys.stdout.buffer.write(b'\n')
