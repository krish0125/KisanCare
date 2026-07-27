import os

FRONTEND = r'c:\Users\kishu\Desktop\Collage Project 2026-27\frontend'

# Mojibake marker patterns (double-encoded UTF-8 read as Latin-1)
patterns = [
    '\u00c3\u00b0', '\u00c2\u00b0', '\u00e2\u0080', '\u00c3\u00a2', '\u00d0\u009f',
    '\u00c2\u00bf', '\u00c3\u00a9', '\u00c3\u00a0', '\u00c2\u00a9', '\u00c3\u00b3',
    '\u00c3\u00b1', '\u00c3\u00a1', '\u00c3\u00ad', '\u00c3\u00b6', '\u00c3\u00bc',
    '\u00c5\u0092', '\u00c3\u0082', '\u00c3\u0090'
]

results = {}
total = 0
for root, dirs, files in os.walk(FRONTEND):
    dirs[:] = [d for d in dirs if d not in ('images', '__pycache__')]
    for fname in files:
        if not fname.endswith(('.html', '.js')):
            continue
        total += 1
        fpath = os.path.join(root, fname)
        try:
            with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            hits = []
            for p in patterns:
                count = content.count(p)
                if count > 0:
                    hits.append(f'{repr(p)}x{count}')
            if hits:
                rel = os.path.relpath(fpath, FRONTEND)
                results[rel] = hits
        except Exception as e:
            print(f'ERROR reading {fname}: {e}')

if results:
    print('FILES WITH MOJIBAKE:')
    for f, h in sorted(results.items()):
        print(f'  {f}:')
        for hit in h:
            print(f'    {hit}')
else:
    print('No mojibake found.')
print(f'\nScanned {total} files total.')
