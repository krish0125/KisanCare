"""
backend/utils/pest_risk.py
---------------------------
Static pest-risk lookup table and risk-assessment function for KisanCare.
No I/O, no Flask imports — pure functions, easy to unit-test.

APPROACH
---------
This is a curated LOOKUP TABLE, not a trained ML model.
Rules are derived from ICAR extension bulletins, state agricultural department
guidance, and published crop-protection literature.

The table currently covers 8 high-priority crops (same set used in Phase 5's
Crop Care page).  All 22 crops from the recommendation model can be added
incrementally as more reliable regional guidance becomes available — DO NOT
fabricate pest-incidence data.

UI LABELLING REQUIREMENT
-------------------------
The frontend MUST display this as "Common Pest Risk Factors" — NOT "AI pest
prediction" — because the risk scores here are proximity calculations against
known favorable weather ranges, not learned from historical incidence data.

RISK SCORE FORMULA
-------------------
For each pest, compute a temperature-proximity score and a humidity-proximity
score (each 0–100, where 100 = current value is in the center of the favorable
range, 0 = current value is outside the range entirely).  Final risk_score is
the geometric mean of the two scores.

  risk_level: score ≥ 70 → "high", 40–69 → "moderate", 1–39 → "low", 0 → skip

SUPPORTED CROPS (Phase 5)
--------------------------
rice, wheat, cotton, maize, sugarcane, tomato, potato, chickpea

# TODO: Phase 6 — add remaining 14 crops from the recommendation model once
#       reliable per-crop extension guidance is reviewed.
"""

import math
from datetime import date
from typing import List, Dict, Any

# ── Month-to-season mapping (Indian agricultural calendar) ───────────────────
_KHARIF_MONTHS  = {6, 7, 8, 9, 10}       # June–October
_RABI_MONTHS    = {11, 12, 1, 2, 3}      # November–March
_ZAID_MONTHS    = {3, 4, 5}              # March–May (summer)


def _current_season() -> str:
    m = date.today().month
    if m in _KHARIF_MONTHS:  return "kharif"
    if m in _RABI_MONTHS:    return "rabi"
    return "zaid"


# ── Pest risk table ───────────────────────────────────────────────────────────
# Each entry:
#   pest_name     : English common name
#   local_name    : Regional / Hindi name where widely known
#   temp_min/max  : °C range that favours the pest (peak activity)
#   humidity_min/max: % RH range that favours the pest
#   season        : "kharif" | "rabi" | "zaid" | "any"
#   description   : One sentence — what it does to the crop
#   prevention    : list of 3 bullet strings (cultural / biological)
#   treatment     : dict with "organic" and "chemical" keys (brief guidance)
#
# Sources: ICAR crop protection manuals, NIPHM guidelines, FAO IPM guides.
# Treatment chemical names are generic active ingredients, not brand names.

