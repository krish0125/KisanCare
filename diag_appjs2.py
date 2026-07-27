import re

with open('frontend/js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# IDs that only exist on specific pages (not on history/expenses)
# If app.js accesses these without null check it will crash
page_specific_ids = {
    'closeFeedbackBtn', 'feedbackFormModal', 'feedbackMessageModal', 
    'feedbackModal', 'feedbackNameModal',
    'getPriceBtn', 'getWeatherBtn',
    'historyBanner', 'historyBannerText',
    'marketCrop', 'marketName',
    'mockBanner', 'mockBannerText',
    'statAverage', 'statHighest', 'statLowest',
    'trendChart', 'trendSuggestion',
    'weatherDisplay', 'weatherError', 'weatherLocation',
    'displayTemp', 'displayCondition', 'displayHumidity',
    'displayWind', 'displayFeels', 'displayHiLo',
    'displayLocation', 'displayRain', 'displaySunrise', 'displaySunset',
    'priceResult', 'priceTableBody', 'statAverage', 'statHighest', 'statLowest',
    'dailyList', 'hourlyRow', 'alertsRow', 'advisoryGrid',
    'getPriceBtn', 'getWeatherBtn', 'chat-input', 'chat-lang-select'
}

print("=== Lines with direct property access on page-specific elements ===")
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    if 'getElementById' not in stripped:
        continue
    # Find the id
    match = re.search(r"getElementById\(['\"]([^'\"]+)['\"]\)\.", stripped)
    if match:
        eid = match.group(1)
        if eid in page_specific_ids:
            print(f"  Line {i:4d}: {stripped[:100]}")
