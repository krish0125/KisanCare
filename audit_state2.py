import os

FRONTEND = r'c:\Users\kishu\Desktop\Collage Project 2026-27\frontend'
results = []

for root, dirs, files in os.walk(FRONTEND):
    dirs[:] = [d for d in dirs if d not in ('images', 'i18n', '__pycache__')]
    for fname in files:
        if not fname.endswith(('.html', '.js')):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'rb') as f:
            raw = f.read()
        text = raw.decode('utf-8', errors='replace')
        repl = text.count('\ufffd')
        sess = 'sessionStorage' in text
        loca = 'kisanToken' in text
        if repl > 0 or sess:
            rel = os.path.relpath(fpath, FRONTEND)
            results.append(f"{rel}: bad_bytes={repl} sessionStorage={sess} kisanToken={loca}")

with open('audit_results.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(results) if results else 'All clean!')

print(f"Written {len(results)} results to audit_results.txt")
