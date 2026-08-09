/**
 * frontend/js/i18n.js
 * 
 * Complete Universal Multi-Language Translation Engine for KisanCare
 * Supports English (en), Hindi (hi), Marathi (mr), and Gujarati (gu).
 * 
 * Features:
 * - Instant DOM Text Node and Element Translation
 * - Form Placeholders, Options, and Title Translation
 * - Dynamic Script Typography Adaptation (Devanagari, Gujarati, Latin)
 * - Seamless Google Translate Automated Dynamic Fallback for Complex Content
 * - MutationObserver for Real-time Dynamic API Content Translation
 * - Persistent Language State across all pages
 */

(function () {
    const DEFAULT_LANG = 'en';
    const SUPPORTED_LANGS = ['en', 'hi', 'mr', 'gu'];

    // --- Embedded Agricultural & UI Translation Dictionary ---
    const DICTIONARY = {
        hi: {
            "Home": "होम",
            "Crop Advisory": "फसल सलाह",
            "Weather Alerts": "मौसम अलर्ट",
            "Crop Care": "फसल देखभाल",
            "Market Prices": "मंडी भाव",
            "Gov Schemes": "सरकारी योजनाएं",
            "Govt Schemes": "सरकारी योजनाएं",
            "Fertilizers": "उर्वरक एवं खाद",
            "Feedback": "प्रतिक्रिया",
            "Profile": "किसान प्रोफ़ाइल",
            "History": "गतिविधि इतिहास",
            "Fert. Calc.": "खाद कैलकुलेटर",
            "Fertilizer Calc": "खाद कैलकुलेटर",
            "Expenses": "खर्च व मुनाफा",
            "Login": "लॉग इन",
            "Logout": "लॉग आउट",
            "Settings": "सेटिंग्स",
            "Notifications": "सूचनाएं",
            "Disease Detection": "रोग पहचान",
            "Community": "किसान समुदाय",
            "Crop Calendar": "फसल कैलेंडर",
            "Back to Home": "होम पर वापस जाएं",

            // General Actions & Buttons
            "Save": "सुरक्षित करें",
            "Save Profile": "प्रोफ़ाइल सुरक्षित करें",
            "Saving...": "सुरक्षित हो रहा है...",
            "Cancel": "रद्द करें",
            "Delete": "हटाएं",
            "Edit": "संपादित करें",
            "Create": "बनाएं",
            "Create Cycle": "फसल चक्र बनाएं",
            "Add Expense": "खर्च जोड़ें",
            "Predict Crop": "फसल पूर्वानुमान",
            "Calculate": "गणना करें",
            "Upload Photo": "फोटो अपलोड करें",
            "Print / PDF Report": "प्रिंट / PDF रिपोर्ट",
            "Export CSV / Excel": "CSV / Excel निर्यात करें",
            "Load More": "और लोड करें",
            "Load More Records": "और रिकॉर्ड देखें",
            "View Details": "विवरण देखें",
            "Submit": "जमा करें",
            "New Cycle": "नया चक्र",
            "Edit Yield & Price": "उपज और मूल्य अपडेट करें",
            "Update": "अपडेट करें",
            "Search": "खोजें",
            "Clear": "साफ करें",

            // Profile Page
            "Farmer Profile": "किसान प्रोफ़ाइल",
            "Personal Information": "व्यक्तिगत जानकारी",
            "Farm Details": "खेत का विवरण",
            "Notification & Alert Preferences": "सूचना और अलर्ट प्राथमिकताएं",
            "Full Name": "पूरा नाम",
            "Phone Number": "मोबाइल नंबर",
            "Village / Town": "गांव / कस्बा",
            "District / City": "जिला / शहर",
            "State": "राज्य",
            "Total Land Area (Acres)": "कुल भूमि क्षेत्र (एकड़)",
            "Primary Soil Type": "मुख्य मिट्टी का प्रकार",
            "Irrigation Type": "सिंचाई प्रणाली",
            "Preferred Crops (Select all that you grow)": "पसंदीदा फसलें (जो फसलें आप उगाते हैं उन्हें चुनें)",
            "Enable Email Alerts & Summaries": "ईमेल अलर्ट और सारांश सक्षम करें",
            "Extreme Weather & Frost Warnings": "खराब मौसम और पाला चेतावनी",
            "Pest Infestation & Disease Alerts": "कीट प्रकोप और रोग अलर्ट",
            "APMC Mandi Price Surges & Trends": "APMC मंडी मूल्य वृद्धि और रुझान",
            "Govt Schemes & Subsidy Deadlines": "सरकारी योजनाएं और सब्सिडी अंतिम तिथियां",

            // Expenses Page
            "Expense & Profit Tracker": "खर्च और मुनाफा ट्रैकर",
            "Crop Cycles": "फसल चक्र",
            "Total Investment": "कुल निवेश / लागत",
            "Est. Revenue": "अनुमानित आय",
            "Net Profit / Loss": "शुद्ध लाभ / हानि",
            "Expense Items": "खर्च की सूची",
            "Date": "तारीख",
            "Category": "श्रेणी",
            "Amount": "राशि (₹)",
            "Amount (₹)": "राशि (₹)",
            "Note": "विवरण",
            "Action": "कार्रवाई",
            "Select or Create a Crop Cycle": "फसल चक्र चुनें या नया बनाएं",
            "Select or create a crop cycle": "फसल चक्र चुनें या नया बनाएं",
            "Cycle Name": "चक्र का नाम",
            "Crop": "फसल",
            "Land Area (Acres)": "भूमि क्षेत्र (एकड़)",
            "Sowing / Start Date": "बुवाई / प्रारंभ तारीख",
            "Start Date": "प्रारंभ तारीख",
            "Expected Sale Price (₹ / Quintal)": "अपेक्षित विक्रय मूल्य (₹ / क्विंटल)",
            "Actual Sale Price (₹ / Quintal)": "वास्तविक विक्रय मूल्य (₹ / क्विंटल)",
            "Actual Yield (Quintals)": "वास्तविक उपज (क्विंटल)",
            "Update Yield & Sale Price": "उपज और विक्रय मूल्य अपडेट करें",
            "Add Expense Item": "खर्च की मद जोड़ें",

            // History Page
            "Farmer Activity Timeline": "किसान गतिविधि समयरेखा",
            "Activity History": "गतिविधि इतिहास",
            "All Activity": "सभी गतिविधियां",
            "Crop Rec": "फसल सलाह",
            "Disease": "रोग पहचान",
            "Irrigation": "सिंचाई",
            "Pest Risk": "कीट जोखिम",
            "Fertilizer": "उर्वरक",
            "Crop Recommendation": "फसल सिफारिश",
            "Pest Risk Advisory": "कीट जोखिम सलाह",
            "Fertilizer Calculation": "उर्वरक गणना",
            "Recommended Crop": "अनुशंसित फसल",
            "Detection Result": "रोग निदान परिणाम",
            "Schedule": "सिंचाई कार्यक्रम",
            "Pest Risk Level": "कीट जोखिम स्तर",
            "Dosage Plan": "खुराक योजना",
            "Estimated Cost": "अनुमानित लागत",
            "Recommended Treatment": "अनुशंसित उपचार",
            "Soil Nutrients": "मिट्टी पोषक तत्व",
            "Water Volume": "पानी की मात्रा",

            // Crops
            "Wheat": "गेहूं",
            "Rice": "चावल / धान",
            "Cotton": "कपास",
            "Maize": "मक्का",
            "Sugarcane": "गन्ना",
            "Soybean": "सोयाबीन",
            "Groundnut": "मूंगफली",
            "Mustard": "सरसों",
            "Tomato": "टमाटर",
            "Potato": "आलू",
            "Gram": "चना",
            "Onion": "प्याज",
            "Bajra": "बाजरा",
            "Jowar": "ज्वार",

            // Soils & Irrigation
            "Loamy Soil": "दोमट मिट्टी",
            "Sandy Soil": "बलुई मिट्टी",
            "Clay Soil": "चिकनी मिट्टी",
            "Black Cotton Soil": "काली कपास मिट्टी",
            "Red / Laterite Soil": "लाल / लैटेराइट मिट्टी",
            "Rainfed (Dependent on monsoon)": "वर्षा आधारित (मानसून पर निर्भर)",
            "Drip Irrigation": "ड्रिप (टपक) सिंचाई",
            "Sprinkler Irrigation": "फव्वारा (स्प्रिंकलर) सिंचाई",
            "Canal / Flood Irrigation": "नहर / बाढ़ सिंचाई",
            "Tube well / Borewell": "नलकूप / बोरवेल",

            // Categories
            "Seeds & Seed Treatment": "बीज और बीज उपचार",
            "Fertilizers & Nutrients": "उर्वरक और पोषक तत्व",
            "Labour & Sowing Charges": "मजदूरी और बुवाई खर्च",
            "Tractor & Machinery Rental": "ट्रैक्टर और मशीनरी किराया",
            "Irrigation & Electricity": "सिंचाई और बिजली खर्च",
            "Transport & Mandi Cartage": "परिवहन और मंडी भाड़ा",
            "Miscellaneous Expenses": "अन्य विविध खर्च",
            "seeds": "बीज",
            "fertilizer": "उर्वरक",
            "labour": "मजदूरी",
            "machinery": "मशीनरी",
            "irrigation": "सिंचाई",
            "transport": "परिवहन",
            "miscellaneous": "विविध",
            "active": "सक्रिय",
            "completed": "पूर्ण",

            // Home & Dashboard
            "Smart Farming for a Better Tomorrow": "बेहतर भविष्य के लिए स्मार्ट और आधुनिक खेती",
            "Explore Services": "सेवाएं देखें",
            "Get Crop Advisory": "फसल सलाह प्राप्त करें",
            "AI Crop Recommendation": "AI फसल सिफारिश",
            "Real-Time Weather": "वास्तविक समय मौसम",
            "Live Mandi Prices": "लाइव मंडी भाव",
            "Plant Disease Detection": "पौध रोग पहचान",
            "Government Schemes": "सरकारी योजनाएं",
            "Fertilizer Calculator": "उर्वरक कैलकुलेटर"
        },
        mr: {
            "Home": "मुख्यपृष्ठ",
            "Crop Advisory": "पीक सल्ला",
            "Weather Alerts": "हवामान अंदाज",
            "Crop Care": "पीक संवर्धन",
            "Market Prices": "बाजार भाव",
            "Gov Schemes": "शासकीय योजना",
            "Govt Schemes": "शासकीय योजना",
            "Fertilizers": "खते आणि पोषण",
            "Feedback": "अभिप्राय",
            "Profile": "शेतकरी प्रोफाइल",
            "History": "इतिहास",
            "Fert. Calc.": "खत गणकयंत्र",
            "Fertilizer Calc": "खत गणकयंत्र",
            "Expenses": "खर्च व नफा",
            "Login": "लॉग इन",
            "Logout": "लॉग आउट",
            "Settings": "सेटिंग्ज",
            "Notifications": "सूचना",
            "Disease Detection": "रोग निदान",
            "Community": "शेतकरी समुदाय",
            "Crop Calendar": "पीक कॅलेंडर",
            "Back to Home": "मुख्यपृष्ठावर जा",

            // General Actions & Buttons
            "Save": "जतन करा",
            "Save Profile": "प्रोफाइल जतन करा",
            "Saving...": "जतन करत आहे...",
            "Cancel": "रद्द करा",
            "Delete": "हटवा",
            "Edit": "संपादित करा",
            "Create": "तयार करा",
            "Create Cycle": "पीक चक्र तयार करा",
            "Add Expense": "खर्च जोडा",
            "Predict Crop": "पीक अंदाज",
            "Calculate": "गणना करा",
            "Upload Photo": "फोटो अपलोड करा",
            "Print / PDF Report": "प्रिंट / PDF अहवाल",
            "Export CSV / Excel": "CSV / Excel निर्यात करा",
            "Load More": "अधिक नोंदी पहा",
            "Load More Records": "अधिक नोंदी पहा",
            "View Details": "तपशील पहा",
            "Submit": "सबमिट करा",
            "New Cycle": "नवीन चक्र",
            "Edit Yield & Price": "उत्पादन आणि दर अद्यतनित करा",
            "Update": "अद्यतनित करा",
            "Search": "शोधा",
            "Clear": "साफ करा",

            // Profile Page
            "Farmer Profile": "शेतकरी प्रोफाइल",
            "Personal Information": "वैयक्तिक माहिती",
            "Farm Details": "शेताचा तपशील",
            "Notification & Alert Preferences": "सूचना आणि सूचना प्राधान्ये",
            "Full Name": "पूर्ण नाव",
            "Phone Number": "मोबाईल नंबर",
            "Village / Town": "गाव / शहर",
            "District / City": "जिल्हा",
            "State": "राज्य",
            "Total Land Area (Acres)": "एकूण जमीन (एकर)",
            "Primary Soil Type": "जमिनीचा प्रकार",
            "Irrigation Type": "सिंचन पद्धत",
            "Preferred Crops (Select all that you grow)": "पसंतीची पिके (तुम्ही पिकवत असलेली पिके निवडा)",
            "Enable Email Alerts & Summaries": "ईमेल सूचना सक्षम करा",
            "Extreme Weather & Frost Warnings": "अतिवृष्टी व हवामान चेतावणी",
            "Pest Infestation & Disease Alerts": "कीड व रोग प्रादुर्भाव अलर्ट",
            "APMC Mandi Price Surges & Trends": "APMC बाजार भाव वाढ आणि कल",
            "Govt Schemes & Subsidy Deadlines": "शासकीय योजना आणि अनुदान मुदत",

            // Expenses Page
            "Expense & Profit Tracker": "खर्च आणि नफा ट्रॅकर",
            "Crop Cycles": "पीक चक्रे",
            "Total Investment": "एकूण खर्च / गुंतवणूक",
            "Est. Revenue": "अंदाजे उत्पन्न",
            "Net Profit / Loss": "निव्वळ नफा / तोटा",
            "Expense Items": "खर्चाची यादी",
            "Date": "दिनांक",
            "Category": "प्रवर्ग",
            "Amount": "रक्कम (₹)",
            "Amount (₹)": "रक्कम (₹)",
            "Note": "तपशील",
            "Action": "कृती",
            "Select or Create a Crop Cycle": "पीक चक्र निवडा किंवा नवीन तयार करा",
            "Select or create a crop cycle": "पीक चक्र निवडा किंवा नवीन तयार करा",
            "Cycle Name": "चक्राचे नाव",
            "Crop": "पीक",
            "Land Area (Acres)": "जमीन क्षेत्र (एकर)",
            "Sowing / Start Date": "पेरणी / प्रारंभ तारीख",
            "Start Date": "प्रारंभ तारीख",
            "Expected Sale Price (₹ / Quintal)": "अपेक्षित विक्री दर (₹ / क्विंटल)",
            "Actual Sale Price (₹ / Quintal)": "प्रत्यक्ष विक्री दर (₹ / क्विंटल)",
            "Actual Yield (Quintals)": "प्रत्यक्ष उत्पादन (क्विंटल)",
            "Update Yield & Sale Price": "उत्पादन आणि विक्री दर अपडेट करा",
            "Add Expense Item": "खर्च बाब जोडा",

            // History Page
            "Farmer Activity Timeline": "शेतकरी उपक्रम इतिहास",
            "Activity History": "उपक्रम इतिहास",
            "All Activity": "सर्व नोंदी",
            "Crop Rec": "पीक सल्ला",
            "Disease": "रोग निदान",
            "Irrigation": "सिंचन",
            "Pest Risk": "कीड धोका",
            "Fertilizer": "खत गणना",
            "Crop Recommendation": "पीक शिफारस",
            "Pest Risk Advisory": "कीड धोका सल्ला",
            "Fertilizer Calculation": "खत गणना",
            "Recommended Crop": "शिफारस केलेले पीक",
            "Detection Result": "रोग निदान निकाल",
            "Schedule": "सिंचन वेळापत्रक",
            "Pest Risk Level": "कीड धोका पातळी",
            "Dosage Plan": "डोस योजना",
            "Estimated Cost": "अंदाजे खर्च",
            "Recommended Treatment": "शिफारस केलेले उपचार",
            "Soil Nutrients": "माती पोषक द्रव्ये",
            "Water Volume": "पाण्याचे प्रमाण",

            // Crops
            "Wheat": "गहू",
            "Rice": "तांदूळ / भात",
            "Cotton": "कापूस",
            "Maize": "मका",
            "Sugarcane": "ऊस",
            "Soybean": "सोयाबीन",
            "Groundnut": "भुईमूग",
            "Mustard": "मोहरी",
            "Tomato": "टोमॅटो",
            "Potato": "बटाटा",
            "Gram": "हरभरा / चणा",
            "Onion": "कांदा",
            "Bajra": "बाजरी",
            "Jowar": "ज्वारी",

            // Soils & Irrigation
            "Loamy Soil": "गाळाची जमीन",
            "Sandy Soil": "रेतीयुक्त जमीन",
            "Clay Soil": "चिकणमाती",
            "Black Cotton Soil": "काळी कापसाची जमीन",
            "Red / Laterite Soil": "तांबडी जमीन",
            "Rainfed (Dependent on monsoon)": "पावसावर आधारित (कोरडवाहू)",
            "Drip Irrigation": "ठिबक सिंचन",
            "Sprinkler Irrigation": "तुषार सिंचन",
            "Canal / Flood Irrigation": "कालवा सिंचन",
            "Tube well / Borewell": "बोअरवेल / विहीर",

            // Categories
            "Seeds & Seed Treatment": "बियाणे आणि बीज प्रक्रिया",
            "Fertilizers & Nutrients": "खते आणि पोषणद्रव्ये",
            "Labour & Sowing Charges": "मजुरी आणि पेरणी खर्च",
            "Tractor & Machinery Rental": "ट्रॅक्टर व यंत्रसामग्री भाडे",
            "Irrigation & Electricity": "सिंचन व वीज खर्च",
            "Transport & Mandi Cartage": "वाहतूक आणि बाजार भाडे",
            "Miscellaneous Expenses": "इतर किरकोळ खर्च",
            "seeds": "बियाणे",
            "fertilizer": "खते",
            "labour": "मजुरी",
            "machinery": "यंत्रसामग्री",
            "irrigation": "सिंचन",
            "transport": "वाहतूक",
            "miscellaneous": "किरकोळ",
            "active": "सक्रिय",
            "completed": "पूर्ण",

            // Home & Dashboard
            "Smart Farming for a Better Tomorrow": "उज्ज्वल भविष्यासाठी आधुनिक व स्मार्ट शेती",
            "Explore Services": "सेवा पहा",
            "Get Crop Advisory": "पीक सल्ला मिळवा",
            "AI Crop Recommendation": "AI पीक शिफारस",
            "Real-Time Weather": "थेट हवामान अंदाज",
            "Live Mandi Prices": "थेट बाजार भाव",
            "Plant Disease Detection": "वनस्पती रोग निदान",
            "Government Schemes": "शासकीय योजना",
            "Fertilizer Calculator": "खत गणकयंत्र"
        },
        gu: {
            "Home": "હોમ",
            "Crop Advisory": "પાક સલાહ",
            "Weather Alerts": "હવામાન ચેતવણીઓ",
            "Crop Care": "પાક સંભાળ",
            "Market Prices": "બજાર ભાવ",
            "Gov Schemes": "સરકારી યોજનાઓ",
            "Govt Schemes": "સરકારી યોજનાઓ",
            "Fertilizers": "ખાતરો અને પોષણ",
            "Feedback": "પ્રતિસાદ",
            "Profile": "ખેડૂત પ્રોફાઇલ",
            "History": "ઇતિહાસ",
            "Fert. Calc.": "ખાતર કેલ્ક્યુલેટર",
            "Fertilizer Calc": "ખાતર કેલ્ક્યુલેટર",
            "Expenses": "ખર્ચ અને નફો",
            "Login": "લૉગ ઇન",
            "Logout": "લૉગ આઉટ",
            "Settings": "સેટિંગ્સ",
            "Notifications": "સૂચનાઓ",
            "Disease Detection": "રોગ નિદાન",
            "Community": "ખેડૂત સમુદાય",
            "Crop Calendar": "પાક કેલેન્ડર",
            "Back to Home": "હોમ પર પાછા જાઓ",

            // General Actions & Buttons
            "Save": "સાચવો",
            "Save Profile": "પ્રોફાઇલ સાચવો",
            "Saving...": "સાચવી રહ્યું છે...",
            "Cancel": "રદ કરો",
            "Delete": "કાઢી નાખો",
            "Edit": "સંપાદિત કરો",
            "Create": "બનાવો",
            "Create Cycle": "પાક ચક્ર બનાવો",
            "Add Expense": "ખર્ચ ઉમેરો",
            "Predict Crop": "પાકની આગાહી",
            "Calculate": "ગણતરી કરો",
            "Upload Photo": "ફોટો અપલોડ કરો",
            "Print / PDF Report": "પ્રિન્ટ / PDF અહેવાલ",
            "Export CSV / Excel": "CSV / Excel નિકાસ કરો",
            "Load More": "વધુ રેકોર્ડ જુઓ",
            "Load More Records": "વધુ રેકોર્ડ જુઓ",
            "View Details": "વિગતો જુઓ",
            "Submit": "સબમિટ કરો",
            "New Cycle": "નવું ચક્ર",
            "Edit Yield & Price": "ઉત્પાદન અને ભાવ અપડેટ કરો",
            "Update": "અપડેટ કરો",
            "Search": "શોધો",
            "Clear": "સાફ કરો",

            // Profile Page
            "Farmer Profile": "ખેડૂત પ્રોફાઇલ",
            "Personal Information": "વ્યક્તિગત માહિતી",
            "Farm Details": "ખેતરની વિગતો",
            "Notification & Alert Preferences": "સૂચના અને ચેતવણી પસંદગીઓ",
            "Full Name": "પૂરું નામ",
            "Phone Number": "મોબાઇલ નંબર",
            "Village / Town": "ગામ / શહેર",
            "District / City": "જિલ્લો",
            "State": "રાજ્ય",
            "Total Land Area (Acres)": "કુલ જમીન વિસ્તાર (એકર)",
            "Primary Soil Type": "મુખ્ય જમીનનો પ્રકાર",
            "Irrigation Type": "સિંચાઈ પદ્ધતિ",
            "Preferred Crops (Select all that you grow)": "પસંદગીના પાકો (તમે વાવતા હોય તે પાક પસંદ કરો)",
            "Enable Email Alerts & Summaries": "ઇમેઇલ ચેતવણીઓ સક્ષમ કરો",
            "Extreme Weather & Frost Warnings": "ખરાબ હવામાન અને હિમ ચેતવણીઓ",
            "Pest Infestation & Disease Alerts": "જીવાત ઉપદ્રવ અને રોગ ચેતવણીઓ",
            "APMC Mandi Price Surges & Trends": "APMC બજાર ભાવ વધારા અને વલણો",
            "Govt Schemes & Subsidy Deadlines": "સરકારી યોજનાઓ અને સબસિડી સમયમર્યાદા",

            // Expenses Page
            "Expense & Profit Tracker": "ખર્ચ અને નફો ટ્રેકર",
            "Crop Cycles": "પાક ચક્રો",
            "Total Investment": "કુલ રોકાણ / ખર્ચ",
            "Est. Revenue": "અંદાજિત આવક",
            "Net Profit / Loss": "ચોખ્ખો નફો / નુકસાન",
            "Expense Items": "ખર્ચની યાદી",
            "Date": "તારીખ",
            "Category": "શ્રેણી",
            "Amount": "રકમ (₹)",
            "Amount (₹)": "રકમ (₹)",
            "Note": "વિગત",
            "Action": "ક્રિયા",
            "Select or Create a Crop Cycle": "પાક ચક્ર પસંદ કરો અથવા નવું બનાવો",
            "Select or create a crop cycle": "પાક ચક્ર પસંદ કરો અથવા નવું બનાવો",
            "Cycle Name": "ચક્રનું નામ",
            "Crop": "પાક",
            "Land Area (Acres)": "જમીન વિસ્તાર (એકર)",
            "Sowing / Start Date": "વાવણી / શરૂઆત તારીખ",
            "Start Date": "શરૂઆત તારીખ",
            "Expected Sale Price (₹ / Quintal)": "અપેક્ષિત વેચાણ ભાવ (₹ / ક્વિન્ટલ)",
            "Actual Sale Price (₹ / Quintal)": "વાસ્તવિક વેચાણ ભાવ (₹ / ક્વિન્ટલ)",
            "Actual Yield (Quintals)": "વાસ્તવિક ઉપજ (ક્વિન્ટલ)",
            "Update Yield & Sale Price": "ઉત્પાદન અને ભાવ અપડેટ કરો",
            "Add Expense Item": "ખર્ચ આઇટમ ઉમેરો",

            // History Page
            "Farmer Activity Timeline": "ખેડૂત પ્રવૃત્તિ ઇતિહાસ",
            "Activity History": "પ્રવૃત્તિ ઇતિહાસ",
            "All Activity": "બધી પ્રવૃત્તિઓ",
            "Crop Rec": "પાક સલાહ",
            "Disease": "રોગ નિદાન",
            "Irrigation": "સિંચાઈ",
            "Pest Risk": "જીવાત જોખમ",
            "Fertilizer": "ખાતર ગણતરી",
            "Crop Recommendation": "પાક ભલામણ",
            "Pest Risk Advisory": "જીવાત જોખમ સલાહ",
            "Fertilizer Calculation": "ખાતર ગણતરી",
            "Recommended Crop": "ભલામણ કરેલ પાક",
            "Detection Result": "રોગ નિદાન પરિણામ",
            "Schedule": "સિંચાઈ સમયપત્રક",
            "Pest Risk Level": "જીવાત જોખમ સ્તર",
            "Dosage Plan": "માત્રા યોજના",
            "Estimated Cost": "અંદાજિત ખર્ચ",
            "Recommended Treatment": "ભલામણ કરેલ ઉપચાર",
            "Soil Nutrients": "જમીન પોષક તત્વો",
            "Water Volume": "પાણીનો જથ્થો",

            // Crops
            "Wheat": "ઘઉં",
            "Rice": "ડાંગર / ચોખા",
            "Cotton": "કપાસ",
            "Maize": "મકાઈ",
            "Sugarcane": "શેરડી",
            "Soybean": "સોયાબીન",
            "Groundnut": "મગફળી",
            "Mustard": "રાયડો / સરસવ",
            "Tomato": "ટામેટા",
            "Potato": "બટાકા",
            "Gram": "ચણા",
            "Onion": "ડુંગળી",
            "Bajra": "બાજરી",
            "Jowar": "જુવાર",

            // Soils & Irrigation
            "Loamy Soil": "ગોરાડુ જમીન",
            "Sandy Soil": "રેતાળ જમીન",
            "Clay Soil": "કાળી ચીકણી જમીન",
            "Black Cotton Soil": "કાળી કપાસની જમીન",
            "Red / Laterite Soil": "રાતી / લાલ જમીન",
            "Rainfed (Dependent on monsoon)": "વરસાદ આધારિત (સુકી ખેતી)",
            "Drip Irrigation": "ટપક સિંચાઈ",
            "Sprinkler Irrigation": "ફુવારા સિંચાઈ",
            "Canal / Flood Irrigation": "નહેર / પિયત સિંચાઈ",
            "Tube well / Borewell": "બોરવેલ / કૂવો",

            // Categories
            "Seeds & Seed Treatment": "બિયારણ અને બીજ માવજત",
            "Fertilizers & Nutrients": "ખાતરો અને પોષક તત્વો",
            "Labour & Sowing Charges": "મજૂરી અને વાવણી ખર્ચ",
            "Tractor & Machinery Rental": "ટ્રેક્ટર અને સાધન ભાડું",
            "Irrigation & Electricity": "સિંચાઈ અને વીજળી ખર્ચ",
            "Transport & Mandi Cartage": "પરિવહન અને મંડી ભાડું",
            "Miscellaneous Expenses": "અન્ય પરચુરણ ખર્ચ",
            "seeds": "બિયારણ",
            "fertilizer": "ખાતર",
            "labour": "મજૂરી",
            "machinery": "મશીનરી",
            "irrigation": "સિંચાઈ",
            "transport": "પરિવહન",
            "miscellaneous": "પરચુરણ",
            "active": "સક્રિય",
            "completed": "પૂર્ણ",

            // Home & Dashboard
            "Smart Farming for a Better Tomorrow": "ઉત્તમ ભવિષ્ય માટે સ્માર્ટ અને આધુનિક ખેતી",
            "Explore Services": "સેવાઓ જુઓ",
            "Get Crop Advisory": "પાક સલાહ મેળવો",
            "AI Crop Recommendation": "AI પાક ભલામણ",
            "Real-Time Weather": "રીઅલ-ટાઇમ હવામાન",
            "Live Mandi Prices": "લાઇવ બજાર ભાવ",
            "Plant Disease Detection": "વનસ્પતિ રોગ નિદાન",
            "Government Schemes": "સરકારી યોજનાઓ",
            "Fertilizer Calculator": "ખાતર કેલ્ક્યુલેટર"
        }
    };

    // --- Dynamic Typography & Font Injector ---
    function applyLanguageTypography(lang) {
        document.documentElement.setAttribute('lang', lang);

        let fontStyleTag = document.getElementById('kisan-i18n-typography');
        if (!fontStyleTag) {
            fontStyleTag = document.createElement('style');
            fontStyleTag.id = 'kisan-i18n-typography';
            document.head.appendChild(fontStyleTag);
        }

        // Add Google Fonts if needed
        if (!document.getElementById('kisan-indic-fonts')) {
            const link = document.createElement('link');
            link.id = 'kisan-indic-fonts';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Gujarati:wght@400;500;600;700&display=swap';
            document.head.appendChild(link);
        }

        if (lang === 'hi' || lang === 'mr') {
            fontStyleTag.textContent = `
                body, h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, td, th, div.chip, .stat-value {
                    font-family: 'Mukta', 'Noto Sans Devanagari', 'Poppins', sans-serif !important;
                    letter-spacing: 0.2px;
                }
                .logo { font-family: 'Mukta', sans-serif !important; font-weight: 700; }
            `;
        } else if (lang === 'gu') {
            fontStyleTag.textContent = `
                body, h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, td, th, div.chip, .stat-value {
                    font-family: 'Noto Sans Gujarati', 'Poppins', sans-serif !important;
                    letter-spacing: 0.2px;
                }
                .logo { font-family: 'Noto Sans Gujarati', sans-serif !important; font-weight: 700; }
            `;
        } else {
            fontStyleTag.textContent = `
                body, h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, td, th, div.chip, .stat-value {
                    font-family: 'Poppins', sans-serif !important;
                }
            `;
        }
    }

    // --- Google Translate Silent Integration ---
    function triggerGoogleTranslate(lang) {
        if (lang === 'en') {
            // Reset translation cookies
            document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            document.cookie = 'googtrans=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            return;
        }

        // Set Google Translate cookie
        document.cookie = `googtrans=/en/${lang}; path=/;`;
        document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname};`;

        // Inject Google Translate script if not present
        if (!document.getElementById('google-translate-script')) {
            window.googleTranslateElementInit = function () {
                new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,mr,gu',
                    autoDisplay: false
                }, 'google_translate_element_hidden');
            };

            const hiddenDiv = document.createElement('div');
            hiddenDiv.id = 'google_translate_element_hidden';
            hiddenDiv.style.display = 'none';
            document.body.appendChild(hiddenDiv);

            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.head.appendChild(script);

            // Clean up Google Translate top bar banners from shifting UI
            const hideBannerStyle = document.createElement('style');
            hideBannerStyle.textContent = `
                .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame { display: none !important; }
                body { top: 0px !important; }
                #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
                .goog-text-highlight { background: none !important; box-shadow: none !important; }
                font { background: transparent !important; box-shadow: none !important; }
            `;
            document.head.appendChild(hideBannerStyle);
        } else {
            // Trigger combo box if already loaded
            const combo = document.querySelector('.goog-te-combo');
            if (combo) {
                combo.value = lang;
                combo.dispatchEvent(new Event('change'));
            }
        }
    }

    // --- Fast In-Memory DOM Walker Translator ---
    function translateNodeText(node, langMap, isEnglish) {
        if (node.nodeType === Node.TEXT_NODE) {
            const raw = node.nodeValue;
            if (!raw || !raw.trim()) return;

            if (node._kisanOrigText === undefined) {
                node._kisanOrigText = raw;
            }

            const orig = node._kisanOrigText;
            const trimmed = orig.trim();

            if (isEnglish) {
                node.nodeValue = orig;
                return;
            }

            if (langMap[trimmed]) {
                node.nodeValue = orig.replace(trimmed, langMap[trimmed]);
                return;
            }

            // Word/phrase token replacement for combined strings (e.g. "Wheat • 3.5 Acres")
            let modified = orig;
            let replacedAny = false;
            for (const [enKey, transVal] of Object.entries(langMap)) {
                if (enKey.length > 2 && modified.includes(enKey)) {
                    // Match whole word or exact substring
                    modified = modified.split(enKey).join(transVal);
                    replacedAny = true;
                }
            }
            if (replacedAny) {
                node.nodeValue = modified;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            // Skip non-translatable tags
            if (['script', 'style', 'noscript', 'code', 'svg', 'iframe'].includes(tagName)) return;
            if (node.classList && (node.classList.contains('material-icons') || node.classList.contains('no-translate'))) return;

            // Translate placeholders
            if (node.placeholder) {
                if (node._kisanOrigPlaceholder === undefined) {
                    node._kisanOrigPlaceholder = node.placeholder;
                }
                const origPh = node._kisanOrigPlaceholder.trim();
                if (isEnglish) {
                    node.placeholder = node._kisanOrigPlaceholder;
                } else if (langMap[origPh]) {
                    node.placeholder = langMap[origPh];
                }
            }

            // Translate button values
            if (tagName === 'input' && (node.type === 'button' || node.type === 'submit')) {
                if (node._kisanOrigVal === undefined) {
                    node._kisanOrigVal = node.value;
                }
                const origVal = node._kisanOrigVal.trim();
                if (isEnglish) {
                    node.value = node._kisanOrigVal;
                } else if (langMap[origVal]) {
                    node.value = langMap[origVal];
                }
            }

            // Recurse child nodes
            for (let i = 0; i < node.childNodes.length; i++) {
                translateNodeText(node.childNodes[i], langMap, isEnglish);
            }
        }
    }

    // --- Main setLanguage Function ---
    async function setLanguage(lang) {
        if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
        localStorage.setItem('kisanLang', lang);

        // 1. Apply Typography & Script Styling
        applyLanguageTypography(lang);

        // 2. Load JSON translations if available to augment DICTIONARY
        let externalMap = {};
        if (lang !== 'en') {
            try {
                const res = await fetch(`i18n/${lang}.json`);
                if (res.ok) {
                    externalMap = await res.json();
                }
            } catch (e) {
                // Use embedded dictionary fallback
            }
        }

        const langMap = { ...(DICTIONARY[lang] || {}), ...externalMap };
        const isEnglish = lang === 'en';

        // 3. Update all elements with explicit [data-i18n]
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = langMap[key] || (isEnglish ? null : null);
            if (translation) {
                const icon = el.querySelector('.material-icons');
                if (icon) {
                    el.innerHTML = '';
                    el.appendChild(icon);
                    el.appendChild(document.createTextNode(' ' + translation));
                } else {
                    el.textContent = translation;
                }
            }
        });

        // 4. Translate Entire DOM Tree
        translateNodeText(document.body, langMap, isEnglish);

        // 5. Update document title
        if (document.title) {
            if (!document._kisanOrigTitle) document._kisanOrigTitle = document.title;
            if (isEnglish) {
                document.title = document._kisanOrigTitle;
            } else {
                for (const [enKey, transVal] of Object.entries(langMap)) {
                    if (document._kisanOrigTitle.includes(enKey)) {
                        document.title = document._kisanOrigTitle.replace(enKey, transVal);
                        break;
                    }
                }
            }
        }

        // 6. Update all language switcher dropdowns
        document.querySelectorAll('#langSwitcher, .lang-switcher, #mobileLangSwitcher').forEach(sel => {
            sel.value = lang;
        });

        // 7. Silent Google Translate for deep/unmatched dynamic paragraphs
        triggerGoogleTranslate(lang);
    }

    // --- Expose Globally ---
    window.setLanguage = setLanguage;
    window.getCurrentLanguage = () => localStorage.getItem('kisanLang') || DEFAULT_LANG;

    // --- Initialization on DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', () => {
        const savedLang = localStorage.getItem('kisanLang') || DEFAULT_LANG;

        // Bind all dropdowns
        const attachDropdownListeners = () => {
            document.querySelectorAll('#langSwitcher, .lang-switcher, #mobileLangSwitcher').forEach(el => {
                el.value = savedLang;
                el.onchange = (e) => {
                    setLanguage(e.target.value);
                };
            });
        };
        attachDropdownListeners();

        // Apply chosen language
        setLanguage(savedLang);

        // Watch for dynamically added DOM elements (API responses, modals, tables)
        let debounceTimer = null;
        const observer = new MutationObserver(() => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const currentLang = localStorage.getItem('kisanLang') || DEFAULT_LANG;
                if (currentLang !== 'en') {
                    const langMap = DICTIONARY[currentLang] || {};
                    translateNodeText(document.body, langMap, false);
                }
                attachDropdownListeners();
            }, 100);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
})();
