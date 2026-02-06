document.addEventListener('DOMContentLoaded', () => {

    /* ===========================
       Mobile Menu Toggle
       =========================== */
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    /* ===========================
       User Auth State Management
       =========================== */
    const checkUserLogin = () => {
        const user = localStorage.getItem('kisanUser');
        const currentPage = window.location.pathname.split("/").pop();

        // Define protected pages (pages that require login)
        const protectedPages = ['home.html', 'crop.html', 'weather.html', 'market.html'];
        // Define public pages (pages involved in auth)
        // Note: index.html is now the login page
        const publicPages = ['index.html', ''];

        // 1. If user IS logged in and is on the Login Page (index.html), redirect to Dashboard (home.html)
        if (user && (currentPage === 'index.html' || currentPage === '')) {
            window.location.href = 'home.html';
            return;
        }

        // 2. If user is NOT logged in and tries to access a protected page, redirect to Login Page (index.html)
        if (!user && protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
            return;
        }

        // 3. Update UI if logged in
        // We need to find the login link in the nav
        // This is a bit hacky because we didn't give it an ID, but it works for now
        const loginLink = Array.from(document.querySelectorAll('.nav-links a')).find(el => el.getAttribute('href') === 'index.html' || el.innerText.includes('Login'));

        if (user && loginLink) {
            // Cut "Demo" button -> Paste "Settings" Option
            // Instead of showing name, show Settings trigger
            loginLink.innerHTML = `⚙️ Settings`;
            loginLink.href = '#';
            loginLink.id = 'navSettingsBtn'; // Add ID for the listener
            loginLink.setAttribute('data-lang', 'settings'); // FIX: Update data-lang so translation works correctly

            // Remove any potential href navigation behavior manually if needed
            loginLink.addEventListener('click', (e) => e.preventDefault());
        }
    }

    // Run on load
    checkUserLogin();

    /* ===========================
       Settings & Dark Mode Logic
       =========================== */
    const initSettings = () => {
        // 1. Inject Settings Modal into body ONLY IF IT DOESN'T EXIST
        if (!document.getElementById('settingsModal')) {
            const user = JSON.parse(localStorage.getItem('kisanUser') || 'null');
            let userProfileSection = '';

            if (user) {
                // Format Date
                const loginDate = user.loggedInAt ? new Date(user.loggedInAt).toLocaleString() : 'Just now';

                userProfileSection = `
                <div class="setting-item" style="flex-direction: column; align-items: start; gap: 10px; background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                        <div style="width: 40px; height: 40px; background: var(--primary-green); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">
                            ${user.name.charAt(0)}
                        </div>
                        <div>
                            <strong style="display: block; font-size: 1rem;">${user.name}</strong>
                            <small style="color: #666; display: block;">${user.email || 'User'}</small>
                            <small style="color: #888; font-size: 0.75rem;">Login: ${loginDate}</small>
                        </div>
                    </div>
                    <button id="logoutBtn" style="width: 100%; padding: 8px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 5px;" data-lang="logout">Logout</button>
                </div>`;
            }

            const modalHTML = `
            <div id="settingsModal" class="settings-modal-overlay" style="z-index: 9999;">
                <div class="settings-modal">
                    <div class="settings-header">
                        <h2 data-lang="settings_header">Settings</h2>
                        <button class="close-settings" id="closeSettingsBtn">&times;</button>
                    </div>
                    
                    ${userProfileSection}
                    
                    <div class="setting-item">
                        <span class="setting-label" data-lang="dark_mode">Dark Mode</span>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="darkModeToggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-item">
                        <span class="setting-label" data-lang="notifications">Notifications</span>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-item" style="flex-direction: column; align-items: start;">
                        <span class="setting-label" style="margin-bottom: 10px;">Language / भाषा</span>
                        <select id="languageSelect" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ccc;">
                            <option value="en">English</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="gu">Gujarati (ગુજરાતી)</option>
                            <option value="mr">Marathi (मराठी)</option>
                            <option value="ta">Tamil (தமிழ்)</option>
                            <option value="te">Telugu (తెలుగు)</option>
                        </select>
                    </div>

                    <div class="app-version" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                        <p style="margin: 0; font-weight: 500; color: var(--text-dark);">KisanCare App</p>
                        <p style="font-size: 0.8rem; color: #888;">v1.0.0 (Beta)</p>
                    </div>

                    <div class="settings-footer">
                        <a href="#" data-lang="privacy">Privacy Policy</a> | <a href="#" data-lang="terms">Terms</a> | <a href="admin.html" data-lang="admin_panel">Admin</a>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // 2. Logic
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const darkModeToggle = document.getElementById('darkModeToggle');
        const logoutBtn = document.getElementById('logoutBtn');

        // Open Modal - Event Delegation for Robustness
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#navSettingsBtn');
            if (btn) {
                e.preventDefault();
                if (settingsModal) settingsModal.classList.add('active');
            }
        });

        // Close Modal
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });
        }

        // Close on outside click
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.remove('active');
                }
            });
        }

        // Logout Logic
        if (logoutBtn) {
            // Remove previous listeners to avoid duplicates if re-run
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);

            newLogoutBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to logout?")) {
                    localStorage.removeItem('kisanUser');
                    window.location.href = 'index.html';
                }
            });
        }
        const translations = {
            en: {
                home: "Home",
                crop_advisory: "Crop Advisory",
                weather_alerts: "Weather Alerts",
                market_prices: "Market Prices",
                settings: "⚙️ Settings",
                login: "Login",
                logout: "Logout",
                welcome: "Welcome to KisanCare",
                hero_text: "Empowering Farmers with Technology. Get real-time crop advice, weather alerts, and market prices to maximize your yield.",
                get_started: "Get Started",
                feature_crop: "Crop Advisory",
                desc_crop: "Find the best crop for your soil and season using AI data.",
                check_now: "Check Now",
                feature_weather: "Weather Alerts",
                desc_weather: "Stay prepared with real-time weather updates and warnings.",
                view_weather: "View Weather",
                feature_market: "Market Prices",
                desc_market: "Get the latest Mandi prices for your crops.",
                check_prices: "Check Prices",
                settings_header: "Settings",
                dark_mode: "Dark Mode",
                notifications: "Notifications",
                privacy: "Privacy Policy",
                terms: "Terms",
                admin_panel: "Admin",
                welcome_back: "Welcome Back",
                feedback_nav: "Feedback",
                feedback_title: "📩 Send Us Feedback",
                feedback_desc: "We value your input. Tell us how to improve.",
                send_feedback_btn: "Send Feedback",
                email_label: "Email",
                password_label: "Password",
                login_btn: "Login",
                or_continue: "Or continue with:",
                continue_google: "Continue with Google",
                login_phone_link: "Login with Phone Number",
                dont_have_account: "Don't have an account?",
                sign_up_link: "Sign Up",
                create_account: "Create Account",
                full_name: "Full Name",
                confirm_password: "Confirm Password",
                sign_up_btn: "Sign Up",
                already_account: "Already have an account?",
                login_link: "Login",
                // Crop Advisory
                crop_header: "Crop Advisory System",
                soil_label: "Soil Type",
                select_soil: "Select Soil Type",
                location_label: "Location (District)",
                season_label: "Season",
                select_season: "Select Season",
                temp_label: "Temperature (°C) (Optional)",
                get_recommendation: "Get Recommendation",
                rec_crop_title: "Recommended Crop",
                fert_sug_title: "Fertilizer Suggestion",
                // Weather
                weather_header: "Real-Time Weather Alerts",
                enter_location: "Enter Location",
                search_btn: "Search",
                status_alerts: "Status & Alerts",
                rain_prediction: "Rain Prediction:",
                // Market
                market_header: "Live Market Prices (Mandi Rates)",
                select_crop_label: "Select Crop",
                market_name_label: "Market / APMC Name",
                get_prices_btn: "Get Prices",
                price_list_title: "Price List",
                th_crop: "Crop",
                th_market: "Market",
                th_price: "Price (per Quintal)",
                th_date: "Date"
            },
            hi: {
                home: "मुखपृष्ठ",
                crop_advisory: "फसल सलाह",
                weather_alerts: "मौसम अलर्ट",
                market_prices: "बाजार भाव",
                settings: "⚙️ सेटिंग्स",
                login: "लॉग इन",
                logout: "लॉग आउट",
                welcome: "किसानकेयर में आपका स्वागत है",
                hero_text: "तकनीक के साथ किसानों को सशक्त बनाना। अपनी पैदावार बढ़ाने के लिए वास्तविक समय में फसल सलाह, मौसम अलर्ट और बाजार मूल्य प्राप्त करें।",
                get_started: "शुरु करें",
                feature_crop: "फसल सलाह",
                desc_crop: "एआई डेटा का उपयोग करके अपनी मिट्टी और मौसम के लिए सबसे अच्छी फसल खोजें।",
                check_now: "अभी जाचें",
                feature_weather: "मौसम अलर्ट",
                desc_weather: "वास्तविक समय के मौसम अपडेट और चेतावनियों के साथ तैयार रहें।",
                view_weather: "मौसम देखें",
                feature_market: "बाजार भाव",
                desc_market: "अपनी फसलों के लिए नवीनतम मंडी भाव प्राप्त करें।",
                check_prices: "कीमतें देखें",
                settings_header: "सेटिंग्स",
                dark_mode: "डार्क मोड",
                notifications: "सूचनाएं",
                privacy: "गोपनीयता नीति",
                terms: "शर्तें",
                admin_panel: "एडमिन",
                welcome_back: "वापसी पर स्वागत है",
                feedback_nav: "प्रतिक्रिया",
                feedback_title: "📩 सुझाव भेजें",
                feedback_desc: "हम आपकी राय का सम्मान करते हैं। हमें बताएं कि सुधार कैसे करें।",
                send_feedback_btn: "सुझाव भेजें",
                email_label: "ईमेल",
                password_label: "पासवर्ड",
                login_btn: "लॉग इन करें",
                or_continue: "या जारी रखें:",
                continue_google: "Google के साथ जारी रखें",
                login_phone_link: "फ़ोन नंबर से लॉग इन करें",
                dont_have_account: "खाता नहीं है?",
                sign_up_link: "साइन अप करें",
                create_account: "खाता बनाएं",
                full_name: "पूरा नाम",
                confirm_password: "पासवर्ड की पुष्टि करें",
                sign_up_btn: "साइन अप करें",
                already_account: "क्या आपके पास पहले से एक खाता मौजूद है?",
                login_link: "लॉग इन करें",
                // Crop Advisory
                crop_header: "फसल सलाह प्रणाली",
                soil_label: "मिट्टी का प्रकार",
                select_soil: "मिट्टी का प्रकार चुनें",
                location_label: "स्थान (जिला)",
                season_label: "मौसम",
                select_season: "मौसम चुनें",
                temp_label: "तापमान (°C) (वैकल्पिक)",
                get_recommendation: "सिफारिश प्राप्त करें",
                rec_crop_title: "अनुशंसित फसल",
                fert_sug_title: "उर्वरक सुझाव",
                // Weather
                weather_header: "वास्तविक समय मौसम अलर्ट",
                enter_location: "स्थान दर्ज करें",
                search_btn: "खोजें",
                status_alerts: "स्थिति और अलर्ट",
                rain_prediction: "बारिश की भविष्यवाणी:",
                // Market
                market_header: "लाइव बाजार भाव (मंडी दरें)",
                select_crop_label: "फसल चुनें",
                market_name_label: "बाजार / APMC नाम",
                get_prices_btn: "भाव प्राप्त करें",
                price_list_title: "मूल्य सूची",
                th_crop: "फसल",
                th_market: "बाजार",
                th_price: "कीमत (प्रति क्विंटल)",
                th_date: "तारीख"
            },
            gu: {
                home: "ઘર",
                crop_advisory: "પાક સલાહ",
                weather_alerts: "હવામાન ચેતવણી",
                market_prices: "બજાર ભાવ",
                settings: "⚙️ સેટિંગ્સ",
                login: "લૉગ ઇન",
                logout: "લોગ આઉટ",
                welcome: "કિસાનકેરમાં આપનું સ્વાગત છે",
                hero_text: "ટેકનોલોજી સાથે ખેડૂતોને સશક્તિકરણ. તમારી ઉપજ વધારવા માટે રીઅલ-ટાઇમ પાક સલાહ, હવામાન ચેતવણીઓ અને બજાર કિંમતો મેળવો.",
                get_started: "શરૂ કરો",
                feature_crop: "પાક સલાહ",
                desc_crop: "AI ડેટાનો ઉપયોગ કરીને તમારી જમીન અને મોસમ માટે શ્રેષ્ઠ પાક શોધો.",
                check_now: "હવે તપાસો",
                feature_weather: "હવામાન ચેતવણી",
                desc_weather: "રીઅલ-ટાઇમ હવામાન અપડેટ્સ અને ચેતવણીઓ સાથે તૈયાર રહો.",
                view_weather: "હવામાન જુઓ",
                feature_market: "બજાર ભાવ",
                desc_market: "તમારા પાક માટે નવીનતમ મંડીના ભાવ મેળવો.",
                check_prices: "કિંમતો તપાસો",
                settings_header: "સેટિંગ્સ",
                dark_mode: "ડાર્ક મોડ",
                notifications: "સૂચનાઓ",
                privacy: "ગોપનીયતા નીતિ",
                terms: "શરતો",
                admin_panel: "એડમિન",
                welcome_back: "સ્વાગત છે",
                feedback_nav: "પ્રતિસાદ",
                feedback_title: "📩 પ્રતિસાદ મોકલો",
                feedback_desc: "અમને સુધારવા માટે જણાવો.",
                send_feedback_btn: "મોકલો",
                email_label: "ઇમેઇલ",
                password_label: "પાસવર્ડ",
                login_btn: "લૉગ ઇન",
                or_continue: "અથવા ચાલુ રાખો:",
                continue_google: "Google સાથે ચાલુ રાખો",
                login_phone_link: "ફોન નંબર સાથે લૉગ ઇન કરો",
                dont_have_account: "ખાતું નથી?",
                sign_up_link: "સાઇન અપ કરો",
                create_account: "ખાતું બનાવો",
                full_name: "પૂરું નામ",
                confirm_password: "પાસવર્ડ પુષ્ટિ કરો",
                sign_up_btn: "સાઇન અપ કરો",
                already_account: "પહેલેથી જ ખાતું છે?",
                login_link: "લૉગ ઇન",
                // Crop Advisory
                crop_header: "પાક સલાહ પ્રણાલી",
                soil_label: "જમીનનો પ્રકાર",
                select_soil: "જમીનનો પ્રકાર પસંદ કરો",
                location_label: "સ્થળ (જિલ્લો)",
                season_label: "સીઝન",
                select_season: "સીઝન પસંદ કરો",
                temp_label: "તાપમાન (°C) (વૈકલ્પિક)",
                get_recommendation: "ભલામણ મેળવો",
                rec_crop_title: "ભલામણ પાક",
                fert_sug_title: "ખાતર સૂચન",
                // Weather
                weather_header: "રીઅલ-ટાઇમ હવામાન ચેતવણી",
                enter_location: "સ્થળ દાખલ કરો",
                search_btn: "શોધો",
                status_alerts: "સ્થિતિ અને ચેતવણીઓ",
                rain_prediction: "વરસાદની આગાહી:",
                // Market
                market_header: "લાઇવ બજાર ભાવ (મંડી દરો)",
                select_crop_label: "પાક પસંદ કરો",
                market_name_label: "બજાર / APMC નામ",
                get_prices_btn: "ભાવ મેળવો",
                price_list_title: "ભાવ યાદી",
                th_crop: "પાક",
                th_market: "બજાર",
                th_price: "કિંમત (ક્વિન્ટલ દીઠ)",
                th_date: "તારીખ"
            },
            mr: {
                home: "मुख्यपृष्ठ",
                crop_advisory: "पीक सल्ला",
                weather_alerts: "हवामान अलर्ट",
                market_prices: "बाजार भाव",
                settings: "⚙️ सेटिंग्ज",
                login: "लॉग इन करा",
                logout: "लॉग आउट",
                welcome: "किसानकेअर मध्ये आपले स्वागत आहे",
                hero_text: "तंत्रज्ञानासह शेतकऱ्यांना सक्षम करणे. आपले उत्पन्न वाढविण्यासाठी रिअल-टाइम पीक सल्ला, हवामान अलर्ट आणि बाजार भाव मिळवा.",
                get_started: "सुरू करा",
                feature_crop: "पीक सल्ला",
                desc_crop: "एआय डेटा वापरून आपल्या माती आणि हंगामासाठी सर्वोत्तम पीक शोधा.",
                check_now: "आता तपासा",
                feature_weather: "हवामान अलर्ट",
                desc_weather: "रिअल-टाइम हवामान अद्यतने आणि चेतावणींसह तयार रहा.",
                view_weather: "हवामान पहा",
                feature_market: "बाजार भाव",
                desc_market: "आपल्या पिकांसाठी नवीनतम मंडी भाव मिळवा.",
                check_prices: "किंमती तपासा",
                settings_header: "सेटिंग्ज",
                dark_mode: "डार्क मोड",
                notifications: "सूचना",
                privacy: "गोपनीयता धोरण",
                terms: "अटी",
                admin_panel: "प्रशासन",
                welcome_back: "पुन्हा स्वागत आहे",
                feedback_nav: "प्रतिक्रिया",
                feedback_title: "📩 प्रतिक्रिया पाठवा",
                feedback_desc: "आम्ही तुमच्या मताची कदर करतो.",
                send_feedback_btn: "प्रतिक्रिया पाठवा",
                email_label: "ईमेल",
                password_label: "पासवर्ड",
                login_btn: "लॉग इन करा",
                or_continue: "किंवा सुरू ठेवा:",
                continue_google: "Google सह सुरू ठेवा",
                login_phone_link: "फोन नंबरसह लॉग इन करा",
                dont_have_account: "खाते नाही?",
                sign_up_link: "साइन अप करा",
                create_account: "खाते तयार करा",
                full_name: "पूर्ण नाव",
                confirm_password: "पासवर्डची पुष्टी करा",
                sign_up_btn: "साइन अप करा",
                already_account: "आधीपासूनच खाते आहे?",
                login_link: "लॉग इन करा",
                // Crop Advisory
                crop_header: "पीक सल्ला प्रणाली",
                soil_label: "मातीचा प्रकार",
                select_soil: "मातीचा प्रकार निवडा",
                location_label: "ठिकाण (जिल्हा)",
                season_label: "हंगाम",
                select_season: "हंगाम निवडा",
                temp_label: "तापमान (°C) (पर्यायी)",
                get_recommendation: "शिफारस मिळवा",
                rec_crop_title: "शिफारस केलेले पीक",
                fert_sug_title: "खत सूचना",
                // Weather
                weather_header: "हवामान अलर्ट",
                enter_location: "ठिकाण प्रविष्ट करा",
                search_btn: "शोधा",
                status_alerts: "स्थिती आणि अलर्ट",
                rain_prediction: "पाऊस अंदाज:",
                // Market
                market_header: "बाजार भाव (मंडी दर)",
                select_crop_label: "पीक निवडा",
                market_name_label: "बाजार / APMC नाव",
                get_prices_btn: "भाव मिळवा",
                price_list_title: "भाव यादी",
                th_crop: "पीक",
                th_market: "बाजार",
                th_price: "किंमत (प्रति क्विंटल)",
                th_date: "तारीख"
            },
            ta: {
                home: "முகப்பு",
                crop_advisory: "பயிர் ஆலோசனை",
                weather_alerts: "வானிலை எச்சரிக்கைகள்",
                market_prices: "சந்தை விலைகள்",
                settings: "⚙️ அமைப்புகள்",
                login: "உள்நுழைய",
                logout: "வெளியேறு",
                welcome: "கிசான்கேருக்கு வரவேற்கிறோம்",
                hero_text: "தொழில்நுட்பத்துடன் விவசாயிகளுக்கு அதிகாரம். உங்கள் விளைச்சலை அதிகரிக்க உண்மையான நேர பயிர் ஆலோசனை, வானிலை எச்சரிக்கைகள் மற்றும் சந்தை விலைகளைப் பெறுங்கள்.",
                get_started: "தொடங்கவும்",
                feature_crop: "பயிர் ஆலோசனை",
                desc_crop: "AI தரவைப் பயன்படுத்தி உங்கள் மண் மற்றும் பருவத்திற்கான சிறந்த பயிரைக் கண்டறியவும்.",
                check_now: "இப்போது சரிபார்க்கவும்",
                feature_weather: "வானிலை எச்சரிக்கைகள்",
                desc_weather: "உண்மையான நேர வானிலை புதுப்பிப்புகள் மற்றும் எச்சரிக்கைகளுடன் தயாராக இருங்கள்.",
                view_weather: "வானிலையைப் பார்க்கவும்",
                feature_market: "சந்தை விலைகள்",
                desc_market: "உங்கள் பயிர்களுக்கான சமீபத்திய மண்டி விலைகளைப் பெறுங்கள்.",
                check_prices: "விலைகளைச் சரிபார்க்கவும்",
                settings_header: "அமைப்புகள்",
                dark_mode: "டார்க் மோட்",
                notifications: "அறிவிப்புகள்",
                privacy: "தனியுரிமைக் கொள்கை",
                terms: "விதிமுறைகள்",
                admin_panel: "நிர்வாகம்",
                welcome_back: "மீண்டும் வருக",
                feedback_nav: "கருத்து",
                feedback_title: "📩 கருத்து அனுப்பவும்",
                feedback_desc: "உங்கள் கருத்தை மதிக்கிறோம்.",
                send_feedback_btn: "அனுப்பவும்",
                email_label: "மின்னஞ்சல்",
                password_label: "கடவுச்சொல்",
                login_btn: "உள்நுழைய",
                or_continue: "அல்லது தொடரவும்:",
                continue_google: "Google உடன் தொடரவும்",
                login_phone_link: "தொலைபேசி எண்ணுடன் உள்நுழையவும்",
                dont_have_account: "கணக்கு இல்லையா?",
                sign_up_link: "பதிவு செய்யவும்",
                create_account: "கணக்கை உருவாக்கவும்",
                full_name: "முழு பெயர்",
                confirm_password: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
                sign_up_btn: "பதிவு செய்யவும்",
                already_account: "ஏற்கனவே கணக்கு உள்ளதா?",
                login_link: "உள்நுழைய",
                // Crop Advisory
                crop_header: "பயிர் ஆலோசனை அமைப்பு",
                soil_label: "மண் வகை",
                select_soil: "மண் வகையைத் தேர்ந்தெடுக்கவும்",
                location_label: "இடம் (மாவட்டம்)",
                season_label: "பருவம்",
                select_season: "பருவத்தைத் தேர்ந்தெடுக்கவும்",
                temp_label: "வெப்பநிலை (°C) (விருப்பம்)",
                get_recommendation: "பரிந்துரையைப் பெறுங்கள்",
                rec_crop_title: "பரிந்துரைக்கப்பட்ட பயிர்",
                fert_sug_title: "உரம் பரிந்துரை",
                // Weather
                weather_header: "சரியான நேர வானிலை எச்சரிக்கைகள்",
                enter_location: "இடத்தை உள்ளிடவும்",
                search_btn: "தேடு",
                status_alerts: "நிலை & எச்சரிக்கைகள்",
                rain_prediction: "மழை முன்னறிவிப்பு:",
                // Market
                market_header: "சந்தை விலைகள் (மண்டி விலைகள்)",
                select_crop_label: "பயிரைத் தேர்ந்தெடுக்கவும்",
                market_name_label: "சந்தை / APMC பெயர்",
                get_prices_btn: "விலைகளைப் பெறுங்கள்",
                price_list_title: "விலை பட்டியல்",
                th_crop: "பயிர்",
                th_market: "சந்தை",
                th_price: "விலை (குவின்டாலுக்கு)",
                th_date: "தேதி"
            },
            te: {
                home: "హోమ్",
                crop_advisory: "పంట సలహా",
                weather_alerts: "వాతావరణ హెచ్చరికలు",
                market_prices: "మార్కెట్ ధరలు",
                settings: "⚙️ సెట్టింగ్‌లు",
                login: "లాగిన్",
                logout: "లాగ్ అవుట్",
                welcome: "కిసాన్‌కేర్‌కు స్వాగతం",
                hero_text: "టెక్నాలజీతో రైతులకు సాధికారత. మీ దిగుబడిని పెంచడానికి రియల్ టైమ్ పంట సలహా, వాతావరణ హెచ్చరికలు మరియు మార్కెట్ ధరలను పొందండి.",
                get_started: "ప్రారంభించండి",
                feature_crop: "పంట సలహా",
                desc_crop: "AI డేటాను ఉపయోగించి మీ మట్టి మరియు సీజన్ కోసం ఉత్తమ పంటను కనుగొనండి.",
                check_now: "ఇప్పుడే తనిఖీ చేయండి",
                feature_weather: "వాతావరణ హెచ్చరికలు",
                desc_weather: "రియల్ టైమ్ వాతావరణ నవీకరణలు మరియు హెచ్చరికలతో సిద్ధంగా ఉండండి.",
                view_weather: "వాతావరణం చూడండి",
                feature_market: "మార్కెట్ ధరలు",
                desc_market: "మీ పంటల కోసం తాజా మండి ధరలను పొందండి.",
                check_prices: "ధరలు చూడండి",
                settings_header: "సెట్టింగ్‌లు",
                dark_mode: "డార్క్ మోడ్",
                notifications: "నోటిఫికేషన్లు",
                privacy: "గోప్యతా విధానం",
                terms: "నిబంధనలు",
                admin_panel: "అడ్మిన్",
                welcome_back: "స్వాగతం",
                feedback_nav: "అభిప్రాయం",
                feedback_title: "📩 అభిప్రాయం పంపండి",
                feedback_desc: "మీ అభిప్రాయం మాకు ముఖ్యం.",
                send_feedback_btn: "పంపండి",
                email_label: "ఇమెయిల్",
                password_label: "పాస్వర్డ్",
                login_btn: "లాగిన్",
                or_continue: "లేదా కొనసాగించండి:",
                continue_google: "Google తో కొనసాగించండి",
                login_phone_link: "ఫోన్ నంబర్‌తో లాగిన్ అవ్వండి",
                dont_have_account: "ఖాతా లేదా?",
                sign_up_link: "సైన్ అప్",
                create_account: "ఖాతాను సృష్టించండి",
                full_name: "పూర్తి పేరు",
                confirm_password: "పాస్వర్డ్ నిర్ధారించండి",
                sign_up_btn: "సైన్ అప్",
                already_account: "ఇప్పటికే ఖాతా ఉందా?",
                login_link: "లాగిన్",
                // Crop Advisory
                crop_header: "పంట సలహా విధానం",
                soil_label: "మట్టి రకం",
                select_soil: "మట్టి రకం ఎంచుకోండి",
                location_label: "స్థానం (జిల్లా)",
                season_label: "సీజన్",
                select_season: "సీజన్ ఎంచుకోండి",
                temp_label: "ఉష్ణోగ్రత (°C) (ఐచ్ఛికం)",
                get_recommendation: "సిఫార్సు పొందండి",
                rec_crop_title: "సూచించిన పంట",
                fert_sug_title: "ఎరువుల సలహా",
                // Weather
                weather_header: "రియల్ టైమ్ వాతావరణ హెచ్చరికలు",
                enter_location: "స్థానం నమోదు చేయండి",
                search_btn: "శోధించండి",
                status_alerts: "స్థితి & హెచ్చరికలు",
                rain_prediction: "వర్ష సూచన:",
                // Market
                market_header: "మార్కెట్ ధరలు (మండి ధరలు)",
                select_crop_label: "పంటను ఎంచుకోండి",
                market_name_label: "మార్కెట్ / APMC పేరు",
                get_prices_btn: "ధరలు పొందండి",
                price_list_title: "ధరల జాబితా",
                th_crop: "పంట",
                th_market: "మార్కెట్",
                th_price: "ధర (క్వింటాల్‌కు)",
                th_date: "తేదీ"
            }
        };

        const languageSelect = document.getElementById('languageSelect');

        const applyLanguage = (lang) => {
            const t = translations[lang];
            if (!t) return;

            // Save preference
            localStorage.setItem('kisanLanguage', lang);

            // Update DOM Elements with data-lang attribute
            document.querySelectorAll('[data-lang]').forEach(el => {
                const key = el.getAttribute('data-lang');
                if (t[key]) {
                    el.innerText = t[key];
                }
            });

            // Special Handling for dynamic elements if necessary
            const settingsBtn = document.getElementById('navSettingsBtn');
            if (settingsBtn && settingsBtn.innerText.includes('Settings')) {
                // settingsBtn.innerText = t['settings']; // Keep emoji
                // Handled by data-lang if possible, or manual update
            }

            // Dropdown value update
            if (languageSelect) languageSelect.value = lang;
        };

        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                applyLanguage(e.target.value);
            });
        }

        // Initialize Language
        const savedLang = localStorage.getItem('kisanLanguage') || 'en';
        applyLanguage(savedLang);
    };

    // Initialize Settings
    initSettings();

    /* ===========================
       Crop Advisory Logic
       =========================== */
    const cropForm = document.getElementById('cropForm');
    const cropResult = document.getElementById('cropResult');
    const recommendationText = document.getElementById('recommendationText');
    const fertilizerText = document.getElementById('fertilizerText');

    if (cropForm) {
        cropForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Simulation of API Call
            const soil = document.getElementById('soilType').value;
            const season = document.getElementById('season').value;

            if (!soil || !season) {
                alert("Please fill all required fields!");
                return;
            }

            // Mock Data Logic
            let crop = "Wheat";
            let fertilizer = "NPK 14:35:14";

            if (season === "Kharif") {
                crop = "Rice (Paddy)";
                fertilizer = "Urea + DAP";
            } else if (season === "Zaid") {
                crop = "Watermelon / Cucumber";
                fertilizer = "Potash rich";
            } else if (soil === "Black") {
                crop = "Cotton";
                fertilizer = "Nitrogen + Phosphorus";
            }

            // Show Loading State
            cropResult.style.display = 'block';
            recommendationText.innerText = "Analyzing soil and season...";
            fertilizerText.innerText = "...";

            setTimeout(() => {
                recommendationText.innerText = `${crop}`;
                fertilizerText.innerText = `${fertilizer}`;
            }, 1000);
        });
    }

    /* ===========================
       Weather Logic
       =========================== */
    const getWeatherBtn = document.getElementById('getWeatherBtn');
    const weatherLocation = document.getElementById('weatherLocation');

    // Helper function for weather search
    const fetchWeather = async () => {
        const location = weatherLocation.value;
        if (!location) {
            alert("Please enter a location");
            return;
        }

        const weatherDisplay = document.getElementById('weatherDisplay');
        const displayLocation = document.getElementById('displayLocation');
        const displayTemp = document.getElementById('displayTemp');
        const displayCondition = document.getElementById('displayCondition');
        const alertBox = document.getElementById('alertBox');

        // ---------------------------------------------------------
        // 🔑 PRIMARY API: OpenWeatherMap
        // ---------------------------------------------------------
        const API_KEY = "caa30be46e4869ad3f56a29f5949304c";

        // Show loading
        weatherDisplay.style.display = 'flex';
        displayCondition.innerText = "Loading...";

        try {
            // TRY 1: OpenWeatherMap
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`);

            if (!response.ok) {
                console.warn("OpenWeatherMap Failed (Invalid Key/City), trying backup...");
                throw new Error("OWM Failed");
            }

            const data = await response.json();

            // Update UI with REAL Data from OWM
            displayLocation.innerText = `${data.name}, ${data.sys.country}`;
            displayTemp.innerText = `${Math.round(data.main.temp)}°C`;
            displayCondition.innerText = data.weather[0].main;

            // Alert Logic
            updateAlerts(data.main.temp, data.weather[0].main);

        } catch (error) {
            // TRY 2: Open-Meteo (Free Backup, No Key)
            console.log("Switching to Open-Meteo Backup because:", error.message);
            try {
                // Step A: Geocoding (Get Lat/Lon for city)
                const geoResp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1&language=en&format=json`);
                const geoData = await geoResp.json();

                if (!geoData.results || geoData.results.length === 0) {
                    throw new Error("City not found in Backup");
                }

                const { latitude, longitude, name, country } = geoData.results[0];

                // Step B: Get Weather
                const meteoResp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                const meteoData = await meteoResp.json();

                const current = meteoData.current_weather;
                const conditionText = getWeatherCondition(current.weathercode);

                // Update UI with BACKUP Data
                displayLocation.innerText = `${name}, ${country}`;
                displayTemp.innerText = `${Math.round(current.temperature)}°C`;
                displayCondition.innerText = conditionText;

                updateAlerts(current.temperature, conditionText);

            } catch (backupError) {
                console.error("All Weather APIs failed.");
                alert("❌ Could not fetch weather. Please check your internet connection.");
                displayLocation.innerText = "Error";
                displayCondition.innerText = "--";
                displayTemp.innerText = "--";
            }
        }
    };

    // Helper to map WMO codes to text (for Open-Meteo)
    const getWeatherCondition = (code) => {
        if (code === 0) return "Clear Sky";
        if (code >= 1 && code <= 3) return "Partly Cloudy";
        if (code >= 45 && code <= 48) return "Fog";
        if (code >= 51 && code <= 67) return "Drizzle/Rain";
        if (code >= 71 && code <= 77) return "Snow";
        if (code >= 80 && code <= 82) return "Showers";
        if (code >= 95) return "Thunderstorm";
        return "Unknown";
    };

    // Helper for Alerts
    const updateAlerts = (temp, condition) => {
        const alertBox = document.getElementById('alertBox');
        condition = condition.toLowerCase();

        if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm') || condition.includes('showers')) {
            alertBox.className = "alert-box alert-danger";
            alertBox.innerText = "🌧️ Rainfall Alert: Protect harvested crops!";
        } else if (temp > 35) {
            alertBox.className = "alert-box alert-warning";
            alertBox.innerText = "⚠️ High Heat Alert: Ensure irrigation.";
        } else if (temp < 5) {
            alertBox.className = "alert-box alert-warning";
            alertBox.innerText = "❄️ Frost Warning: Protect sensitive plants.";
        } else {
            alertBox.className = "alert-box alert-safe";
            alertBox.innerText = "✅ Weather is favorable for farming.";
        }
    };

    if (getWeatherBtn) {
        getWeatherBtn.addEventListener('click', fetchWeather);

        // Allow Enter key to trigger search
        if (weatherLocation) {
            weatherLocation.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    fetchWeather();
                }
            });
        }
    }

    /* ===========================
       Market Prices Logic
       =========================== */
    const getPriceBtn = document.getElementById('getPriceBtn');
    if (getPriceBtn) {
        getPriceBtn.addEventListener('click', () => {
            const crop = document.getElementById('marketCrop').value;
            const priceResult = document.getElementById('priceResult');
            const tableBody = document.getElementById('priceTableBody');

            priceResult.style.display = 'block';
            tableBody.innerHTML = '<tr><td colspan="4">Loading prices...</td></tr>';

            setTimeout(() => {
                const today = new Date().toLocaleDateString();
                const priceBase = Math.floor(Math.random() * 2000) + 1000; // 1000-3000 range

                tableBody.innerHTML = `
                    <tr>
                        <td>${crop.charAt(0).toUpperCase() + crop.slice(1)}</td>
                        <td>Local Mandi</td>
                        <td>₹${priceBase}</td>
                        <td>${today}</td>
                    </tr>
                     <tr>
                        <td>${crop.charAt(0).toUpperCase() + crop.slice(1)}</td>
                        <td>District APMC</td>
                        <td>₹${priceBase + 50}</td>
                        <td>${today}</td>
                    </tr>
                `;
            }, 800);
        });
    }

    /* ===========================
       Feedback Logic (Modal)
       =========================== */
    const initFeedback = () => {
        const feedbackBtn = document.getElementById('navFeedbackLink');
        if (!feedbackBtn) return;

        feedbackBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Create Modal if not exists
            if (!document.getElementById('feedbackModal')) {
                const modalHTML = `
                <div id="feedbackModal" class="settings-modal-overlay" style="z-index: 10000;">
                    <div class="settings-modal">
                        <div class="settings-header">
                            <h2 data-lang="feedback_title">📩 Send Us Feedback</h2>
                            <button id="closeFeedbackBtn" class="close-btn">&times;</button>
                        </div>
                        <div class="settings-content">
                            <p data-lang="feedback_desc" style="margin-bottom:15px">We value your input. Tell us how to improve.</p>
                             <form id="feedbackFormModal">
                                <div class="form-group">
                                    <input type="text" id="feedbackNameModal" placeholder="Your Name" required style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                </div>
                                <div class="form-group">
                                    <textarea id="feedbackMessageModal" placeholder="Your Message" required style="width: 100%; padding: 10px; height: 80px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                                </div>
                                <button type="submit" class="btn" style="width:100%" data-lang="send_feedback_btn">Send Feedback</button>
                            </form>
                        </div>
                    </div>
                </div>`;
                document.body.insertAdjacentHTML('beforeend', modalHTML);

                // Show Modal (Add active class for CSS display:flex)
                setTimeout(() => {
                    document.getElementById('feedbackModal').classList.add('active');
                }, 10);

                // Attach Close Logic
                document.getElementById('closeFeedbackBtn').addEventListener('click', () => {
                    document.getElementById('feedbackModal').remove();
                });

                // Attach Submit Logic
                document.getElementById('feedbackFormModal').addEventListener('submit', async (ev) => {
                    ev.preventDefault();
                    const name = document.getElementById('feedbackNameModal').value;
                    const message = document.getElementById('feedbackMessageModal').value;
                    const btn = ev.target.querySelector('button');
                    const originalText = btn.innerText;

                    btn.innerText = "Sending...";
                    btn.disabled = true;

                    try {
                        const response = await fetch('http://localhost:5001/submit-feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name, message })
                        });

                        const result = await response.json();
                        if (result.status === 'success') {
                            alert("✅ " + result.message);
                            document.getElementById('feedbackModal').remove();
                        } else {
                            alert("❌ Error: " + result.error);
                        }
                    } catch (err) {
                        console.error(err);
                        alert("❌ Failed to connect to server.");
                    } finally {
                        btn.innerText = originalText;
                        btn.disabled = false;
                    }
                });

                // Close on outside click
                document.getElementById('feedbackModal').addEventListener('click', (ev) => {
                    if (ev.target === document.getElementById('feedbackModal')) {
                        document.getElementById('feedbackModal').remove();
                    }
                });
            } else {
                // If it was hidden, show it (but here we remove it on close, so we just re-create usually or just display block if we cached it. Removing is safer for fresh state)
                // Since check above handles creation, we are good.
            }
        });
    };
    initFeedback();

});
