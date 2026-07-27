import os, sys
FRONTEND = r'c:\Users\kishu\Desktop\Collage Project 2026-27\frontend'

checks = {}
for root, dirs, files in os.walk(FRONTEND):
    dirs[:] = [d for d in dirs if d not in ('images', 'i18n', '__pycache__')]
    for fname in files:
        if not fname.endswith(('.html', '.js')): continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'rb') as f:
            raw = f.read()
        text = raw.decode('utf-8', errors='replace')
        repl = text.count('\ufffd')
        sess = 'sessionStorage' in text
        loca = 'kisanToken' in text
        if repl > 0 or sess:
            rel = os.path.relpath(fpath, FRONTEND)
            checks[rel] = (repl, sess, loca)

for f, (bad, sess, tok) in sorted(checks.items()):
    line = f"{f}: bad_bytes={bad} sessionStorage={sess} kisanToken={tok}"
    sys.stdout.buffer.write(line.encode('ascii', 'replace') + b'\n')
