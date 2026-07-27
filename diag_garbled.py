import re

# Show specific garbled content from each affected page
affected = {
    'crop.html': 632,
    'home.html': 360,
    'weather.html': 1228,
    'fertilizer.html': 86,
    'market.html': 52,
}

for fname, count in affected.items():
    print(f"\n=== {fname} (mojibake count: {count}) ===")
    with open(f'frontend/{fname}', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all garbled sequences (Ã followed by other Latin-1 artifacts)
    matches = re.finditer(r'[ÃÅðÂ]{1}[¸Å°â€Â½¾¿Âï·¸ ]+[^\s<"]{0,20}', content)
    shown = 0
    for m in matches:
        ctx_start = max(0, m.start() - 30)
        ctx_end = min(len(content), m.end() + 30)
        print(f"  [{m.start()}] ...{content[ctx_start:ctx_end].strip()[:80]}...")
        shown += 1
        if shown >= 5:
            print(f"  ... (and more)")
            break
