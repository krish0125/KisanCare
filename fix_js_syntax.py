import os
import re

js_dir = r"c:\Users\kishu\Desktop\Collage Project 2026-27\frontend\js"
for f in os.listdir(js_dir):
    if f.endswith('.js'):
        path = os.path.join(js_dir, f)
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # normalize to standard first
        content = content.replace("<span class='material-icons' style='vertical-align: middle; font-size: inherit;'>",
                                  '<span class="material-icons" style="vertical-align: middle; font-size: inherit;">')
        
        # Now, if we see a line with this span, let's fix it by replacing the whole line
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if '<span class="material-icons"' in line:
                # To be completely safe against JS string literal errors, we can use \x22 (hex for ")
                # or we can escape the double quotes: \"
                # Wait, if we use \", and the string is enclosed in ', it becomes \' which is harmless?
                # No, \' inside ' is an escaped quote! \" inside ' is just a literal ".
                # If the string is enclosed in ", \" is an escaped quote!
                # Wait! \x22 works in both ' and " strings!
                # Wait, \x22 inside HTML? If it's `innerHTML`, the browser doesn't care. It will render as HTML.
                # Actually, \x22 is a JS escape sequence. It turns into a literal double quote `"` when the JS engine parses the string!
                # So if we write \x22, JS evaluates it to ", and innerHTML receives ", which is perfect!
                
                # Let's replace the double quotes in the span with \x22
                lines[i] = line.replace('<span class="material-icons" style="vertical-align: middle; font-size: inherit;">',
                                        r'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>')
                
        content = '\n'.join(lines)
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)

print("Fixed JS files with hex escapes.")
