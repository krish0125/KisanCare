import re

with open('frontend/js/app.js', 'r', encoding='utf-8') as f:
    app_content = f.read()

dom_queries = re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)', app_content)
print('=== app.js getElementById calls (unique) ===')
for q in sorted(set(dom_queries)):
    print(f'  #{q}')

# Also check if app.js fails if elements don't exist (no null checks)
# Find pattern: document.getElementById('x').something - no null check
patterns = re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)\.', app_content)
print()
print('=== Direct property access without null check ===')
for q in sorted(set(patterns)):
    print(f'  #{q}')
