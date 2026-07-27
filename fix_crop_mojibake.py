import os

path = r"c:\Users\kishu\Desktop\Collage Project 2026-27\frontend\crop-care.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "ðŸ’§ Irrigation Advisor": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">water_drop</span> Irrigation Advisor',
    "ðŸ › Pest Risk Checker": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">pest_control</span> Pest Risk Checker',
    "â˜   Live Weather": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">cloud</span> Live Weather',
    "ðŸ ™  City / District": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">location_city</span> City / District',
    "ðŸŒ¾ Crop": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">grass</span> Crop',
    "ðŸ“… Growth Stage": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">calendar_month</span> Growth Stage',
    "ðŸŒ± Sowing / Germination": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">eco</span> Sowing / Germination',
    " Vegetative Growth": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">nature</span> Vegetative Growth',
    "ðŸŒ¸ Flowering / Reproductive": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">local_florist</span> Flowering / Reproductive',
    "ðŸŒ¾ Maturity / Harvest": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">agriculture</span> Maturity / Harvest',
    "ðŸŸ« Soil Type": '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">landscape</span> Soil Type',
    '<span class="emoji">ðŸ œ </span>': '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">wb_sunny</span>',
    '<span class="emoji">ðŸŒ±</span>': '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">water_drop</span>',
    '<span class="emoji">ðŸ’§</span>': '<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">waves</span>',
    "â€” Select": "&mdash; Select",
    "â€” not live": "&mdash; not live",
    "Estimated per irrigation event Â·": "Estimated per irrigation event &middot;"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
