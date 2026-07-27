import os
import re
import codecs

frontend_dir = 'frontend'

nav_template = """<nav>
        <div class="logo"><span class="material-icons">eco</span> KisanCare</div>
        <div class="menu-toggle" id="mobile-menu"><span class="material-icons">menu</span></div>
        <ul class="nav-links">
            <li><a href="home.html" data-i18n="nav_home"><span class="material-icons">home</span> Home</a></li>
            <li><a href="crop.html" data-i18n="nav_crop_advisory"><span class="material-icons">grass</span> Crop Advisory</a></li>
            <li><a href="weather.html" data-i18n="nav_weather_alerts"><span class="material-icons">cloud</span> Weather Alerts</a></li>
            <li><a href="crop-care.html" data-i18n="nav_crop_care"><span class="material-icons">local_florist</span> Crop Care</a></li>
            <li><a href="market.html" data-i18n="nav_market_prices"><span class="material-icons">storefront</span> Market Prices</a></li>
            <li><a href="schemes.html" data-i18n="nav_schemes"><span class="material-icons">account_balance</span> Govt Schemes</a></li>
            <li><a href="fertilizer.html" data-i18n="nav_fertilizers"><span class="material-icons">science</span> Fertilizers</a></li>
            <li><a href="#" id="navFeedbackLink" data-i18n="nav_feedback"><span class="material-icons">feedback</span> Feedback</a></li>
            <li><a href="profile.html" data-i18n="nav_profile"><span class="material-icons">person</span> Profile</a></li>
            <li><a href="history.html" data-i18n="nav_history"><span class="material-icons">history</span> History</a></li>
            <li><a href="fertilizer-calc.html" data-i18n="nav_fert_calc"><span class="material-icons">calculate</span> Fert. Calc.</a></li>
            <li><a href="expenses.html" data-i18n="nav_expenses"><span class="material-icons">payments</span> Expenses</a></li>
            <li><a href="index.html" data-i18n="nav_login"><span class="material-icons">login</span> Login</a></li>
            <li>
                <select id="langSwitcher" class="lang-switcher">
                    <option value="en">EN</option>
                    <option value="hi">HI</option>
                    <option value="gu">GU</option>
                </select>
            </li>
        </ul>
    </nav>"""

# Fix each HTML file
count = 0
for fname in os.listdir(frontend_dir):
    if not fname.endswith('.html'):
        continue
        
    fpath = os.path.join(frontend_dir, fname)
    
    # Read as raw bytes to handle the garbled encoding
    with open(fpath, 'rb') as f:
        raw = f.read()
        
    # Remove BOM if present
    if raw.startswith(codecs.BOM_UTF8):
        raw = raw[3:]
        
    # Attempt to fix the double encoding by decoding as UTF-8 ignoring errors. 
    content = raw.decode('utf-8', errors='ignore')
    
    # Ensure <meta charset="UTF-8"> is the first tag in <head>
    if '<meta charset="UTF-8">' not in content and '<meta charset="utf-8">' not in content:
        content = re.sub(r'<head>', '<head>\n    <meta charset="UTF-8">', content, count=1, flags=re.IGNORECASE)
        
    # Special handling for admin.html which has a different nav
    if fname == 'admin.html':
        admin_nav = """<nav>
            <div class="logo"><span class="material-icons">eco</span> KisanCare Admin</div>
            <ul class="nav-links">
                <li><a href="home.html" data-i18n="nav_back_home"><span class="material-icons">arrow_back</span> Back to Home</a></li>
                <li>
                    <select id="langSwitcher" class="lang-switcher">
                        <option value="en">EN</option>
                        <option value="hi">HI</option>
                        <option value="gu">GU</option>
                    </select>
                </li>
            </ul>
        </nav>"""
        content = re.sub(r'<nav>.*?</nav>', admin_nav, content, flags=re.DOTALL)
    elif fname == 'index.html':
        # Don't replace index nav fully to keep it simple, but we should add lang switcher
        index_nav = """<nav>
        <div class="logo"><span class="material-icons">eco</span> KisanCare</div>
        <ul class="nav-links">
            <li><a href="home.html" data-i18n="nav_home"><span class="material-icons">home</span> Home</a></li>
            <li>
                <select id="langSwitcher" class="lang-switcher">
                    <option value="en">EN</option>
                    <option value="hi">HI</option>
                    <option value="gu">GU</option>
                </select>
            </li>
        </ul>
    </nav>"""
        content = re.sub(r'<nav>.*?</nav>', index_nav, content, flags=re.DOTALL)
    else:
        # Standard nav replacement
        # We need to set the active class correctly
        page_nav = nav_template
        # Find which link should be active
        active_href = f'href="{fname}"'
        page_nav = page_nav.replace(active_href, active_href + ' class="active"')
        content = re.sub(r'<nav>.*?</nav>', page_nav, content, flags=re.DOTALL)
    
    # Also add <script src="js/i18n.js"></script> before </body> if not present
    if 'js/i18n.js' not in content:
        content = re.sub(r'</body>', '    <script src="js/i18n.js"></script>\n</body>', content, flags=re.IGNORECASE)
        
    # Also remove common garbled artifacts from page bodies
    content = content.replace('Ã°Å¸Å’Â¿', '')
    content = content.replace('ðŸŒ¿', '')
    content = content.replace('Ã°Å¸Â â€ºÃ¯Â¸Â', '')
    content = content.replace('Ã°Å¸Å’Â±', '')
    
    # Save as UTF-8
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    count += 1

print(f"Processed {count} HTML files.")
