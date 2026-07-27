// =============================================
// RICH generateAdvice() — Smart Fertilizer Advisor
// advisor.js — KisanCare
// =============================================

function generateAdvice() {
    var cropKey = document.getElementById('advisorCrop').value;
    var soilKey = document.getElementById('advisorSoil').value;
    if (!cropKey || !soilKey) { showToast('Please select both Crop and Soil type!'); return; }
    if (!liveWeather) { showToast('Please fetch live weather first! Enter your city and click Get Weather.'); return; }
    var crop = cropSoilDB[cropKey];
    if (!crop) { showToast('Crop data not available.'); return; }

    var w = liveWeather;
    var soilSuitability = (crop.soilNeeds && crop.soilNeeds[soilKey]) ? crop.soilNeeds[soilKey] : 'Medium';
    var allFerts = (crop.basalFert || []).concat(crop.topDressFert || []);

    // ── WEATHER ALERT ─────────────────────────────────────────────
    var alertClass, alertMsg;
    if (w.rain1h > 5) {
        alertClass = 'alert-rain';
        alertMsg = '<strong>Rain Alert (' + w.rain1h + ' mm):</strong> Aaj khad bilkul mat dalein! Barish mein fertilizer beh jaata hai — paise barbad hote hain.<br><em>Wait 24-48 hrs after rain stops before applying any fertilizer.</em>';
    } else if (w.temp > 40) {
        alertClass = 'alert-hot';
        alertMsg = '<strong>Extreme Heat (' + w.temp + 'C):</strong> Urea bahut jaldi volatilize ho jaata hai. Subh 6-8 baje ya shaam 5-7 baje hi khad dalein, turant pani dalein.<br><em>Apply only in early morning or evening. Irrigate immediately after.</em>';
    } else if (w.temp < 12) {
        alertClass = 'alert-cold';
        alertMsg = '<strong>Cold Weather (' + w.temp + 'C):</strong> Thandi mein jaadein slow hoti hain. Liquid ya foliar fertilizer zyada fayda dega.<br><em>Use liquid/soluble fertilizers. Soil absorption slows significantly in cold.</em>';
    } else if (w.humidity > 85) {
        alertClass = 'alert-humid';
        alertMsg = '<strong>High Humidity (' + w.humidity + '%):</strong> Nami zyada hai. Neem-coated Urea use karein. Foliar spray avoid karein fungus ke khatare se.<br><em>High humidity causes fungal risk and nitrogen volatilization loss.</em>';
    } else if (w.temp >= 20 && w.temp <= 33 && w.humidity <= 78 && w.rain1h === 0) {
        alertClass = 'alert-good';
        alertMsg = '<strong>Perfect Weather Today (' + w.temp + 'C, ' + w.humidity + '% humidity, No rain):</strong> Aaj khad dalne ka bilkul sahi waqt hai! Nutrients achhi tarah absorb honge.<br><em>Ideal conditions. Apply fertilizers today for best results.</em>';
    } else {
        alertClass = 'alert-good';
        alertMsg = '<strong>Acceptable Weather (' + w.temp + 'C):</strong> Khad dal sakte hain. Pehle halka pani dein, phir fertilizer dalein phir dobara halka pani dalein.<br><em>Pre-irrigate lightly before applying for 20-30% better nutrient uptake.</em>';
    }
    var soilLabel = soilKey.charAt(0).toUpperCase() + soilKey.slice(1);
    var soilColor = soilSuitability==='Ideal'?'#2e7d32':soilSuitability==='Good'?'#1565c0':soilSuitability==='Low'?'#c62828':'#e65100';
    var soilNote = '<br><br><strong>Your ' + soilLabel + ' Soil &rarr; Suitability for ' + crop.name + ':</strong> <strong style="color:' + soilColor + '">' + soilSuitability + '</strong>. ' + (
        soilSuitability==='Ideal' ? 'Perfect soil! Full recommended dose de sakte hain.' :
        soilSuitability==='Good'  ? 'Achhi soil. Organic matter badhate rahein.' :
        soilSuitability==='Medium'? 'Theek hai. Compost milayein for better results.' :
        'Yeh soil suitable nahi. Doosri fasal ya soil amendment sochein.'
    );
    document.getElementById('weatherAlert').className = 'advice-weather-alert ' + alertClass;
    document.getElementById('weatherAlert').innerHTML = alertMsg + soilNote;

    // ── SECTION 1: Rich Fertilizer Photo Cards ────────────────────
    var fertImages = {
        'DAP':       'images/iffco_npk.png',
        'NPK':       'images/rcf_suphala.png',
        'Urea':      'images/nfl_urea.png',
        'MOP':       'images/coromandel_dap.png',
        'SSP':       'images/deepak_npk.png',
        'NP Sulphur':'images/deepak_npk.png',
        'Nano':      'images/nfl_urea.png',
        'Liquid':    'images/iffco_npk.png',
        'Boron':     'images/rcf_suphala.png',
        'Chambal':   'images/chambal_urea.png'
    };
    var fertNPK = {
        'DAP (18-46-0)':'18-46-0 | N+P', 'NPK 12-32-16':'12-32-16', 'NPK 15-15-15':'15-15-15',
        'NPK 10-26-26':'10-26-26', 'Urea (46-0-0)':'46-0-0 Pure N', 'MOP (0-0-60)':'0-0-60 Pure K',
        'SSP (0-16-0)':'0-16-0+Ca+S', 'NP Sulphur 20-20-13S':'20-20-0+13S',
        'IFFCO Nano Urea':'N:4% Liquid', 'Liquid NPK 5-15-45':'5-15-45 Liquid',
        'Liquid Boron Spray':'Boron 10%', 'Rhizobium Bio-fertilizer':'Biofertilizer',
        'Bradyrhizobium (Bio)':'Biofertilizer'
    };
    var fertNeeds = {
        'DAP (18-46-0)': 'Buwai ke time strong roots ke liye Phosphorus zaroori hai. Seedling is ke bina kamzor rehti hai. Sabse important basal fertilizer.',
        'NPK 12-32-16': 'Ek saath N+P+K milta hai. Basal dose ke liye best — ek hi khad mein sab zaruriyat poori hoti hain.',
        'NPK 15-15-15': 'Bilkul balanced — N P K teeno 15% equal. Kisi bhi crop aur soil ke liye safe choice. Over-fertilization ka risk nahi.',
        'NPK 10-26-26': 'High PK — phal, kand, sabziyon ke liye. Fruit size, rang aur disease resistance badhata hai.',
        'Urea (46-0-0)': 'Sabse zyada nitrogen. Haari bhari patti, tezi se growth. Top-dressing ke liye India ka No.1 khad. Neem-coated zyada safe hai.',
        'MOP (0-0-60)': 'Pure Potassium. Phal ka swad, rang, size aur shelf-life badhata hai. Rog pratirodh bhi badhta hai.',
        'SSP (0-16-0)': 'Phosphorus + Calcium + Sulphur — teeno ek saath. Moongfali aur tel ki faslon ke liye must-use khad.',
        'NP Sulphur 20-20-13S': 'Sulphur se tel aur protein ki matra badhti hai. Sarson, soya ke liye essential. Sulphur deficient soils mein must.',
        'IFFCO Nano Urea': 'Ek 500ml = ek 45kg bag. Seedha patti pe spray, 90%+ absorb hota hai. Soil pollution zero. PM Modi ne launch kiya.',
        'Liquid NPK 5-15-45': 'Drip ya spray se. Fruiting stage pe high K seedha patti pe pahunchata hai. Export-quality fruit ke liye best.',
        'Liquid Boron Spray': 'Phool girne se rokta hai. Bina Boron ke pollen germination nahi — beej nahi banta. Potato hollow heart rokta hai.',
        'Rhizobium Bio-fertilizer': 'Hawa se FREE nitrogen leke fasal ko deta hai! Urea 30-50% kam chahiye. Completely organic aur safe.',
        'Bradyrhizobium (Bio)': 'Moongfali ka khas N-fixing bacteria. Pod formation mein help karta hai. Seed treatment se hi kaafi hai.'
    };

    var richCards = '';
    allFerts.forEach(function(f, idx) {
        var imgKey = '';
        var imgKeys = Object.keys(fertImages);
        for (var k = 0; k < imgKeys.length; k++) {
            if (f.name.indexOf(imgKeys[k]) !== -1) { imgKey = imgKeys[k]; break; }
        }
        var imgSrc = imgKey ? fertImages[imgKey] : '';
        var npk = fertNPK[f.name] || f.name;
        var need = fertNeeds[f.name] || f.why;
        var isBasal = idx < (crop.basalFert || []).length;
        var bg = (f.name.indexOf('Liquid')!==-1||f.name.indexOf('Nano')!==-1||f.name.indexOf('Bio')!==-1)
            ? 'background:linear-gradient(135deg,#e3f2fd,#bbdefb);'
            : 'background:linear-gradient(135deg,#f8fffc,#e8f5e9);';
        richCards +=
            '<div class="advice-rich-card">' +
                '<div class="arc-photo" style="' + bg + '">' +
                    (imgSrc ? '<img src="' + imgSrc + '" alt="' + f.name + '" onerror="this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\',\'<span style=&quot;font-size:3.5rem;&quot;>' + f.icon + '</span>\');">' : '<span>' + f.icon + '</span>') +
                    '<span class="arc-badge">' + (isBasal ? 'Basal' : 'Top Dress') + '</span>' +
                '</div>' +
                '<div class="arc-body">' +
                    '<div class="arc-name">' + f.icon + ' ' + f.name + '</div>' +
                    '<div class="arc-npk">NPK: ' + npk + '</div>' +
                    '<div class="arc-why"><strong>Kyun use karein?</strong><br>' + f.why + '</div>' +
                    '<div class="arc-need"><strong>Kya zaroorat hai?</strong><br>' + need + '</div>' +
                    '<div class="arc-dose" style="display:flex; justify-content:space-between; align-items:center;">' +
                        '<span>Dose: ' + f.dose + '</span>' +
                        (f.price ? '<button onclick="addToCart(\'' + f.name + '\',' + f.price + ')" style="padding: 4px 10px; border-radius: 4px; border:none; background:#2ecc71; color:white; cursor:pointer; font-weight:bold; font-size:0.8rem;">₹' + f.price + ' Buy</button>' : '') +
                    '</div>' +
                '</div>' +
            '</div>';
    });
    if (!richCards) richCards = '<p style="color:#888;background:white;padding:16px;border-radius:12px;">Is fasal ko heavy chemical fertilizer ki zarurat nahi — biofertilizer se kaam chalta hai!</p>';
    document.getElementById('adviceRichCards').innerHTML = richCards;

    // ── SECTION 2: Growth Stage Timeline ─────────────────────────
    var tls = {
        wheat: [
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span>',l:'Sowing (Buwai)',d:'Day 0',f:'DAP + NPK',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>',l:'Tillering (Kalle Nikalna)',d:'Day 25-35',f:'Urea 1st Dose',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>',l:'Jointing (Naali Banana)',d:'Day 45-55',f:'Urea 2nd Dose',hi:true},
            {e:'',l:'Flowering (Phool)',d:'Day 70-80',f:'No Fertilizer',hi:false},
            {e:'',l:'Harvest (Katai)',d:'Day 115-140',f:'Nil',hi:false}
        ],
        paddy: [
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span>',l:'Transplanting (Ropai)',d:'Day 0',f:'DAP + MOP',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>',l:'Tillering',d:'Day 25',f:'Urea 1st',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>',l:'Panicle Initiation',d:'Day 55',f:'Urea 2nd',hi:true},
            {e:'',l:'Heading (Balian Nikalna)',d:'Day 80',f:'No Fertilizer',hi:false},
            {e:'',l:'Harvest',d:'Day 120-135',f:'Nil',hi:false}
        ],
        cotton: [
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span>',l:'Sowing (Buwai)',d:'Day 0',f:'NPK + DAP',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>',l:'Vegetative (Bada Hona)',d:'Day 30',f:'Urea 1st Dose',hi:true},
            {e:'',l:'Boll Formation (Tinda)',d:'Day 60',f:'Urea + MOP',hi:true},
            {e:'',l:'Boll Opening',d:'Day 90-110',f:'No Fertilizer',hi:false},
            {e:'',l:'Picking (Chugai)',d:'Day 150-180',f:'Nil',hi:false}
        ],
        sugarcane: [
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span>',l:'Planting (Buwai)',d:'Month 0',f:'NPK + DAP',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>',l:'Tillering (Kalle)',d:'Month 1-2',f:'Urea 1st Dose',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>',l:'Grand Growth (Bada Hona)',d:'Month 4-5',f:'Urea 2nd Dose',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>',l:'Maturation (Pakna)',d:'Month 8-9',f:'Urea 3rd (optional)',hi:false},
            {e:'',l:'Harvest (Katai)',d:'Month 12-14',f:'Nil',hi:false}
        ],
        tomato: [
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span>',l:'Transplanting (Ropai)',d:'Day 0',f:'NPK 10-26-26',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>',l:'Vegetative (Bada Hona)',d:'Day 15-20',f:'Urea + Micro Spray',hi:true},
            {e:'',l:'Flowering (Phool Aana)',d:'Day 35-40',f:'Liquid NPK Spray',hi:true},
            {e:'',l:'Fruiting (Phal Ana)',d:'Day 55-65',f:'High K Spray',hi:true},
            {e:'',l:'Harvest (Todai)',d:'Day 75-90',f:'Nil',hi:false}
        ],
        potato: [
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span>',l:'Sowing (Buwai)',d:'Day 0',f:'NPK + DAP',hi:true},
            {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>',l:'Earthing Up (Mitti Chadana)',d:'Day 30',f:'Light Urea + Boron Spray',hi:true},
            {e:'',l:'Tuber Initiation',d:'Day 50',f:'MOP Application',hi:true},
            {e:'',l:'Tuber Growth',d:'Day 70-80',f:'No Heavy Dose',hi:false},
            {e:'',l:'Harvest (Khudai)',d:'Day 90-110',f:'Nil',hi:false}
        ]
    };
    var tl = tls[cropKey] || [
        {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span>',l:'Sowing / Planting',d:'Day 0',f:(crop.basalFert[0]||{name:'Basal Dose'}).name,hi:true},
        {e:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>',l:'Vegetative Stage',d:'Day 20-35',f:(crop.topDressFert[0]||{name:'Top Dress'}).name||'Top Dress',hi:true},
        {e:'',l:'Flowering Stage',d:'Day 45-60',f:'Foliar Spray',hi:false},
        {e:'',l:'Harvest',d:'As per crop',f:'Nil',hi:false}
    ];
    var tlHtml = tl.map(function(t) {
        return '<div class="timeline-step">' +
            '<div class="ts-dot' + (t.hi ? ' ts-highlight' : '') + '">' + t.e + '</div>' +
            '<div class="ts-label">' + t.l + '</div>' +
            '<div class="ts-days">' + t.d + '</div>' +
            '<div class="ts-fert">' + t.f + '</div>' +
        '</div>';
    }).join('');
    document.getElementById('adviceTimeline').innerHTML = tlHtml;

    // ── SECTION 3: Soil-Specific Application Method ───────────────
    var soilMethods = {
        alluvial: {
            title: 'Alluvial Soil (जलोढ़) — Application Steps',
            note: 'Nutrients hold well. Broadcast or drill both effective. Split doses prevent leaching.',
            steps: [
                {h:'Broadcast + Ploughing (Basal)',p:'DAP/NPK khet mein chharken aur 6-8 cm andar jotai karein. Roots seedha nutrients absorb karengi without any problem.'},
                {h:'Top-Dress After Irrigation/Rain',p:'Urea halki naami ke 3-4 ghante baad dalein. Dry soil mein nitrogen ud jaata hai — naami zaruri hai.'},
                {h:'Split Urea in 2 Equal Doses',p:'50% buwai ke 25 din baad, 50% agle 20 din baad dalein. Leaching loss kaafi kam hota hai is tarah.'},
                {h:'Avoid Excess Water After Application',p:'Fertilizer ke baad flood irrigation mat karein. Sirf halki naami kaafi hai takki nutrients neeche na jayein.'}
            ]
        },
        black: {
            title: 'Black / Clay Soil (काली मिट्टी) — Application Steps',
            note: 'Sticky and water-retaining. Apply when moist, not dry or waterlogged. Avoid dry cracks!',
            steps: [
                {h:'Apply ONLY in Moist Condition',p:'Sukhi kaali mitti mein cracks hoti hain — granules seedha andar ghus jaate hain absorb hue bina. Halki naami ke baad hi dalein.'},
                {h:'Drill Method for Basal Dose',p:'Basal fertilizer (DAP/NPK) ko 5cm andar drill karein seed ke paas. Broadcast se 20% zyada efficient hota hai black mitti mein.'},
                {h:'Urea Only in Evening (5-7 PM)',p:'Black soil mein din mein garmi zyada hoti hai. Shaam ko Urea dalein aur turant light irrigation karein — loss minimum.'},
                {h:'Ensure Good Field Drainage First',p:'Khet mein pani khada nahi hona chahiye jab khad dalein. Standing water mein nitrogen loss 40% tak ho sakta hai.'}
            ]
        },
        red: {
            title: 'Red / Laterite Soil (लाल मिट्टी) — Application Steps',
            note: 'Low fertility, high leaching. Higher doses, organic matter, and foliar sprays are essential.',
            steps: [
                {h:'Increase Dose by 15%, Split in 3',p:'Red soil mein nutrients jaldi beh jaate hain. Standard dose se 15% zyada dalein — lekin 3 baar mein split karein.'},
                {h:'Compost/FYM First — 2 Weeks Before',p:'2-3 ton/acre gobar khad ya compost pehle dalein. Isse nutrient holding kaafi improve hoti hai.'},
                {h:'Foliar Spray is Most Effective Here',p:'IFFCO Nano Urea ya Liquid NPK spray red soil mein best kaam karta hai. Seedha patti pe jaata hai — wastage zero.'},
                {h:'Add ZnSO4 Every 2-3 Years',p:'Zinc kaafi common deficiency hai red soil mein. 25 kg/acre ZnSO4 dalein — peeli pattiyan thik hogi, yield badhegi.'}
            ]
        },
        sandy: {
            title: 'Sandy Soil (बलुई मिट्टी) — Application Steps',
            note: 'Fast drainage — fertilizers leach out quickly. Frequent small doses and liquid fertilizers work best.',
            steps: [
                {h:'Very Small, Very Frequent Doses',p:'Sandy mein granular khad jaldi beh jaata hai. 5-6 chhoti doses dein. Drip fertigation sab se best option hai is soil ke liye.'},
                {h:'Liquid Fertilizer Strongly Preferred',p:'Nano Urea, Liquid NPK sandy ke liye ideal hain. Granular se 40% zyada efficient absorption hoti hai liquid fertilizers ki.'},
                {h:'All Micronutrients as Foliar Spray',p:'Zinc, Boron, Iron sandy mein soil mein mat dalein — sab beh jaayega. Seedha patti par spray karein. Much more efficient.'},
                {h:'Organic Matter + Mulching is Must',p:'Compost ya green manure se water holding capacity badhti hai. Mulching se evaporation aur leaching dono kam hoti hain.'}
            ]
        },
        loamy: {
            title: 'Loamy Soil (दोमट) — Application Steps (Best Soil!)',
            note: 'Ideal for all crops. Standard recommendations work perfectly. Any method of application is fine.',
            steps: [
                {h:'Standard Broadcast + Mix (Basal)',p:'DAP/NPK chharken aur 5-8 cm andar mix karein. Loamy mein uniform distribution automatically hoti hai.'},
                {h:'Top-Dress Urea After Rain or Irrigation',p:'Barish ya irrigation ke 3-4 ghante baad Urea dalein. Soil moist hai toh nitrogen achhi tarah absorb hota hai.'},
                {h:'Flood or Drip — Both Work Fine',p:'Loamy mein koi bhi method chalega. Drip se 30% pani bachega but flood equally efficient hai fertilizer uptake ke liye.'},
                {h:'Soil Test Every 2 Years',p:'Loamy mein excess nutrients show nahi hota jaldi. Regular soil testing se over-fertilization se bacha ja sakta hai.'}
            ]
        },
        laterite: {
            title: 'Laterite Soil (लैटेराइट) — Application Steps',
            note: 'Very acidic soil (pH 4.5-5.5). MUST do lime application first otherwise NO fertilizer will work!',
            steps: [
                {h:'Lime First — pH Must Be Corrected!',p:'200-400 kg/acre Agricultural Lime dalein fertilizer se 2-4 hafte pehle. Bina lime ke koi bhi khad kaam nahi karega acidic soil mein.'},
                {h:'Ammonium Sulphate Instead of Urea',p:'Acidic soil mein Ammonium Sulphate more stable and efficient hai Urea ke mukable. Use this as your nitrogen source.'},
                {h:'Mix Chemical Fertilizer with FYM',p:'NPK/DAP ko gobar khad ke saath mix karke dalein. Organic matter buffer karta hai — pH gradually improve hoti hai.'},
                {h:'4-Split Nitrogen + More Foliar Spray',p:'Nitrogen ko 4 doses mein split karein. Foliar spray (Nano Urea, Liquid NPK) laterite mein bahut effective hai.'}
            ]
        }
    };
    var sm = soilMethods[soilKey] || soilMethods.loamy;
    var smHtml = '<div class="soil-method-header"><h4>' + sm.title + '</h4><p>' + sm.note + '</p></div><div class="soil-steps-grid">';
    sm.steps.forEach(function(s, i) {
        smHtml += '<div class="soil-step-card"><div class="ss-num">' + (i+1) + '</div><h5>' + s.h + '</h5><p>' + s.p + '</p></div>';
    });
    smHtml += '</div>';
    document.getElementById('adviceSoilMethod').innerHTML = smHtml;

    // ── SECTION 4: Simple Language ────────────────────────────────
    document.getElementById('adviceSimple').innerHTML =
        '<div class="simple-title">Seedha Baat — Farmer Ki Bhasha Mein (Simple Guide)</div>' +
        '<p>' + (crop.simple || 'Is fasal ke liye aasaan salah yahan milegi.') + '</p>';

    // ── SECTION 5: Do's and Don'ts ────────────────────────────────
    var dos   = (crop.dos   || []).map(function(d){ return '<li>Do: ' + d + '</li>'; }).join('');
    var donts = (crop.donts || []).map(function(d){ return '<li>Avoid: ' + d + '</li>'; }).join('');
    document.getElementById('adviceDos').innerHTML =
        '<div class="dos-box"><h4>Kya Karein (Do\'s)</h4><ul>' + dos + '</ul></div>' +
        '<div class="donts-box"><h4>Kya Na Karein (Don\'ts)</h4><ul>' + donts + '</ul></div>';

    document.getElementById('advicePanel').style.display = 'block';
    setTimeout(function(){ document.getElementById('advicePanel').scrollIntoView({ behavior:'smooth', block:'start' }); }, 100);
}