PEST_RISK_TABLE: Dict[str, List[Dict]] = {

    # ─── Rice ─────────────────────────────────────────────────────────────────
    "rice": [
        {
            "pest_name":   "Brown Planthopper",
            "local_name":  "Bhura Maahu / Chatni Kida",
            "temp_min":    22, "temp_max": 30,
            "humidity_min": 80, "humidity_max": 100,
            "season":      "kharif",
            "description": "Sucks phloem sap at the base of the stem causing 'hopper burn' — patches of yellowed, wilted crop that look like scorching.",
            "prevention": [
                "Avoid excessive nitrogen fertilisation — lush, soft growth attracts hoppers.",
                "Maintain field drainage to reduce stagnant water between rows.",
                "Use light traps to monitor adult population early."
            ],
            "treatment": {
                "organic":   "Release Cyrtorhinus lividipennis (a natural predator) if available from state biocontrol labs; neem-oil spray (5 ml/L) on stem bases.",
                "chemical":  "Buprofezin 25 SC (1 ml/L) or Thiamethoxam 25 WG (0.2 g/L) directed at stem bases; avoid pyrethroids which kill natural enemies."
            }
        },
        {
            "pest_name":   "Rice Stem Borer",
            "local_name":  "Tana Borer / Gundhi Kida",
            "temp_min":    25, "temp_max": 35,
            "humidity_min": 60, "humidity_max": 90,
            "season":      "kharif",
            "description": "Larvae bore into the stem causing 'dead heart' at tillering or 'white ear' at heading — both result in significant yield loss.",
            "prevention": [
                "Remove and destroy stubble and ratoons after harvest to break the life cycle.",
                "Clip tips of seedlings before transplanting to remove egg masses.",
                "Use light traps from 30 days after transplanting."
            ],
            "treatment": {
                "organic":   "Trichogramma japonicum egg-parasitoid cards (1.5 lakh eggs/ha) released at egg-laying stage; neem-based pesticides as repellent.",
                "chemical":  "Cartap hydrochloride 4G (18.5 kg/ha) or Chlorantraniliprole 0.4G granules applied in the whorl."
            }
        },
        {
            "pest_name":   "Leaf Folder",
            "local_name":  "Patta Lapetne Wala Kida",
            "temp_min":    25, "temp_max": 32,
            "humidity_min": 75, "humidity_max": 100,
            "season":      "kharif",
            "description": "Larvae fold leaves lengthwise into tubes and feed on the green tissue inside, reducing photosynthetic area.",
            "prevention": [
                "Clip and destroy folded leaves at first sign of infestation.",
                "Avoid close spacing — open canopy reduces humidity and larval survival.",
                "Avoid excess nitrogen which encourages lush, attractive foliage."
            ],
            "treatment": {
                "organic":   "Neem seed kernel extract (5%) spray; conserve larval parasitoids (Apanteles sp.) by avoiding broad-spectrum sprays.",
                "chemical":  "Lambda-cyhalothrin 5 EC (1 ml/L) or Flubendiamide 20 WG (0.5 g/L)."
            }
        },
    ],

    # ─── Wheat ────────────────────────────────────────────────────────────────
    "wheat": [
        {
            "pest_name":   "Aphids (Wheat)",
            "local_name":  "Mahu / Maida",
            "temp_min":    10, "temp_max": 22,
            "humidity_min": 50, "humidity_max": 80,
            "season":      "rabi",
            "description": "Colonies on leaves and spikes suck sap and excrete honeydew, causing yellowing and transmitting barley yellow dwarf virus (BYDV).",
            "prevention": [
                "Sow timely (November 1–15) — late-sown crops coincide with peak aphid build-up.",
                "Conserve natural enemies (ladybird beetles, lacewings) — avoid early sprays.",
                "Use BYDV-resistant varieties where available."
            ],
            "treatment": {
                "organic":   "Neem oil (5 ml/L) spray; release Chrysoperla carnea larvae at 50,000/ha when colonies first appear.",
                "chemical":  "Thiamethoxam 25 WG (0.2 g/L) or Dimethoate 30 EC (1.5 ml/L) as a single targeted spray."
            }
        },
        {
            "pest_name":   "Yellow Rust (Stripe Rust)",
            "local_name":  "Peela Rust / Pitti",
            "temp_min":    9, "temp_max": 17,
            "humidity_min": 70, "humidity_max": 100,
            "season":      "rabi",
            "description": "Fungal disease (Puccinia striiformis) causing yellow-orange stripes on leaves, sharply reducing grain weight in susceptible varieties.",
            "prevention": [
                "Grow rust-resistant varieties (HD-2967, HD-3086, PBW-343 successors).",
                "Avoid dense planting which traps moisture and spreads spores.",
                "Monitor crop weekly from tillering onwards."
            ],
            "treatment": {
                "organic":   "No effective organic treatment — cultural control and resistant varieties are the primary defence.",
                "chemical":  "Propiconazole 25 EC (1 ml/L) or Tebuconazole 25.9 EC (1 ml/L) at first sign of infection; repeat after 15 days if needed."
            }
        },
    ],

    # ─── Cotton ───────────────────────────────────────────────────────────────
    "cotton": [
        {
            "pest_name":   "Pink Bollworm",
            "local_name":  "Gulabi Bollworm / Gulabi Sundi",
            "temp_min":    28, "temp_max": 38,
            "humidity_min": 35, "humidity_max": 65,
            "season":      "kharif",
            "description": "Larvae bore into bolls and seeds, causing premature shedding, lint damage, and direct yield loss — historically the most damaging cotton pest in India.",
            "prevention": [
                "Use Bt (Bollgard II) cotton which expresses Cry proteins toxic to larvae.",
                "Set pheromone traps (5/ha) from 45 days after sowing to monitor adult population.",
                "Destroy crop residue immediately after harvest to reduce overwintering larvae."
            ],
            "treatment": {
                "organic":   "Release Trichogramma chilonis egg cards (1.5 lakh/ha) weekly from flower initiation; neem-based insecticides as repellent.",
                "chemical":  "Chlorantraniliprole 18.5 SC (0.3 ml/L) or Emamectin benzoate 5 SG (0.4 g/L); rotate modes of action to avoid resistance."
            }
        },
        {
            "pest_name":   "Whitefly",
            "local_name":  "Safed Makhi",
            "temp_min":    26, "temp_max": 36,
            "humidity_min": 60, "humidity_max": 85,
            "season":      "kharif",
            "description": "Bemisia tabaci nymphs and adults suck phloem sap and transmit cotton leaf curl virus (CLCuD), which causes severe leaf curling and stunting.",
            "prevention": [
                "Remove alternate host weeds (especially Solanaceae) from field borders.",
                "Avoid excessive nitrogen which produces soft, attractive foliage.",
                "Use yellow sticky traps (10/ha) for monitoring."
            ],
            "treatment": {
                "organic":   "Neem oil (5 ml/L) spray targeting the underside of leaves; conserve natural enemies (Encarsia formosa).",
                "chemical":  "Spiromesifen 22.9 SC (1 ml/L) or Diafenthiuron 50 WP (1 g/L) — avoid neonicotinoids which drive resistance."
            }
        },
        {
            "pest_name":   "Thrips",
            "local_name":  "Trips",
            "temp_min":    27, "temp_max": 38,
            "humidity_min": 30, "humidity_max": 55,
            "season":      "kharif",
            "description": "Thrips rasps young leaves and flower petals causing silvery streaks, distorted leaves, and flower drop — especially damaging under hot, dry conditions.",
            "prevention": [
                "Maintain field hygiene — remove and destroy infested plant parts.",
                "Irrigate adequately — thrips thrive in hot, dry conditions and moisture stress makes crops more vulnerable.",
                "Blue sticky traps (10/ha) for early monitoring."
            ],
            "treatment": {
                "organic":   "Spinosad 45 SC (0.3 ml/L) — derived from a soil bacterium, effective and low-residue.",
                "chemical":  "Fipronil 5 SC (1.5 ml/L) or Imidacloprid 17.8 SL (0.3 ml/L) as a targeted spray at bud stage."
            }
        },
    ],

    # ─── Maize ────────────────────────────────────────────────────────────────
    "maize": [
        {
            "pest_name":   "Fall Armyworm",
            "local_name":  "Sena Keeda / American Sundi",
            "temp_min":    20, "temp_max": 30,
            "humidity_min": 60, "humidity_max": 85,
            "season":      "kharif",
            "description": "Spodoptera frugiperda larvae feed on leaves and bore into the whorl and cob — an invasive pest since 2018 that can devastate young plants within days.",
            "prevention": [
                "Intercrop with sunflower or cowpea — disrupts armyworm movement and attracts natural enemies.",
                "Monitor whorls for fresh frass (sawdust-like droppings) daily from emergence.",
                "Bird perches (T-shaped sticks) at 10/ha attract natural predators."
            ],
            "treatment": {
                "organic":   "Spodoptera litura nuclear polyhedrosis virus (SlNPV) spray; Bacillus thuringiensis (Bt) wettable powder in the whorl (0.5 kg/ha); neem kernel extract.",
                "chemical":  "Emamectin benzoate 5 SG (0.4 g/L) or Chlorantraniliprole 18.5 SC (0.3 ml/L) into the whorl; spray early morning when larvae are active."
            }
        },
        {
            "pest_name":   "Stem Borer (Chilo)",
            "local_name":  "Tana Borer",
            "temp_min":    24, "temp_max": 32,
            "humidity_min": 65, "humidity_max": 90,
            "season":      "kharif",
            "description": "Larvae bore into the stem causing 'dead heart' in seedlings and 'broken tassels' later — tunnelling weakens the plant and allows secondary fungal infection.",
            "prevention": [
                "Remove and destroy stubble and ratoons — larvae overwinter in crop residue.",
                "Release Trichogramma chilonis at 50,000 eggs/ha at egg-laying stage.",
                "Timely planting reduces coincidence with peak moth emergence."
            ],
            "treatment": {
                "organic":   "Trichogramma cards in whorl at fortnightly intervals; Bacillus thuringiensis spray on young whorls.",
                "chemical":  "Cartap hydrochloride 4G (20 kg/ha) granules in whorl; Coragen (Chlorantraniliprole) 0.4G."
            }
        },
    ],

    # ─── Sugarcane ────────────────────────────────────────────────────────────
    "sugarcane": [
        {
            "pest_name":   "Early Shoot Borer",
            "local_name":  "Tekha Borer",
            "temp_min":    26, "temp_max": 35,
            "humidity_min": 65, "humidity_max": 90,
            "season":      "kharif",
            "description": "Larvae bore into young shoots causing 'dead heart' — the central leaf turns yellow and can be pulled out without resistance, smelling rotten.",
            "prevention": [
                "Treat setts with Chlorpyrifos 20 EC (300 ml/100L) before planting.",
                "Remove and destroy dead-heart shoots immediately to break the life cycle.",
                "Maintain a plant population gap of ≤2 cm between setts to reduce bare soil where larvae pupate."
            ],
            "treatment": {
                "organic":   "Apply Beauveria bassiana-based biopesticide (2 kg/ha) in the soil around the base of plants.",
                "chemical":  "Chlorpyrifos 20 EC (2 L/ha) applied in the soil or Fipronil 0.3G granules around the base at first sign."
            }
        },
        {
            "pest_name":   "Pyrilla (Sugarcane Planthopper)",
            "local_name":  "Pyrilla",
            "temp_min":    28, "temp_max": 36,
            "humidity_min": 70, "humidity_max": 90,
            "season":      "kharif",
            "description": "Nymphs and adults suck sap from the underside of leaves, secreting honeydew on which sooty mold grows, blocking light absorption and weakening the plant.",
            "prevention": [
                "Conserve Epiricania melanoleuca, the egg-parasitoid wasp — avoid broad-spectrum insecticides that kill it.",
                "Remove alternate hosts (wild grasses) from field borders.",
                "Light traps for adult monitoring."
            ],
            "treatment": {
                "organic":   "Release Epiricania melanoleuca (available from state biocontrol labs) — highly effective biological control agent.",
                "chemical":  "Only when biocontrol is insufficient: Malathion 50 EC (2 ml/L) or Dimethoate 30 EC (1.5 ml/L)."
            }
        },
    ],

    # ─── Tomato ───────────────────────────────────────────────────────────────
    "tomato": [
        {
            "pest_name":   "Tomato Fruit Borer",
            "local_name":  "Phal Borer / Tomato Keeda",
            "temp_min":    22, "temp_max": 32,
            "humidity_min": 50, "humidity_max": 75,
            "season":      "any",
            "description": "Helicoverpa armigera larvae bore into fruits and consume the interior — a single larva destroys multiple fruits and the entry hole allows secondary rotting.",
            "prevention": [
                "Pheromone traps (5–10/ha) for monitoring and mass trapping of adult moths.",
                "Intercrop with marigold (Tagetes) as a trap crop — fruit borer prefers marigold.",
                "Avoid excessive nitrogen which produces soft, attractive vegetation."
            ],
            "treatment": {
                "organic":   "Bacillus thuringiensis var. kurstaki (Bt-k) spray (1.5 kg/ha) twice at 15-day intervals; Neem seed kernel extract (5%).",
                "chemical":  "Emamectin benzoate 5 SG (0.4 g/L) or Chlorantraniliprole 18.5 SC (0.3 ml/L) alternated every 2 sprays."
            }
        },
        {
            "pest_name":   "Whitefly (Tomato)",
            "local_name":  "Safed Makhi",
            "temp_min":    25, "temp_max": 35,
            "humidity_min": 55, "humidity_max": 80,
            "season":      "any",
            "description": "Bemisia tabaci transmits Tomato Yellow Leaf Curl Virus (TYLCV) — severely infected plants become bushy, yellow, and produce no fruit.",
            "prevention": [
                "Use whitefly-resistant tomato varieties or grafted rootstocks where available.",
                "Silver/reflective mulch on soil surface disorients approaching adults.",
                "Yellow sticky traps (10/ha) for early detection."
            ],
            "treatment": {
                "organic":   "Neem oil (5 ml/L) + soap solution; Beauveria bassiana biopesticide spray targeting the underside of leaves.",
                "chemical":  "Spiromesifen 22.9 SC (1 ml/L) or Pyriproxyfen 10 EC (1 ml/L); avoid repeated neonicotinoids."
            }
        },
        {
            "pest_name":   "Early Blight (Alternaria)",
            "local_name":  "Ageti Jhulsa",
            "temp_min":    24, "temp_max": 30,
            "humidity_min": 75, "humidity_max": 100,
            "season":      "any",
            "description": "Alternaria solani causes dark, concentric-ring lesions on older leaves ('target spots'), leading to defoliation and reduced fruit size.",
            "prevention": [
                "Avoid overhead irrigation — drip irrigation keeps foliage dry.",
                "Remove and destroy infected lower leaves early.",
                "Maintain spacing of at least 45 cm between plants for air circulation."
            ],
            "treatment": {
                "organic":   "Copper oxychloride 50 WP (3 g/L) spray; Trichoderma viride-based biopesticide as a soil drench.",
                "chemical":  "Mancozeb 75 WP (2.5 g/L) or Azoxystrobin 23 SC (1 ml/L) at first sign; repeat every 10 days."
            }
        },
    ],

    # ─── Potato ───────────────────────────────────────────────────────────────
    "potato": [
        {
            "pest_name":   "Late Blight",
            "local_name":  "Pacheti Jhulsa / Aalu Jhulsa",
            "temp_min":    10, "temp_max": 20,
            "humidity_min": 85, "humidity_max": 100,
            "season":      "rabi",
            "description": "Phytophthora infestans — the pathogen that caused the Irish famine — causes rapid, oily-looking dark lesions on leaves and stems that collapse the entire canopy within days under cool, wet conditions.",
            "prevention": [
                "Use certified disease-free seed tubers — field blight almost always enters via infected seed.",
                "Avoid overhead irrigation especially at night; ensure good drainage.",
                "Spray prophylactically during cool, humid spells — do not wait for symptoms."
            ],
            "treatment": {
                "organic":   "Copper hydroxide 77 WP (3 g/L) as a protectant spray; limited effectiveness once infection is established.",
                "chemical":  "Metalaxyl + Mancozeb 72 WP (2.5 g/L) or Cymoxanil + Mancozeb 72 WP (2 g/L) as curative sprays; alternate with Dimethomorph 50 WP."
            }
        },
        {
            "pest_name":   "Aphids (Potato)",
            "local_name":  "Mahu",
            "temp_min":    12, "temp_max": 22,
            "humidity_min": 50, "humidity_max": 75,
            "season":      "rabi",
            "description": "Myzus persicae vectors Potato Virus Y (PVY) and Potato Leaf Roll Virus (PLRV) — infected seed potato can cause 30–80% yield loss in the next crop.",
            "prevention": [
                "Produce seed potato in high-altitude, aphid-free areas where possible.",
                "Silver-coated mulch repels alate aphids from landing.",
                "Eliminate alternate host weeds (Solanum nigrum) from field borders."
            ],
            "treatment": {
                "organic":   "Neem oil spray (5 ml/L) as a deterrent — aphids are soft-bodied and respond to contact oils.",
                "chemical":  "Imidacloprid 17.8 SL (0.3 ml/L) or Thiamethoxam 25 WG (0.2 g/L) as a single early spray; avoid repeated applications to limit resistance."
            }
        },
    ],

    # ─── Chickpea ─────────────────────────────────────────────────────────────
    "chickpea": [
        {
            "pest_name":   "Pod Borer (Chickpea)",
            "local_name":  "Phali Borer / Hari Sundi",
            "temp_min":    18, "temp_max": 28,
            "humidity_min": 40, "humidity_max": 70,
            "season":      "rabi",
            "description": "Helicoverpa armigera larvae feed on leaves and bore into developing pods to eat the grain — the most devastating chickpea pest, capable of 80%+ yield loss in severe infestations.",
            "prevention": [
                "Pheromone traps (5/ha) from 30 DAS — economic threshold is 1 larva per plant or >5 moths/trap/week.",
                "Intercrop chickpea with coriander or fennel — floral volatiles attract Helicoverpa parasitoids.",
                "Maintain a clean field — pupae overwinter in soil; deep ploughing after harvest destroys them."
            ],
            "treatment": {
                "organic":   "Bacillus thuringiensis var. kurstaki (1.5 kg/ha) or HaNPV (Helicoverpa nuclear polyhedrosis virus, 250 LE/ha) — most effective when sprayed on young larvae.",
                "chemical":  "Emamectin benzoate 5 SG (0.4 g/L) or Chlorantraniliprole 18.5 SC (0.3 ml/L); spray in the evening when larvae are feeding."
            }
        },
        {
            "pest_name":   "Cutworm",
            "local_name":  "Kala Keeda / Safed Keeda",
            "temp_min":    15, "temp_max": 25,
            "humidity_min": 50, "humidity_max": 75,
            "season":      "rabi",
            "description": "Agrotis spp. larvae cut seedlings at the soil surface at night, causing circular patches of dead seedlings and gaps in stand establishment.",
            "prevention": [
                "Deep summer ploughing exposes pupae to predators and solar radiation.",
                "Flood irrigation before sowing drives larvae to the surface for bird predation.",
                "Light traps to monitor adult moth emergence."
            ],
            "treatment": {
                "organic":   "Metarhizium anisopliae biopesticide applied as a soil drench near affected areas.",
                "chemical":  "Chlorpyrifos 20 EC (2 ml/L) as a directed soil spray around the base of affected plants; poison bait (rice bran + Chlorpyrifos) placed in furrows at dusk."
            }
        },
    ],
}


