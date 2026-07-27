document.addEventListener('DOMContentLoaded', () => {
    const chatBtn       = document.getElementById('chat-toggle-btn');
    const chatContainer = document.getElementById('chat-container');
    const closeChatBtn  = document.getElementById('close-chat');
    const sendBtn       = document.getElementById('send-btn');
    const chatInput     = document.getElementById('chat-input');
    const messagesDiv   = document.getElementById('chat-messages');
    const fileInput     = document.getElementById('chat-file-input');
    const fileLabel     = document.querySelector('.file-upload-label');
    const voiceBtn      = document.getElementById('voice-btn');
    const langSelect    = document.getElementById('chat-lang-select');

    if (!chatBtn || !chatContainer) return;

    // ── Header ────────────────────────────────────────────────────
    const header = document.querySelector('.chat-header span:first-child');
    if (header) {
        header.innerHTML = `
            <div class="chat-header-info">
                <div>
                    <div style="font-weight:700;font-size:1rem;"><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span> Kisan AI</div>
                    <div class="chat-online" style="font-size:0.72rem;opacity:0.85;"><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>smart_toy</span> Gemini Powered • 12 Languages</div>
                </div>
            </div>`;
    }

    // ── Language maps ──────────────────────────────────────────────
    const langCodeMap = {
        'en':'en-IN','hi':'hi-IN','gu':'gu-IN','mr':'mr-IN',
        'pa':'pa-IN','ta':'ta-IN','te':'te-IN','bn':'bn-IN',
        'kn':'kn-IN','ml':'ml-IN','or':'or-IN','ur':'ur-IN'
    };

    function getLang() { return langSelect ? langSelect.value : 'en'; }

    // ── Quick-reply categories ────────────────────────────────────
    const quickTopics = [
        { emoji:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>', label:'Wheat tips'        , query:'wheat farming tips and fertilizer dose' },
        { emoji:'', label:'Rice/Paddy'         , query:'paddy rice cultivation and disease control' },
        { emoji:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span>', label:'Fertilizer guide'   , query:'best fertilizer NPK dose for crops' },
        { emoji:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span>', label:'Soil testing'        , query:'how to do soil testing at home' },
        { emoji:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>wb_sunny</span>', label:'Weather advice'      , query:'farming advice based on weather today' },
        { emoji:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span>', label:'Irrigation'          , query:'drip vs sprinkler irrigation which is better' },
        { emoji:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span>', label:'Pest control'        , query:'organic pest control methods for crops' },
        { emoji:'️', label:'Govt Schemes'        , query:'PM-Kisan and KCC government farming scheme details' },
        { emoji:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>payments</span>', label:'Mandi prices'        , query:'current wheat rice tomato mandi prices India' },
        { emoji:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>', label:'Organic farming'     , query:'how to start organic farming step by step' },
    ];

    // Build quick-reply bar
    const quickBar = document.createElement('div');
    quickBar.className = 'chat-quick-replies';
    quickBar.id = 'quick-replies-bar';
    quickTopics.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = `${t.emoji} ${t.label}`;
        btn.onclick = () => { chatInput.value = t.query; sendMessage(); };
        quickBar.appendChild(btn);
    });
    chatContainer.insertBefore(quickBar, messagesDiv);

    // ── Date divider ─────────────────────────────────────────────
    const dateDiv = document.createElement('div');
    dateDiv.className = 'chat-date-divider';
    dateDiv.textContent = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    messagesDiv.appendChild(dateDiv);

    // ── Toggle ────────────────────────────────────────────────────
    chatBtn.addEventListener('click', () => {
        chatContainer.classList.toggle('active');
        if (chatContainer.classList.contains('active')) chatInput.focus();
    });
    closeChatBtn.addEventListener('click', () => chatContainer.classList.remove('active'));

    // ── File select ───────────────────────────────────────────────
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                if (fileLabel) fileLabel.style.color = '#2ecc71';
                chatInput.placeholder = ' Image attached. Add your question...';
            }
        });
    }

    // ══════════════════════════════════════════════════════════════
    //  SMART FARMING OFFLINE AI ENGINE
    //  Works even when backend is down — 25+ farming topics
    // ══════════════════════════════════════════════════════════════
    const farmingDB = {
        greeting: {
            keys: ['hello','hi','hey','namaste','namaskar','help','start','begin','kem cho','sat sri','vanakkam'],
            reply: ` **Namaste! I'm Kisan AI Assistant!**

I'm your 24/7 smart farming consultant. Ask me anything about:

| Topic | Examples |
|---|---|
| <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span> **Crops** | Wheat, Rice, Cotton, Tomato |
| <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> **Fertilizers** | Urea, DAP, NPK, Nano Urea |
| <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> **Pest Control** | Neem oil, Bio-pesticides |
| <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> **Irrigation** | Drip, Sprinkler tips |
| ️ **Weather** | Rain advisory, heat stress |
| <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>payments</span> **Market** | Live Mandi rates |
| ️ **Schemes** | PM-Kisan, KCC, PMFBY |
| <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span> **Organic** | Vermicompost, SRI method |

Just type your question or use  voice in your language!`
        },

        wheat: {
            keys: ['wheat','gehun','gahu','gandum'],
            reply: `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span> **Wheat Farming Guide:**

** Sowing Time:** Nov 1 – Dec 15
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>thermostat</span> Temp:** 10–25°C (germination), 21–26°C (growth)
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> Irrigation:** 5–6 times at critical stages:
- Crown root (20-25 DAS)
- Tillering (40-45 DAS)
- Jointing (60-65 DAS)
- Flowering (80-85 DAS)
- Grain filling (100-105 DAS)

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> Fertilizer Dose (per acre):**
- Basal: DAP 50 kg + MOP 25 kg
- Top dress: Urea 35 kg at tillering

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>warning</span> Common Diseases:**
- Yellow/Brown rust → Propiconazole spray
- Loose smut → Seed treatment with Vitavax

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>check_circle</span> Variety Tips:** HD-2967, GW-496, Lok-1`
        },

        rice: {
            keys: ['rice','paddy','dhan','chawal','kharif'],
            reply: ` **Paddy / Rice Cultivation:**

** Season:** Kharif – Transplant June–July
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> Water:** Maintain 5 cm water level in field

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span> Nursery:**
- Seed rate: 25 kg/acre for transplant
- Nursery age: 25–30 days

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> Fertilizer (per acre):**
- Basal: DAP 25 kg + Zinc Sulphate 5 kg
- Tillering: Urea 30 kg
- Panicle initiation: Urea 20 kg + MOP 10 kg

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> Key Pests:**
- Stem borer → Cartap Hydrochloride
- Brown plant hopper → Imidacloprid
- Blast disease → Tricyclazole spray

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>trending_up</span> High-yield varieties:** IR-64, PR-126, Pusa Basmati-1121`
        },

        cotton: {
            keys: ['cotton','kapas','kapas','narma','gossypium'],
            reply: `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>cloud</span> **Cotton Farming Tips:**

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span> Sowing:** April–June (Kharif)
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span> Soil:** Black (Vertisol) / Sandy loam

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> Fertilizer (per acre):**
- Basal: DAP 25 kg + MOP 15 kg
- 30 DAS: Urea 20 kg
- 60 DAS: Urea 20 kg + MOP 10 kg

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> Pest Management:**
- Bollworms → Bt spray / Spinosad
- Whitefly → Neem oil + Yellow sticky traps
- Aphids → Imidacloprid 0.005%

** Key Tip:** Plant Bt Cotton varieties to reduce pesticide use by 50%

** Harvest:** Pick dry bolls in morning to reduce moisture`
        },

        tomato: {
            keys: ['tomato','tamatar','tameta','lycopersicon'],
            reply: ` **Tomato Cultivation Guide:**

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>thermostat</span> Climate:** 20-27°C, avoid frost
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span> Seedling:** Raise in nursery for 25-30 days

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> Fertilizer (per acre):**
- Basal: FYM 4 tonnes + DAP 40 kg + MOP 25 kg
- Fruit set: 19:19:19 (2g/litre foliar)
- Fruiting: 0:52:34 (2g/litre foliar)

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> Irrigation:** Drip irrigation preferred
- Critical: Flowering and fruit development stages

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> Diseases:**
- Early Blight → Mancozeb 75% WP spray
- Late Blight → Metalaxyl + Mancozeb
- Leaf curl virus → Control whitefly vector

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>payments</span> Market Price:** ₹15–60/kg (seasonal)`
        },

        fertilizer: {
            keys: ['fertilizer','urea','dap','npk','potash','mop','nano urea','fertiliser','khad','khatar','khaad','manure'],
            reply: `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> **Fertilizer Complete Guide:**

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>bar_chart</span> Major Fertilizers:**

| Fertilizer | Nutrient | Best For |
|---|---|---|
| Urea | 46% N | Leafy growth, top dress |
| DAP | 18N:46P | Root development, basal |
| MOP | 60% K | Fruit quality, disease resist |
| NPK 19:19:19 | Balanced | Foliar spray all stages |
| Nano Urea | 4% N | Top dress foliar (60% cheaper) |
| Zinc Sulphate | Zinc | Deficiency correction |

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>check_circle</span> Golden Rules:**
1. Always do soil test first
2. Split Urea in 2-3 doses (less loss)
3. Apply in moist soil only
4. Do NOT mix Urea with DAP directly
5. Nano Urea: 2-4 ml per litre water spray

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span> Organic Options:**
- Vermicompost: 1 tonne/acre
- FYM (Farm yard manure): 4 tonnes/acre`
        },

        soil: {
            keys: ['soil','mitti','bhoomi','bhumi','ph','organic matter','soil test','soil health'],
            reply: ` **Soil Health Guide:**

** Soil Testing (Every 3 Years):**
1. Collect samples 0–15 cm depth
2. Mix 10 spots from field
3. Send 500g to Soil Testing Lab (free at KVK)

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>bar_chart</span> Ideal Soil pH:** 6.0–7.5
- Acidic (pH <6): Add **Lime** @ 2 kg/acre
- Alkaline (pH >8): Add **Gypsum** @ 4 kg/acre

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span> Improve Organic Matter:**
- Add Vermicompost annually
- Practice green manuring (Dhaincha/Sunn Hemp)
- Avoid burning crop residue

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>history</span> Macro Nutrients:**
- **N (Nitrogen):** Leaf yellowing if deficient → Urea
- **P (Phosphorus):** Poor root/flower → DAP
- **K (Potassium):** Weak stems, scorched tips → MOP

** Tip:** One free soil test kit at Soil Health Card kiosk (Govt)`
        },

        pest: {
            keys: ['pest','insect','bug','worm','disease','fungus','virus','caterpillar','nematode','aphid','whitefly','thrips','mite','blight'],
            reply: `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> **Integrated Pest Management (IPM):**

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span> Organic / Prevention:**
- **Neem Oil:** 5ml/litre water spray — works for 30+ pests
- **Yellow sticky traps:** Catches whitefly, aphids (5/acre)
- **Crop rotation:** Breaks pest & disease cycles (MUST do)
- **Border crops:** Maize border repels pests from vegetables

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> Biological Control:**
- **Trichoderma:** Soil application for root rot/wilt
- **Beauveria bassiana:** Spray for caterpillars
- **Trichogramma cards:** Hanged in field against bollworm

** Chemical (Last Resort) — Dosage per acre:**
| Pest | Chemical | Dose |
|---|---|---|
| Aphid/Whitefly | Imidacloprid 17.8 SL | 60 ml in 200L water |
| Caterpillars | Spinosad 45 SC | 75 ml in 200L water |
| Fungal diseases | Mancozeb 75 WP | 400g in 200L water |

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>warning</span> Always:** Wear gloves & mask. Read label. Wait 7 days before harvest.`
        },

        weather: {
            keys: ['weather','rain','temperature','climate','forecast','cloud','heat','drought','flood','humid','moisture','barish','garmi','sardi'],
            reply: `️ **Weather-Based Farming Advisory:**

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>wb_sunny</span> Hot Weather (>40°C) Tips:**
- Irrigate early morning (4-7 AM) or evening (6-8 PM)
- Mulch with dry grass/straw to retain soil moisture
- Avoid spraying pesticides during peak heat
- Use shade nets for vegetable nurseries

**️ Heavy Rainfall Advisory:**
- Drain excess water from field within 24 hours
- Apply fungicide after standing water — risk of root rot
- Delay fertilizer application till soil firms up
- Watch for stem rot, downy mildew after heavy rain

** Cold/Frost Advisory:**
- Smoke in field to increase warmth (traditional)
- Light irrigation before frost night helps
- Cover nursery beds with straw/polythene

** Use the Weather tab on KisanCare for live hourly forecast!**

 *Ask me: "When should I irrigate?" or "Spray in summer?"*`
        },

        irrigation: {
            keys: ['water','irrigation','drip','sprinkler','flood','furrow','canal','borewell','water pump','paani','sinchai'],
            reply: `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> **Irrigation Management:**

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>bar_chart</span> Comparison Table:**
| Method | Water Saving | Best For | Cost |
|---|---|---|---|
| Flood | 0% | Rice, Sugarcane | Very Low |
| Furrow | 20–30% | Row crops | Low |
| Sprinkler | 35–50% | Wheat, Groundnut | Medium |
| Drip | 50–70% | Vegetables, Fruits | High |

** Drip Irrigation Tips:**
- Lateral spacing: 45–60 cm for vegetables
- Flow rate: 2–4 L/hour per dripper
- Use fertigation tank to inject fertilizer directly
- Flush laterals every 15 days to avoid clogging

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span> PM Sinchai Yojana:**
- Govt subsidy 55% for small farmers on drip systems
- Apply at: pmksy.gov.in or your district agriculture office

** Best Irrigation Time:**
- Vegetables: Daily (drip) or alternate days
- Wheat: At Crown root, Tillering, Jointing, Flowering
- Avoidance: Never irrigate before heavy rain forecast!`
        },

        organic: {
            keys: ['organic','jaivik','vermi','compost','green manure','bio fertilizer','cow dung','gobar gas','natural farming','zero budget'],
            reply: `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span> **Organic & Natural Farming:**

** Vermicompost:**
- Use earthworms (Eisenia fetida) to decompose waste
- Ready in 45-60 days
- Apply 500 kg–1 tonne/acre

** Jeevamrit (Zero Budget Natural Farming):**
**Recipe (for 200 litres):**
- 10 kg fresh cow dung
- 5–10 litres cow urine
- 1 kg jaggery (brown sugar)
- 1 kg gram flour (besan)
- Ferment 48 hours, apply 200 L/acre as drip/spray

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span> Panchagavya (Boost immune system):**
- Mix: Cow dung + urine + milk + curd + ghee
- Apply 3% solution as foliar spray

** Cost comparison:**
- Chemical farming: ₹15,000–25,000/acre
- Organic farming: ₹8,000–12,000/acre (after 2 yrs)

** Certification:** Apply at PGS-India or APEDA for export premium price`
        },

        govt_schemes: {
            keys: ['scheme','yojana','government','pm-kisan','kcc','pmfby','insurance','subsidy','kisan','loan','krishi','msp'],
            reply: `️ **Government Farming Schemes 2024-25:**

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>payments</span> PM-Kisan Samman Nidhi:**
- ₹6,000/year (₹2,000 × 3 times) direct to account
- Register: pmkisan.gov.in or CSC Center
- Eligibility: Land-owning farmers

** Kisan Credit Card (KCC):**
- Crop loan at 4% interest (after subsidy)
- Limit: Based on land holding & crop
- Apply: SBI, PNB, any nationalized bank

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>umbrella</span> PMFBY (Fasal Bima):**
- Crop insurance premium: just 1.5% (Rabi) / 2% (Kharif)
- Claim process: Notify within 72 hours of damage
- Register: fasal.gov.in

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span> Soil Health Card:**
- Free soil testing every 2 years
- Contact: Local KVK or Agriculture office

** PM Sinchai Yojana:**
- Drip/sprinkler subsidy: 55-75% for small farmers

** Helful Apps:** PM-Kisan App, mKisan, eNAM for prices`
        },

        market: {
            keys: ['price','market','rate','mandi','sell','crop price','bhav','rate','apmc','kharidi'],
            reply: `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>payments</span> **Market / Mandi Price Guide:**

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>bar_chart</span> Approximate MSP (2024-25):**
| Crop | MSP ₹/Quintal |
|---|---|
| <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span> Wheat | ₹2,275 |
|  Paddy (Common) | ₹2,300 |
| <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>cloud</span> Cotton (Medium) | ₹7,121 |
|  Sunflower | ₹7,280 |
|  Groundnut | ₹6,783 |
|  Maize | ₹2,225 |

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>trending_up</span> How to Get Best Price:**
1. Check eNAM portal (enam.gov.in) for live rates
2. Sell in bulk — better negotiation
3. Avoid selling immediately after harvest (prices are lowest)
4. Use FPO (Farmer Producer Organization) for collective selling

** KisanCare Market Page:**
- Go to Market Prices tab for live APMC data

** Tip:** Store grains in NABARD-approved warehouse and get loan against receipt!`
        },

        banana: {
            keys: ['banana','kela','plantain','keli'],
            reply: ` **Banana Cultivation:**
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>thermostat</span> Climate:** 15–35°C, humid
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span> Spacing:** 1.5m × 1.5m (Tissue culture) or 3m × 3m conventional

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> Fertilizer per plant/year:**
- N: 200g, P: 60g, K: 300g (split in 4 doses)
- Banana needs high Potassium — use MOP 300g/plant

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> Irrigation:** Every 3–7 days, drip preferred
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> Panama Wilt:** No cure — use disease-free suckers
** Harvest:** 11–14 months after planting`
        },

        sugarcane: {
            keys: ['sugarcane','ganna','ikshu','sugar'],
            reply: ` **Sugarcane Cultivation:**
** Planting:** Feb-March (spring) or Oct-Nov (autumn)
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> Fertilizer per acre:** N:160 kg, P:80 kg, K:60 kg

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> Irrigation:** Every 7-10 days, drip fertigation best
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> Top Borer:** Apply Cartap Hydrochloride granules at heart
** Harvest:** 10–12 months (spring), 14–16 months (autumn)
**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>payments</span> Income:** ₹25,000–40,000/acre potential`
        },

        loan: {
            keys: ['loan','credit','bank','finance','borrow','rin','karza'],
            reply: ` **Farming Loan Guide:**

** Kisan Credit Card (KCC):**
- Max loan: Based on scale of finance × area
- Interest: 7% (4% after Govt 3% interest subvention)
- Repayment: 12 months from disbursement
- Documents needed: Land record, Aadhaar, bank passbook

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>history</span> Crop Loan (Short-term):**
- For: Seeds, fertilizers, pesticides, labour
- Up to: ₹3 lakh at 4% (if repaid timely)

**️ NABARD loans:**
- Farm mechanization, storage facility, irrigation
- Subsidy up to 25–33%

** Digital Loans:**
- Agristack integrated — some banks offer GPS-verified crop loans
- Max ₹1.6 lakh without collateral

**Apply at:** Nearest nationalized bank or Primary Cooperative Society`
        },

        msp: {
            keys: ['msp','minimum support','support price','procurement','khanna','procurement price'],
            reply: `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>history</span> **MSP (Minimum Support Price) 2024-25:**

**What is MSP?** Government-guaranteed floor price to protect farmers.

**How to sell at MSP:**
1. Register at your State Procurement Portal (e.g., iharyana.gov.in)
2. Get registration number before harvest
3. Bring crop to nearest APMC / Procurement center
4. Get payment directly to bank in 3 days

** Key Points:**
- MSP is announced before each crop season
- eNAM (e-National Agriculture Market) allows online selling
- FPO members get better access to procurement

** Helpline:** PM-Kisan Helpline: 155261 / 1800-115-526 (Toll free)`
        },

        seeds: {
            keys: ['seed','beej','variety','hybrid','bt','heirloom','seedling'],
            reply: `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span> **Seed Selection Guide:**

**Types of Seeds:**
| Type | Cost | Replant? | Yield |
|---|---|---|---|
| Open Pollinated (OP) | Low | Yes | Moderate |
| Hybrid (F1) | Medium | No | High |
| Bt/GM | High | No | Very High |

**Where to Buy:**
- Government seed stores (subsidized)
- NSC (National Seeds Corporation)
- State Seed Corp (e.g., MSSC, GSSC)
- Certified private dealers (check tag!)

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>check_circle</span> Quality Check:**
- Look for Certification Tag (Blue for Breeder, White for Foundation)
- Test germination: Sprout 10 seeds on wet cloth — 8+ should sprout
- Avoid loose/untreated seeds to prevent disease

** Seed treatment before sowing:**
- Thiram or Carbendazim @ 2g/kg seed`
        },

        neem: {
            keys: ['neem','azadirachtin','bio pesticide','neem oil'],
            reply: ` **Neem — The Farmer's Best Friend:**

**Neem Oil Spray:**
- Dose: 5 ml Neem oil + 2 ml liquid soap per 1 litre water
- Spray in early morning or evening
- Effective against: Aphids, whitefly, mites, thrips, mealybug

**Neem Cake (Soil Application):**
- Apply 100 kg/acre before sowing
- Controls soil nematodes, root grubs, termites
- Also improves soil organic matter

**Neem-based products available:**
- NSKE 5% (Neem Seed Kernel Extract)
- Achook (commercial Azadirachtin spray)
- Neemark cake fertilizer

**<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>payments</span> Cost vs Chemical:**
- Neem oil: ₹150–250/litre (lasts per acre)
- Synthetic pesticide: ₹500–2000/acre
- Neem is 70% cheaper and 100% organic-safe!`
        }
    };

    /**
     * Smart offline farming AI — keyword match with confidence scoring
     */
    function getSmartOfflineReply(userMessage) {
        const msg = userMessage.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        for (const [topic, data] of Object.entries(farmingDB)) {
            const score = data.keys.reduce((s, kw) => msg.includes(kw) ? s + 1 : s, 0);
            if (score > bestScore) { bestScore = score; bestMatch = data.reply; }
        }

        if (bestScore > 0) return bestMatch;

        // Generic fallback for farming questions not in DB
        return ` **I can help with that!**

I didn't find an exact match, but here are the farming topics I cover:

<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span> Wheat • Rice • Cotton • Tomato • Banana • Sugarcane
<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span> Urea • DAP • NPK • Nano Urea • Organic fertilizers
<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> Drip • Sprinkler • Canal irrigation
<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> Pests • Diseases • Neem spray • IPM
️ Weather advisory • Drought • Frost protection
<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>payments</span> Mandi prices • MSP • eNAM platform
️ PM-Kisan • KCC loan • PMFBY insurance • Soil Health Card
<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span> Organic farming • Vermicompost • Zero budget farming

**Try asking more specifically:**
- *"How to apply Urea for wheat?"*
- *"What is PM-Kisan scheme?"*
- *"How to control aphids organically?"*`;
    }

    // ══════════════════════════════════════════════════════════════
    //  VOICE INPUT — Speech-to-Text
    // ══════════════════════════════════════════════════════════════
    let recognition = null;
    let isRecording  = false;

    const voiceStatus = document.createElement('div');
    voiceStatus.className = 'voice-status';
    voiceStatus.textContent = ' Listening...';
    if (voiceBtn) voiceBtn.appendChild(voiceStatus);

    function initSpeechRecognition() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { alert('<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>warning</span> Voice input not supported. Please use Chrome or Edge browser.'); return null; }

        const rec = new SR();
        rec.continuous      = false;
        rec.interimResults  = true;
        rec.maxAlternatives = 1;
        rec.lang = langCodeMap[getLang()] || 'en-IN';

        const listeningLabels = {
            'en':' Listening...','hi':' सुन रहा हूँ...','gu':' સાંભળી રહ્યો છું...',
            'mr':' ऐकत आहे...','pa':' ਸੁਣ ਰਿਹਾ ਹਾਂ...','ta':' கேட்கிறேன்...',
            'te':' వింటున్నాను...','bn':' শুনছি...','kn':' ಕೇಳುತ್ತಿದ್ದೇನೆ...',
            'ml':' കേൾക്കുന്നു...','or':' ଶୁଣୁଛି...','ur':' سن رہا ہوں...'
        };

        rec.onstart = () => {
            isRecording = true;
            if (voiceBtn) voiceBtn.classList.add('recording');
            voiceStatus.textContent = listeningLabels[getLang()] || ' Listening...';
            voiceStatus.classList.add('visible');
        };

        rec.onresult = (e) => {
            let transcript = '';
            for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript;
            chatInput.value = transcript;
        };

        rec.onend = () => {
            isRecording = false;
            if (voiceBtn) voiceBtn.classList.remove('recording');
            voiceStatus.classList.remove('visible');
            if (chatInput.value.trim()) sendMessage();
        };

        rec.onerror = (e) => {
            isRecording = false;
            if (voiceBtn) voiceBtn.classList.remove('recording');
            voiceStatus.classList.remove('visible');
            if (e.error === 'not-allowed') alert(' Microphone access denied. Allow mic permission in browser settings.');
        };

        return rec;
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (isRecording && recognition) { recognition.stop(); return; }
            recognition = initSpeechRecognition();
            if (recognition) { try { recognition.start(); } catch(e) {} }
        });
    }

    // ══════════════════════════════════════════════════════════════
    //  TEXT-TO-SPEECH — Read Bot Reply Aloud
    // ══════════════════════════════════════════════════════════════
    function speakText(text, button) {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            document.querySelectorAll('.msg-speak-btn.speaking').forEach(b => b.classList.remove('speaking'));
            return;
        }
        const clean = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/[|]/g, '. ')
            .replace(/[-]{3,}/g, '')
            .replace(/[<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>cloud</span><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>science</span><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span>️<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>payments</span>️<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>history</span>]/g, '')
            .replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();
        if (!clean) return;

        const utt = new SpeechSynthesisUtterance(clean);
        utt.lang  = langCodeMap[getLang()] || 'en-IN';
        utt.rate  = 0.9;
        utt.pitch = 1.0;
        if (button) button.classList.add('speaking');
        utt.onend  = () => { if (button) button.classList.remove('speaking'); };
        utt.onerror = () => { if (button) button.classList.remove('speaking'); };
        window.speechSynthesis.speak(utt);
    }

    // ══════════════════════════════════════════════════════════════
    //  SEND MESSAGE — Backend → Offline Fallback
    // ══════════════════════════════════════════════════════════════
    async function sendMessage() {
        const text = chatInput.value.trim();
        const file = fileInput ? fileInput.files[0] : null;
        if (!text && !file) return;

        appendMessage('user', text, file);
        chatInput.value = '';
        if (fileInput) fileInput.value = '';
        if (fileLabel) fileLabel.style.color = '';
        chatInput.placeholder = 'Type or  speak your farming question...';

        const typingEl = showTyping();
        const formData = new FormData();
        formData.append('message', text);
        formData.append('language', getLang());
        if (file) formData.append('image', file);

        let reply = '';

        try {
            const res = await Promise.race([
                fetch('http://localhost:5001/chat', { method:'POST', body: formData }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000))
            ]);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            reply = data.reply || data.error || "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>warning</span> No response received.";
        } catch (err) {
            console.warn('Backend unavailable — using offline AI:', err.message);
            // ── Smart offline engine ──
            await new Promise(r => setTimeout(r, 600)); // simulate thinking
            reply = getSmartOfflineReply(text || 'hello');
        }

        removeTyping(typingEl);
        appendMessage('bot', reply);
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

    // ── Append Message ────────────────────────────────────────────
    function appendMessage(sender, text, imageFile = null) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);

        if (text) {
            const p = document.createElement('p');
            let html = text
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:inherit;text-decoration:underline;">$1</a>');

            // Table rendering
            if (html.includes('|')) {
                const lines = html.split('<br>');
                const tableLines = lines.filter(l => l.trim().startsWith('|'));
                if (tableLines.length >= 2) {
                    let tbl = '<div style="overflow-x:auto;"><table style="font-size:0.76rem;border-collapse:collapse;margin:8px 0;width:100%;min-width:220px;">';
                    tableLines.forEach((row, i) => {
                        if (row.includes('---')) return;
                        const cells = row.split('|').filter(c => c.trim());
                        const tag = i === 0 ? 'th' : 'td';
                        const style = i === 0
                            ? 'background:rgba(46,204,113,0.85);color:white;padding:5px 10px;text-align:left;'
                            : 'padding:4px 10px;border-bottom:1px solid rgba(0,0,0,0.07);';
                        tbl += '<tr>' + cells.map(c => `<${tag} style="${style}">${c.trim()}</${tag}>`).join('') + '</tr>';
                    });
                    tbl += '</table></div>';
                    const tableStart = html.indexOf(tableLines[0]);
                    const tableEnd   = html.lastIndexOf(tableLines[tableLines.length - 1]);
                    html = html.substring(0, tableStart) + tbl + html.substring(tableEnd + tableLines[tableLines.length-1].length);
                }
            }
            p.innerHTML = html;
            msgDiv.appendChild(p);
        }

        if (imageFile) {
            const img = document.createElement('img');
            img.style.cssText = 'max-width:100%;border-radius:8px;margin-top:6px;';
            const reader = new FileReader();
            reader.onload = e => img.src = e.target.result;
            reader.readAsDataURL(imageFile);
            msgDiv.appendChild(img);
        }

        // Timestamp
        const timeEl = document.createElement('span');
        timeEl.className = 'msg-time';
        timeEl.textContent = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
        msgDiv.appendChild(timeEl);

        // Listen button on bot messages
        if (sender === 'bot' && text) {
            const speakBtnEl = document.createElement('button');
            speakBtnEl.className = 'msg-speak-btn';
            speakBtnEl.title = 'Listen to this reply';
            speakBtnEl.innerHTML = '<span class="material-icons">volume_up</span> Listen';
            speakBtnEl.addEventListener('click', () => speakText(text, speakBtnEl));
            msgDiv.appendChild(speakBtnEl);
        }

        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // ── Typing indicator ──────────────────────────────────────────
    function showTyping() {
        const el = document.createElement('div');
        el.className = 'typing-indicator';
        el.id = 'typing-' + Date.now();
        el.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        messagesDiv.appendChild(el);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return el;
    }
    function removeTyping(el) { if (el && el.parentNode) el.remove(); }

    // ── Voice Input (Speech-to-Text) ───────────────────────────────
    if (voiceBtn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            let isRecording = false;

            voiceBtn.addEventListener('click', () => {
                if (isRecording) {
                    recognition.stop();
                    return;
                }
                
                // Set language based on current selector
                const langCode = langCodeMap[getLang()] || 'en-IN';
                recognition.lang = langCode;
                
                try {
                    recognition.start();
                    isRecording = true;
                    voiceBtn.classList.add('recording');
                    voiceBtn.style.color = '#dc2626'; // red while recording
                    chatInput.placeholder = 'Listening... Speak now';
                } catch (e) {
                    console.error('Speech recognition error', e);
                }
            });

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                chatInput.value = transcript;
                // Automatically send message after voice input
                sendMessage();
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please allow microphone permissions to use voice input.');
                }
            };

            recognition.onend = () => {
                isRecording = false;
                voiceBtn.classList.remove('recording');
                voiceBtn.style.color = ''; 
                chatInput.placeholder = 'Type a message...';
            };
        } else {
            // Browser doesn't support Web Speech API
            voiceBtn.addEventListener('click', () => {
                alert('Voice input is not supported in this browser. Try Chrome or Edge.');
            });
            voiceBtn.style.opacity = '0.5';
        }
    }
});
