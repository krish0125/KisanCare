import os, re, codecs

frontend = 'frontend'
files = sorted([f for f in os.listdir(frontend) if f.endswith('.html')])

for fname in files:
    fpath = os.path.join(frontend, fname)
    with open(fpath, 'rb') as f:
        raw = f.read()
    has_bom = raw.startswith(codecs.BOM_UTF8)
    if has_bom:
        raw = raw[3:]
    text = raw.decode('utf-8', errors='replace')
    
    charset_ok = '<meta charset=' in text.lower()[:600]
    # Count garbled patterns visible as text
    double_enc = text.count('Ã°') + text.count('\u00c3\u00b0')
    a_seq = text.count('\u00c3\u00a2') + text.count('\u00c3\u00a2')  # Ã¢ pattern
    nav_ok = '<nav>' in text or '<nav ' in text
    i18n_script = 'js/i18n.js' in text
    material_nav = 'material-icons' in text
    
    print(f"{fname:30s} BOM:{int(has_bom)} charset:{int(charset_ok)} mojibake:{double_enc+a_seq:4d} i18n:{int(i18n_script)} maticons:{int(material_nav)}")