# ── Risk assessment function ──────────────────────────────────────────────────

def _proximity_score(value: float, lo: float, hi: float) -> int:
    """
    Compute a 0–100 proximity score: how closely 'value' falls within [lo, hi].
    - 100: value is at the midpoint (peak favorable)
    - 1–99: value is within range but off-centre
    - 0: value is outside [lo, hi] entirely
    """
    if value < lo or value > hi:
        return 0
    midpoint = (lo + hi) / 2
    half_range = (hi - lo) / 2
    if half_range == 0:
        return 100
    distance_from_mid = abs(value - midpoint)
    # 100 at midpoint, linearly approaches ~0 at the edges
    score = 100 * (1 - distance_from_mid / half_range)
    return max(1, round(score))  # always ≥ 1 if within range


def assess_pest_risk(
    crop:            str,
    current_temp:    float,
    current_humidity: int,
) -> List[Dict[str, Any]]:
    """
    Given a crop and current weather conditions, return a list of pests at
    elevated risk (score > 0), sorted from highest to lowest risk.

    Args:
        crop             : crop name (case-insensitive)
        current_temp     : current temperature (°C)
        current_humidity : current relative humidity (%)

    Returns:
        list of dicts, each with:
            pest_name, local_name, risk_level ("high"|"moderate"|"low"),
            risk_score (0–100), description, prevention, treatment, off_season
    """
    crop_key = (crop or "").lower().strip()
    pests = PEST_RISK_TABLE.get(crop_key, [])
    current_season = _current_season()

    results = []
    for pest in pests:
        temp_score  = _proximity_score(current_temp, pest["temp_min"], pest["temp_max"])
        humid_score = _proximity_score(current_humidity, pest["humidity_min"], pest["humidity_max"])

        # Overall score: geometric mean to require both temp AND humidity to be favourable
        if temp_score == 0 or humid_score == 0:
            risk_score = 0
        else:
            risk_score = round(math.sqrt(temp_score * humid_score))

        if risk_score == 0:
            continue  # not in favourable range at all — skip

        # Determine risk level
        if risk_score >= 70:
            risk_level = "high"
        elif risk_score >= 40:
            risk_level = "moderate"
        else:
            risk_level = "low"

        # Flag if pest is seasonally unlikely (off-season note, not removed)
        pest_season = pest.get("season", "any")
        off_season  = (pest_season != "any") and (pest_season != current_season)

        results.append({
            "pest_name":   pest["pest_name"],
            "local_name":  pest.get("local_name", ""),
            "risk_level":  risk_level,
            "risk_score":  risk_score,
            "description": pest["description"],
            "prevention":  pest["prevention"],
            "treatment":   pest["treatment"],
            "off_season":  off_season,
            "season_note": (
                f"Note: This pest is more typical in {pest_season} season — "
                "current conditions are favourable but incidence may be lower."
            ) if off_season else None,
        })

    # Sort by risk_score descending
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return results


def get_supported_crops() -> List[str]:
    """Return the list of crops currently covered by the pest risk table."""
    return list(PEST_RISK_TABLE.keys())
