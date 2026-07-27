import re
with open('frontend/js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()
for match in re.findall(r'fetch\([\'\`"](http[^\'\`"]+)[\'\`"]', text):
    print(match)
