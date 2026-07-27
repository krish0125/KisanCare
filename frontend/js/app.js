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
            loginLink.innerHTML = `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> Settings`;
            loginLink.href = '#';
            loginLink.id = 'navSettingsBtn'; // Add ID for the listener
            loginLink.setAttribute('data-lang', 'settings'); // FIX: Update data-lang so translation works correctly

            // Remove any potential href navigation behavior manually if needed
            loginLink.addEventListener('click', (e) => e.preventDefault());
        }
        // 4. Inject Notifications link for logged in users
        const navLinksList = document.querySelector('.nav-links');
        const token = localStorage.getItem('kisanToken'); // JWT token
        if (token && navLinksList && !document.querySelector('a[href="notifications.html"]')) {
            const notifLi = document.createElement('li');
            const isActive = currentPage === 'notifications.html' ? 'class="active"' : '';
            notifLi.innerHTML = `<a href="notifications.html" ${isActive}><span class="material-icons">notifications</span> Notifications</a>`;
            
            // Try to insert it before the login/settings link or at the end
            const loginLi = loginLink ? loginLink.parentElement : null;
            if (loginLi) {
                navLinksList.insertBefore(notifLi, loginLi);
            } else {
                navLinksList.appendChild(notifLi);
            }
        }
    }

    // Run on load
    checkUserLogin();

    /* ===========================
       Settings & Dark Mode Logic
       =========================== */
    const initSettings = () => {
        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage === 'index.html' || currentPage === '') return;

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
                            <option value="en"> English</option>
                            <option value="hi"> Hindi (हिंदी)</option>
                            <option value="gu"> Gujarati (ગુજરાતી)</option>
                            <option value="mr"> Marathi (मराठी)</option>
                            <option value="pa"> Punjabi (ਪੰਜਾਬੀ)</option>
                            <option value="ta"> Tamil (தமிழ்)</option>
                            <option value="te"> Telugu (తెలుగు)</option>
                            <option value="bn"> Bengali (বাংলা)</option>
                            <option value="kn"> Kannada (ಕನ್ನಡ)</option>
                            <option value="ml"> Malayalam (മലയാളം)</option>
                            <option value="or"> Odia (ଓଡ଼ିଆ)</option>
                            <option value="ur"> Urdu (اردو)</option>
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
                    localStorage.removeItem('kisanToken'); // BUG FIX: also clear JWT token
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
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> Settings",
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
                feedback_title: " Send Us Feedback",
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
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> सेटिंग्स",
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
                feedback_title: " सुझाव भेजें",
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
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> સેટિંગ્સ",
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
                feedback_title: " પ્રતિસાદ મોકલો",
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
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> सेटिंग्ज",
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
                feedback_title: " प्रतिक्रिया पाठवा",
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
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> அமைப்புகள்",
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
                feedback_title: " கருத்து அனுப்பவும்",
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
            pa: {
                home: "ਮੁੱਖ ਪੰਨਾ",
                crop_advisory: "ਫ਼ਸਲ ਸਲਾਹ",
                weather_alerts: "ਮੌਸਮ ਚੇਤਾਵਨੀਆਂ",
                market_prices: "ਬਾਜ਼ਾਰ ਭਾਅ",
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> ਸੈਟਿੰਗਜ਼",
                login: "ਲੌਗ ਇਨ",
                logout: "ਲੌਗ ਆਊਟ",
                welcome: "ਕਿਸਾਨਕੇਅਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
                hero_text: "ਤਕਨੀਕ ਨਾਲ ਕਿਸਾਨਾਂ ਨੂੰ ਸ਼ਕਤੀ ਦੇਣਾ। ਆਪਣੀ ਫ਼ਸਲ ਵਧਾਉਣ ਲਈ ਫ਼ਸਲ ਸਲਾਹ, ਮੌਸਮ ਚੇਤਾਵਨੀਆਂ ਅਤੇ ਬਾਜ਼ਾਰ ਭਾਅ ਪ੍ਰਾਪਤ ਕਰੋ।",
                get_started: "ਸ਼ੁਰੂ ਕਰੋ",
                feature_crop: "ਫ਼ਸਲ ਸਲਾਹ",
                desc_crop: "AI ਡੇਟਾ ਵਰਤ ਕੇ ਆਪਣੀ ਮਿੱਟੀ ਅਤੇ ਮੌਸਮ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਫ਼ਸਲ ਲੱਭੋ।",
                check_now: "ਹੁਣੇ ਜਾਂਚੋ",
                feature_weather: "ਮੌਸਮ ਚੇਤਾਵਨੀਆਂ",
                desc_weather: "ਅਸਲ-ਸਮੇਂ ਦੇ ਮੌਸਮ ਅਪਡੇਟਾਂ ਅਤੇ ਚੇਤਾਵਨੀਆਂ ਨਾਲ ਤਿਆਰ ਰਹੋ।",
                view_weather: "ਮੌਸਮ ਵੇਖੋ",
                feature_market: "ਬਾਜ਼ਾਰ ਭਾਅ",
                desc_market: "ਆਪਣੀਆਂ ਫ਼ਸਲਾਂ ਲਈ ਤਾਜ਼ੇ ਮੰਡੀ ਭਾਅ ਪ੍ਰਾਪਤ ਕਰੋ।",
                check_prices: "ਭਾਅ ਵੇਖੋ",
                settings_header: "ਸੈਟਿੰਗਜ਼",
                dark_mode: "ਡਾਰਕ ਮੋਡ",
                notifications: "ਸੂਚਨਾਵਾਂ",
                privacy: "ਗੋਪਨੀਯਤਾ ਨੀਤੀ",
                terms: "ਸ਼ਰਤਾਂ",
                admin_panel: "ਐਡਮਿਨ",
                welcome_back: "ਵਾਪਸ ਆਉਣ 'ਤੇ ਸੁਆਗਤ ਹੈ",
                feedback_nav: "ਫ਼ੀਡਬੈਕ",
                feedback_title: " ਫ਼ੀਡਬੈਕ ਭੇਜੋ",
                feedback_desc: "ਅਸੀਂ ਤੁਹਾਡੀ ਰਾਏ ਦੀ ਕਦਰ ਕਰਦੇ ਹਾਂ।",
                send_feedback_btn: "ਭੇਜੋ",
                email_label: "ਈਮੇਲ",
                password_label: "ਪਾਸਵਰਡ",
                login_btn: "ਲੌਗ ਇਨ ਕਰੋ",
                or_continue: "ਜਾਂ ਜਾਰੀ ਰੱਖੋ:",
                continue_google: "Google ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
                login_phone_link: "ਫ਼ੋਨ ਨੰਬਰ ਨਾਲ ਲੌਗ ਇਨ ਕਰੋ",
                dont_have_account: "ਖਾਤਾ ਨਹੀਂ ਹੈ?",
                sign_up_link: "ਸਾਈਨ ਅੱਪ ਕਰੋ",
                create_account: "ਖਾਤਾ ਬਣਾਓ",
                full_name: "ਪੂਰਾ ਨਾਮ",
                confirm_password: "ਪਾਸਵਰਡ ਪੁਸ਼ਟੀ ਕਰੋ",
                sign_up_btn: "ਸਾਈਨ ਅੱਪ",
                already_account: "ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?",
                login_link: "ਲੌਗ ਇਨ",
                crop_header: "ਫ਼ਸਲ ਸਲਾਹ ਪ੍ਰਣਾਲੀ",
                soil_label: "ਮਿੱਟੀ ਦੀ ਕਿਸਮ",
                select_soil: "ਮਿੱਟੀ ਦੀ ਕਿਸਮ ਚੁਣੋ",
                location_label: "ਸਥਾਨ (ਜ਼ਿਲ੍ਹਾ)",
                season_label: "ਮੌਸਮ",
                select_season: "ਮੌਸਮ ਚੁਣੋ",
                temp_label: "ਤਾਪਮਾਨ (°C) (ਵਿਕਲਪਿਕ)",
                get_recommendation: "ਸਿਫ਼ਾਰਸ਼ ਪ੍ਰਾਪਤ ਕਰੋ",
                rec_crop_title: "ਸਿਫ਼ਾਰਸ਼ੀ ਫ਼ਸਲ",
                fert_sug_title: "ਖਾਦ ਸੁਝਾਅ",
                weather_header: "ਅਸਲ-ਸਮੇਂ ਮੌਸਮ ਚੇਤਾਵਨੀਆਂ",
                enter_location: "ਸਥਾਨ ਦਰਜ ਕਰੋ",
                search_btn: "ਖੋਜੋ",
                status_alerts: "ਸਥਿਤੀ ਅਤੇ ਚੇਤਾਵਨੀਆਂ",
                rain_prediction: "ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ:",
                market_header: "ਲਾਈਵ ਬਾਜ਼ਾਰ ਭਾਅ (ਮੰਡੀ ਦਰਾਂ)",
                select_crop_label: "ਫ਼ਸਲ ਚੁਣੋ",
                market_name_label: "ਬਾਜ਼ਾਰ / APMC ਨਾਮ",
                get_prices_btn: "ਭਾਅ ਪ੍ਰਾਪਤ ਕਰੋ",
                price_list_title: "ਭਾਅ ਸੂਚੀ",
                th_crop: "ਫ਼ਸਲ",
                th_market: "ਬਾਜ਼ਾਰ",
                th_price: "ਕੀਮਤ (ਪ੍ਰਤੀ ਕੁਇੰਟਲ)",
                th_date: "ਤਾਰੀਖ਼"
            },
            bn: {
                home: "হোম",
                crop_advisory: "ফসল পরামর্শ",
                weather_alerts: "আবহাওয়া সতর্কতা",
                market_prices: "বাজার মূল্য",
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> সেটিংস",
                login: "লগ ইন",
                logout: "লগ আউট",
                welcome: "কিসানকেয়ারে আপনাকে স্বাগতম",
                hero_text: "প্রযুক্তির মাধ্যমে কৃষকদের ক্ষমতায়ন। আপনার ফলন বাড়াতে রিয়েল-টাইম ফসল পরামর্শ, আবহাওয়া সতর্কতা এবং বাজার মূল্য পান।",
                get_started: "শুরু করুন",
                feature_crop: "ফসল পরামর্শ",
                desc_crop: "AI ডেটা ব্যবহার করে আপনার মাটি এবং মৌসুমের জন্য সেরা ফসল খুঁজুন।",
                check_now: "এখনই দেখুন",
                feature_weather: "আবহাওয়া সতর্কতা",
                desc_weather: "রিয়েল-টাইম আবহাওয়া আপডেট এবং সতর্কতার সাথে প্রস্তুত থাকুন।",
                view_weather: "আবহাওয়া দেখুন",
                feature_market: "বাজার মূল্য",
                desc_market: "আপনার ফসলের জন্য সর্বশেষ মান্ডি মূল্য পান।",
                check_prices: "মূল্য দেখুন",
                settings_header: "সেটিংস",
                dark_mode: "ডার্ক মোড",
                notifications: "বিজ্ঞপ্তি",
                privacy: "গোপনীয়তা নীতি",
                terms: "শর্তাবলী",
                admin_panel: "অ্যাডমিন",
                welcome_back: "ফিরে আসায় স্বাগতম",
                feedback_nav: "মতামত",
                feedback_title: " মতামত পাঠান",
                feedback_desc: "আমরা আপনার মতামত মূল্য দিই।",
                send_feedback_btn: "পাঠান",
                email_label: "ইমেইল",
                password_label: "পাসওয়ার্ড",
                login_btn: "লগ ইন করুন",
                or_continue: "অথবা চালিয়ে যান:",
                continue_google: "Google দিয়ে চালিয়ে যান",
                login_phone_link: "ফোন নম্বর দিয়ে লগ ইন করুন",
                dont_have_account: "অ্যাকাউন্ট নেই?",
                sign_up_link: "সাইন আপ করুন",
                create_account: "অ্যাকাউন্ট তৈরি করুন",
                full_name: "পূর্ণ নাম",
                confirm_password: "পাসওয়ার্ড নিশ্চিত করুন",
                sign_up_btn: "সাইন আপ",
                already_account: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
                login_link: "লগ ইন",
                crop_header: "ফসল পরামর্শ ব্যবস্থা",
                soil_label: "মাটির ধরন",
                select_soil: "মাটির ধরন নির্বাচন করুন",
                location_label: "অবস্থান (জেলা)",
                season_label: "মৌসুম",
                select_season: "মৌসুম নির্বাচন করুন",
                temp_label: "তাপমাত্রা (°C) (ঐচ্ছিক)",
                get_recommendation: "পরামর্শ পান",
                rec_crop_title: "প্রস্তাবিত ফসল",
                fert_sug_title: "সার পরামর্শ",
                weather_header: "রিয়েল-টাইম আবহাওয়া সতর্কতা",
                enter_location: "অবস্থান লিখুন",
                search_btn: "অনুসন্ধান",
                status_alerts: "অবস্থা এবং সতর্কতা",
                rain_prediction: "বৃষ্টির পূর্বাভাস:",
                market_header: "লাইভ বাজার মূল্য (মান্ডি হার)",
                select_crop_label: "ফসল নির্বাচন করুন",
                market_name_label: "বাজার / APMC নাম",
                get_prices_btn: "মূল্য পান",
                price_list_title: "মূল্য তালিকা",
                th_crop: "ফসল",
                th_market: "বাজার",
                th_price: "মূল্য (প্রতি কুইন্টাল)",
                th_date: "তারিখ"
            },
            kn: {
                home: "ಮನೆ",
                crop_advisory: "ಬೆಳೆ ಸಲಹೆ",
                weather_alerts: "ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು",
                market_prices: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು",
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
                login: "ಲಾಗಿನ್",
                logout: "ಲಾಗ್ ಔಟ್",
                welcome: "ಕಿಸಾನ್‌ಕೇರ್‌ಗೆ ಸ್ವಾಗತ",
                hero_text: "ತಂತ್ರಜ್ಞಾನದೊಂದಿಗೆ ರೈತರನ್ನು ಸಶಕ್ತಗೊಳಿಸುವುದು. ನಿಮ್ಮ ಇಳುವರಿ ಹೆಚ್ಚಿಸಲು ನೈಜ-ಸಮಯ ಬೆಳೆ ಸಲಹೆ, ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ಪಡೆಯಿರಿ.",
                get_started: "ಪ್ರಾರಂಭಿಸಿ",
                feature_crop: "ಬೆಳೆ ಸಲಹೆ",
                desc_crop: "AI ಡೇಟಾ ಬಳಸಿ ನಿಮ್ಮ ಮಣ್ಣು ಮತ್ತು ಋತುವಿಗೆ ಅತ್ಯುತ್ತಮ ಬೆಳೆ ಹುಡುಕಿ.",
                check_now: "ಈಗ ಪರಿಶೀಲಿಸಿ",
                feature_weather: "ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು",
                desc_weather: "ನೈಜ-ಸಮಯ ಹವಾಮಾನ ನವೀಕರಣಗಳು ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳೊಂದಿಗೆ ಸಿದ್ಧರಿರಿ.",
                view_weather: "ಹವಾಮಾನ ನೋಡಿ",
                feature_market: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು",
                desc_market: "ನಿಮ್ಮ ಬೆಳೆಗಳಿಗೆ ಇತ್ತೀಚಿನ ಮಂಡಿ ಬೆಲೆಗಳನ್ನು ಪಡೆಯಿರಿ.",
                check_prices: "ಬೆಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
                settings_header: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
                dark_mode: "ಡಾರ್ಕ್ ಮೋಡ್",
                notifications: "ಅಧಿಸೂಚನೆಗಳು",
                privacy: "ಗೌಪ್ಯತಾ ನೀತಿ",
                terms: "ನಿಯಮಗಳು",
                admin_panel: "ಅಡ್ಮಿನ್",
                welcome_back: "ಮರಳಿ ಸ್ವಾಗತ",
                feedback_nav: "ಅಭಿಪ್ರಾಯ",
                feedback_title: " ಅಭಿಪ್ರಾಯ ಕಳುಹಿಸಿ",
                feedback_desc: "ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ನಮಗೆ ಮುಖ್ಯ.",
                send_feedback_btn: "ಕಳುಹಿಸಿ",
                email_label: "ಇಮೇಲ್",
                password_label: "ಪಾಸ್‌ವರ್ಡ್",
                login_btn: "ಲಾಗಿನ್",
                or_continue: "ಅಥವಾ ಮುಂದುವರಿಸಿ:",
                continue_google: "Google ಜೊತೆ ಮುಂದುವರಿಸಿ",
                login_phone_link: "ಫೋನ್ ನಂಬರ್ ಮೂಲಕ ಲಾಗಿನ್",
                dont_have_account: "ಖಾತೆ ಇಲ್ಲವೇ?",
                sign_up_link: "ಸೈನ್ ಅಪ್",
                create_account: "ಖಾತೆ ರಚಿಸಿ",
                full_name: "ಪೂರ್ಣ ಹೆಸರು",
                confirm_password: "ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
                sign_up_btn: "ಸೈನ್ ಅಪ್",
                already_account: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
                login_link: "ಲಾಗಿನ್",
                crop_header: "ಬೆಳೆ ಸಲಹೆ ವ್ಯವಸ್ಥೆ",
                soil_label: "ಮಣ್ಣಿನ ಪ್ರಕಾರ",
                select_soil: "ಮಣ್ಣಿನ ಪ್ರಕಾರ ಆಯ್ಕೆ ಮಾಡಿ",
                location_label: "ಸ್ಥಳ (ಜಿಲ್ಲೆ)",
                season_label: "ಋತು",
                select_season: "ಋತು ಆಯ್ಕೆ ಮಾಡಿ",
                temp_label: "ಉಷ್ಣಾಂಶ (°C) (ಐಚ್ಛಿಕ)",
                get_recommendation: "ಶಿಫಾರಸು ಪಡೆಯಿರಿ",
                rec_crop_title: "ಶಿಫಾರಸು ಮಾಡಿದ ಬೆಳೆ",
                fert_sug_title: "ಗೊಬ್ಬರ ಸಲಹೆ",
                weather_header: "ನೈಜ-ಸಮಯ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು",
                enter_location: "ಸ್ಥಳ ನಮೂದಿಸಿ",
                search_btn: "ಹುಡುಕಿ",
                status_alerts: "ಸ್ಥಿತಿ ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳು",
                rain_prediction: "ಮಳೆ ಮುನ್ಸೂಚನೆ:",
                market_header: "ಲೈವ್ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು (ಮಂಡಿ ದರಗಳು)",
                select_crop_label: "ಬೆಳೆ ಆಯ್ಕೆ ಮಾಡಿ",
                market_name_label: "ಮಾರುಕಟ್ಟೆ / APMC ಹೆಸರು",
                get_prices_btn: "ಬೆಲೆಗಳನ್ನು ಪಡೆಯಿರಿ",
                price_list_title: "ಬೆಲೆ ಪಟ್ಟಿ",
                th_crop: "ಬೆಳೆ",
                th_market: "ಮಾರುಕಟ್ಟೆ",
                th_price: "ಬೆಲೆ (ಕ್ವಿಂಟಾಲ್‌ಗೆ)",
                th_date: "ದಿನಾಂಕ"
            },
            ml: {
                home: "ഹോം",
                crop_advisory: "വിള ഉപദേശം",
                weather_alerts: "കാലാവസ്ഥ മുന്നറിയിപ്പുകൾ",
                market_prices: "വിപണി വിലകൾ",
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> ക്രമീകരണങ്ങൾ",
                login: "ലോഗിൻ",
                logout: "ലോഗ് ഔട്ട്",
                welcome: "കിസാൻകെയറിലേക്ക് സ്വാഗതം",
                hero_text: "സാങ്കേതികവിദ്യ ഉപയോഗിച്ച് കർഷകരെ ശക്തിപ്പെടുത്തുന്നു. നിങ്ങളുടെ വിളവ് വർദ്ധിപ്പിക്കാൻ റിയൽ-ടൈം വിള ഉപദേശം, കാലാവസ്ഥ മുന്നറിയിപ്പുകൾ, വിപണി വിലകൾ ലഭിക്കൂ.",
                get_started: "ആരംഭിക്കൂ",
                feature_crop: "വിള ഉപദേശം",
                desc_crop: "AI ഡേറ്റ ഉപയോഗിച്ച് നിങ്ങളുടെ മണ്ണിനും സീസണിനും ഏറ്റവും അനുയോജ്യമായ വിള കണ്ടെത്തൂ.",
                check_now: "ഇപ്പോൾ പരിശോധിക്കൂ",
                feature_weather: "കാലാവസ്ഥ മുന്നറിയിപ്പുകൾ",
                desc_weather: "റിയൽ-ടൈം കാലാവസ്ഥ അപ്‌ഡേറ്റുകളും മുന്നറിയിപ്പുകളുമായി തയ്യാറാകൂ.",
                view_weather: "കാലാവസ്ഥ കാണൂ",
                feature_market: "വിപണി വിലകൾ",
                desc_market: "നിങ്ങളുടെ വിളകൾക്ക് ഏറ്റവും പുതിയ മന്ദി വിലകൾ ലഭിക്കൂ.",
                check_prices: "വിലകൾ പരിശോധിക്കൂ",
                settings_header: "ക്രമീകരണങ്ങൾ",
                dark_mode: "ഡാർക്ക് മോഡ്",
                notifications: "അറിയിപ്പുകൾ",
                privacy: "സ്വകാര്യതാ നയം",
                terms: "നിബന്ധനകൾ",
                admin_panel: "അഡ്മിൻ",
                welcome_back: "തിരിച്ചു സ്വാഗതം",
                feedback_nav: "ഫീഡ്‌ബാക്ക്",
                feedback_title: " ഫീഡ്‌ബാക്ക് അയക്കൂ",
                feedback_desc: "നിങ്ങളുടെ അഭിപ്രായം ഞങ്ങൾക്ക് പ്രധാനമാണ്.",
                send_feedback_btn: "അയക്കൂ",
                email_label: "ഇമെയിൽ",
                password_label: "പാസ്‌വേഡ്",
                login_btn: "ലോഗിൻ",
                or_continue: "അല്ലെങ്കിൽ തുടരൂ:",
                continue_google: "Google ഉപയോഗിച്ച് തുടരൂ",
                login_phone_link: "ഫോൺ നമ്പർ ഉപയോഗിച്ച് ലോഗിൻ",
                dont_have_account: "അക്കൗണ്ട് ഇല്ലേ?",
                sign_up_link: "സൈൻ അപ്",
                create_account: "അക്കൗണ്ട് ഉണ്ടാക്കൂ",
                full_name: "പൂർണ്ണ പേര്",
                confirm_password: "പാസ്‌വേഡ് സ്ഥിരീകരിക്കൂ",
                sign_up_btn: "സൈൻ അപ്",
                already_account: "ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?",
                login_link: "ലോഗിൻ",
                crop_header: "വിള ഉപദേശ സംവിധാനം",
                soil_label: "മണ്ണിന്റെ തരം",
                select_soil: "മണ്ണിന്റെ തരം തിരഞ്ഞെടുക്കൂ",
                location_label: "സ്ഥലം (ജില്ല)",
                season_label: "സീസൺ",
                select_season: "സീസൺ തിരഞ്ഞെടുക്കൂ",
                temp_label: "താപനില (°C) (ഐഛിക)",
                get_recommendation: "ശുപാർശ ലഭിക്കൂ",
                rec_crop_title: "ശുപാർശ ചെയ്ത വിള",
                fert_sug_title: "വളം നിർദ്ദേശം",
                weather_header: "റിയൽ-ടൈം കാലാവസ്ഥ മുന്നറിയിപ്പുകൾ",
                enter_location: "സ്ഥലം നൽകൂ",
                search_btn: "തിരയൂ",
                status_alerts: "നില & മുന്നറിയിപ്പുകൾ",
                rain_prediction: "മഴ പ്രവചനം:",
                market_header: "ലൈവ് വിപണി വിലകൾ (മന്ദി നിരക്കുകൾ)",
                select_crop_label: "വിള തിരഞ്ഞെടുക്കൂ",
                market_name_label: "വിപണി / APMC പേര്",
                get_prices_btn: "വിലകൾ നേടൂ",
                price_list_title: "വില പട്ടിക",
                th_crop: "വിള",
                th_market: "വിപണി",
                th_price: "വില (ക്വിന്റലിന്)",
                th_date: "തീയതി"
            },
            or: {
                home: "ଘର",
                crop_advisory: "ଫସଲ ପରାମର୍ଶ",
                weather_alerts: "ପାଣିପାଗ ସତର୍କତା",
                market_prices: "ବଜାର ମୂଲ୍ୟ",
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> ସେଟିଂ",
                login: "ଲଗ ଇନ",
                logout: "ଲଗ ଆଉଟ",
                welcome: "କିସାନକେୟାରରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ",
                hero_text: "ପ୍ରଯୁକ୍ତି ସହ କୃଷକଙ୍କୁ ସଶକ୍ତ କରିବା। ଆପଣଙ୍କ ଅମଳ ବଢ଼ାଇବା ପାଇଁ ରିୟଲ-ଟାଇମ ଫସଲ ପରାମର୍ଶ, ପାଣିପାଗ ସତର୍କତା ଏବଂ ବଜାର ମୂଲ୍ୟ ପ୍ରାପ୍ତ କରନ୍ତୁ।",
                get_started: "ଆରମ୍ଭ କରନ୍ତୁ",
                feature_crop: "ଫସଲ ପରାମର୍ଶ",
                desc_crop: "AI ଡାଟା ବ୍ୟବହାର କରି ଆପଣଙ୍କ ମାଟି ଓ ଋତୁ ପାଇଁ ଶ୍ରେଷ୍ଠ ଫସଲ ଖୋଜନ୍ତୁ।",
                check_now: "ଏବେ ଯାଞ୍ଚ କରନ୍ତୁ",
                feature_weather: "ପାଣିପାଗ ସତର୍କତା",
                desc_weather: "ରିୟଲ-ଟାଇମ ପାଣିପାଗ ଅଣ୍ଡ ସ୍ଥିତି ସହ ପ୍ରସ୍ତୁତ ରୁହନ୍ତୁ।",
                view_weather: "ପାଣିପାଗ ଦେଖନ୍ତୁ",
                feature_market: "ବଜାର ମୂଲ୍ୟ",
                desc_market: "ଆପଣଙ୍କ ଫସଲ ପାଇଁ ସର୍ବ ନୂତନ ମଣ୍ଡି ମୂଲ୍ୟ ପ୍ରାପ୍ତ କରନ୍ତୁ।",
                check_prices: "ମୂଲ୍ୟ ଦେଖନ୍ତୁ",
                settings_header: "ସେଟିଂ",
                dark_mode: "ଡାର୍କ ମୋଡ",
                notifications: "ବିଜ୍ଞପ୍ତି",
                privacy: "ଗୁପ୍ତତା ନୀତି",
                terms: "ସର୍ତ୍ତ",
                admin_panel: "ଆଡ୍ମିନ",
                welcome_back: "ପୁଣି ସ୍ୱାଗତ",
                feedback_nav: "ମତାମତ",
                feedback_title: " ମତାମତ ପଠାନ୍ତୁ",
                feedback_desc: "ଆମ ଉନ୍ନତି ପାଇଁ ବୁଝାଇ ଦିଅନ୍ତୁ।",
                send_feedback_btn: "ପଠାନ୍ତୁ",
                email_label: "ଇ-ମେଲ",
                password_label: "ପାସ୍ୱାର୍ଡ",
                login_btn: "ଲଗ ଇନ",
                or_continue: "କିମ୍ବା ଜାରି ରଖନ୍ତୁ:",
                continue_google: "Google ସହ ଜାରି ରଖନ୍ତୁ",
                login_phone_link: "ଫୋନ ନମ୍ବର ସହ ଲଗ ଇନ",
                dont_have_account: "ଖାତା ନାହିଁ?",
                sign_up_link: "ସାଇନ ଅପ",
                create_account: "ଖାତା ତିଆରି କରନ୍ତୁ",
                full_name: "ପୂରା ନାମ",
                confirm_password: "ପାସ୍ୱାର୍ଡ ନିଶ୍ଚିତ କରନ୍ତୁ",
                sign_up_btn: "ସାଇନ ଅପ",
                already_account: "ଆଗରୁ ଖାତା ଅଛି?",
                login_link: "ଲଗ ଇନ",
                crop_header: "ଫସଲ ପରାମର୍ଶ ଭଣ୍ଡାର",
                soil_label: "ମାଟି ଧରଣ",
                select_soil: "ମାଟି ଧରଣ ବାଛନ୍ତୁ",
                location_label: "ସ୍ଥାନ (ଜିଲ୍ଲା)",
                season_label: "ଋତୁ",
                select_season: "ଋତୁ ବାଛନ୍ତୁ",
                temp_label: "ତାପମାତ୍ରା (°C) (ଐଚ୍ଛିକ)",
                get_recommendation: "ସୁପାରିଶ ପ୍ରାପ୍ତ କରନ୍ତୁ",
                rec_crop_title: "ସୁପାରିଶ ଫସଲ",
                fert_sug_title: "ସାର ପରାମର୍ଶ",
                weather_header: "ରିୟଲ-ଟାଇମ ପାଣିପାଗ ସତର୍କତା",
                enter_location: "ସ୍ଥାନ ଦାଖଲ କରନ୍ତୁ",
                search_btn: "ଖୋଜନ୍ତୁ",
                status_alerts: "ସ୍ଥିତି ଓ ସତର୍କତା",
                rain_prediction: "ବର୍ଷା ପୂର୍ବାଭାସ:",
                market_header: "ଲାଇଭ ବଜାର ମୂଲ୍ୟ (ମଣ୍ଡି ଦର)",
                select_crop_label: "ଫସଲ ବାଛନ୍ତୁ",
                market_name_label: "ବଜାର / APMC ନାମ",
                get_prices_btn: "ମୂଲ୍ୟ ପ୍ରାପ୍ତ କରନ୍ତୁ",
                price_list_title: "ମୂଲ୍ୟ ତାଲିକା",
                th_crop: "ଫସଲ",
                th_market: "ବଜାର",
                th_price: "ମୂଲ୍ୟ (ପ୍ରତି କ୍ୱିଣ୍ଟଲ)",
                th_date: "ତାରିଖ"
            },
            ur: {
                home: "ہوم",
                crop_advisory: "فصل مشورہ",
                weather_alerts: "موسم انتباہات",
                market_prices: "بازار قیمتیں",
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> ترتیبات",
                login: "لاگ ان",
                logout: "لاگ آؤٹ",
                welcome: "کسان کیئر میں خوش آمدید",
                hero_text: "ٹیکنالوجی کے ساتھ کسانوں کو با اختیار بنانا۔ اپنی پیداوار بڑھانے کے لیے ریئل ٹائم فصل مشورہ، موسم انتباہات اور بازار قیمتیں حاصل کریں۔",
                get_started: "شروع کریں",
                feature_crop: "فصل مشورہ",
                desc_crop: "AI ڈیٹا استعمال کر کے اپنی مٹی اور موسم کے لیے بہترین فصل تلاش کریں۔",
                check_now: "ابھی جانچیں",
                feature_weather: "موسم انتباہات",
                desc_weather: "ریئل ٹائم موسم اپڈیٹس اور انتباہات کے ساتھ تیار رہیں۔",
                view_weather: "موسم دیکھیں",
                feature_market: "بازار قیمتیں",
                desc_market: "اپنی فصلوں کے لیے تازہ ترین منڈی قیمتیں حاصل کریں۔",
                check_prices: "قیمتیں دیکھیں",
                settings_header: "ترتیبات",
                dark_mode: "ڈارک موڈ",
                notifications: "اعلانات",
                privacy: "رازداری پالیسی",
                terms: "شرائط",
                admin_panel: "ایڈمن",
                welcome_back: "واپس خوش آمدید",
                feedback_nav: "رائے",
                feedback_title: " رائے بھیجیں",
                feedback_desc: "ہم آپ کی رائے کی قدر کرتے ہیں۔",
                send_feedback_btn: "بھیجیں",
                email_label: "ای میل",
                password_label: "پاس ورڈ",
                login_btn: "لاگ ان کریں",
                or_continue: "یا جاری رکھیں:",
                continue_google: "Google کے ساتھ جاری رکھیں",
                login_phone_link: "فون نمبر سے لاگ ان کریں",
                dont_have_account: "اکاؤنٹ نہیں ہے؟",
                sign_up_link: "سائن اپ",
                create_account: "اکاؤنٹ بنائیں",
                full_name: "پورا نام",
                confirm_password: "پاس ورڈ کی تصدیق کریں",
                sign_up_btn: "سائن اپ",
                already_account: "پہلے سے اکاؤنٹ ہے؟",
                login_link: "لاگ ان",
                crop_header: "فصل مشورہ نظام",
                soil_label: "مٹی کی قسم",
                select_soil: "مٹی کی قسم منتخب کریں",
                location_label: "مقام (ضلع)",
                season_label: "موسم",
                select_season: "موسم منتخب کریں",
                temp_label: "درجہ حرارت (°C) (اختیاری)",
                get_recommendation: "سفارش حاصل کریں",
                rec_crop_title: "تجویز کردہ فصل",
                fert_sug_title: "کھاد کی تجویز",
                weather_header: "ریئل ٹائم موسم انتباہات",
                enter_location: "مقام درج کریں",
                search_btn: "تلاش",
                status_alerts: "حالت اور انتباہات",
                rain_prediction: "بارش کی پیش گوئی:",
                market_header: "لائیو بازار قیمتیں (منڈی نرخ)",
                select_crop_label: "فصل منتخب کریں",
                market_name_label: "بازار / APMC نام",
                get_prices_btn: "قیمتیں حاصل کریں",
                price_list_title: "قیمت کی فہرست",
                th_crop: "فصل",
                th_market: "بازار",
                th_price: "قیمت (فی کوئنٹل)",
                th_date: "تاریخ"
            },
            te: {
                home: "హోమ్",
                crop_advisory: "పంట సలహా",
                weather_alerts: "వాతావరణ హెచ్చరికలు",
                market_prices: "మార్కెట్ ధరలు",
                settings: "<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>settings</span> సెట్టింగ్‌లు",
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
                feedback_title: " అభిప్రాయం పంపండి",
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

        const chatWelcomeMessages = {
            en: "Hello! I am your Kisan AI assistant. Ask me about crops, fertilizers, or weather! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            hi: "नमस्ते! मैं आपका किसान AI सहायक हूँ। मुझसे फसल, खाद या मौसम के बारे में पूछें! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            gu: "નમસ્તે! હું તમારો કિસાન AI સહાયક છું. ખેડૂત, ખાતર અથવા હવામાન વિશે પૂછો! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            mr: "नमस्कार! मी तुमचा किसान AI सहाय्यक आहे. पीक, खत किंवा हवामानाबद्दल विचारा! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਕਿਸਾਨ AI ਸਹਾਇਕ ਹਾਂ। ਫ਼ਸਲ, ਖਾਦ ਜਾਂ ਮੌਸਮ ਬਾਰੇ ਪੁੱਛੋ! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            ta: "வணக்கம்! நான் உங்கள் கிசான் AI உதவியாளர். பயிர், உரம் அல்லது வானிலை பற்றி கேளுங்கள்! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            te: "నమస్కారం! నేను మీ కిసాన్ AI సహాయకుడిని. పంట, ఎరువు లేదా వాతావరణం గురించి అడగండి! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            bn: "নমস্কার! আমি আপনার কিসান AI সহকারী। ফসল, সার বা আবহাওয়া সম্পর্কে জিজ্ঞেস করুন! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕಿಸಾನ್ AI ಸಹಾಯಕ. ಬೆಳೆ, ಗೊಬ್ಬರ ಅಥವಾ ಹವಾಮಾನ ಬಗ್ಗೆ ಕೇಳಿ! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ കിസാൻ AI സഹായകൻ. വിള, വളം അല്ലെങ്കിൽ കാലാവസ്ഥ ഒക്കെ ചോദിക്കൂ! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            or: "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ କିସାନ AI ସହାୟକ। ଫସଲ, ସାର ବା ପାଣିପାଗ ବିଷୟରେ ପଚାରନ୍ତୁ! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>",
            ur: "آداب! میں آپ کا کسان AI مددگار ہوں۔ فصل، کھاد یا موسم کے بارے میں پوچھیں! <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>"
        };

        const chatPlaceholders = {
            en: "Type or  speak your farming question...",
            hi: "अपना खेती सवाल टाइप करें या  बोलें...",
            gu: "ખેડૂત સવાલ ટાઈપ કરો અથવા  બોલો...",
            mr: "शेती प्रश्न टाइप करा किंवा  बोला...",
            pa: "ਖੇਤੀ ਸਵਾਲ ਟਾਈਪ ਕਰੋ ਜਾਂ  ਬੋਲੋ...",
            ta: "உங்கள் கேள்வியை தட்டச்சு செய்யுங்கள் அல்லது  பேசுங்கள்...",
            te: "మీ ప్రశ్న టైప్ చేయండి లేదా  మాట్లాడండి...",
            bn: "আপনার প্রশ্ন টাইপ করুন বা  বলুন...",
            kn: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ  ಮಾತಾಡಿ...",
            ml: "നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യൂ അല്ലെങ്കിൽ  സംസാരിക്കൂ...",
            or: "ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଟାଇପ କରନ୍ତୁ ବା  କୁହନ୍ତୁ...",
            ur: "اپنا سوال ٹائپ کریں یا  بولیں..."
        };

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

            // Sync chat language selector with app language
            const chatLangSelect = document.getElementById('chat-lang-select');
            if (chatLangSelect && chatLangSelect.querySelector(`option[value="${lang}"]`)) {
                chatLangSelect.value = lang;
            }

            // Update chat welcome message in selected language
            const chatWelcomeEl = document.querySelector('#chat-messages .message.bot p');
            if (chatWelcomeEl && chatWelcomeMessages[lang]) {
                chatWelcomeEl.textContent = chatWelcomeMessages[lang];
            }

            // Update chat input placeholder
            const chatInputEl = document.getElementById('chat-input');
            if (chatInputEl && chatPlaceholders[lang]) {
                chatInputEl.placeholder = chatPlaceholders[lang];
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
    // NOTE: Crop form logic is now handled by an inline <script> in crop.html.
    // It calls POST /predict with 7 soil/climate features and renders the
    // ML-based recommendation with confidence score. No code needed here.

    /* ===========================
       Weather Logic — Phase 2
       All calls go through the KisanCare backend (/api/weather).
       No API key is present in this file.
       =========================== */

    const WEATHER_BACKEND = 'http://localhost:5001';

    // ── OWM icon code → emoji ──────────────────────────────────────────────
    const owmIconEmoji = (icon) => {
        if (!icon) return '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>thermostat</span>';
        const code = icon.slice(0, 2);
        const map = {
            '01': '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>wb_sunny</span>', '02': '️', '03': '', '04': '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>cloud</span>',
            '09': '️', '10': '️', '11': '', '13': '', '50': '️'
        };
        return map[code] || '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>thermostat</span>';
    };

    // ── Advisory card class ────────────────────────────────────────────────
    const advClass = (status) => {
        const map = {
            good:             'good',
            normal:           'good',
            recommended:      'caution',
            defer_rain_coming:'info',
            not_needed:       'info',
            caution:          'caution',
            not_advised:      'bad',
        };
        return map[status] || 'info';
    };

    const advLabel = (status) => {
        const map = {
            good:             '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>check_circle</span> Good Conditions',
            normal:           '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>check_circle</span> Normal',
            recommended:      '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>warning</span> Recommended',
            defer_rain_coming:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> Defer — Rain Coming',
            not_needed:       '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> Not Needed',
            caution:          '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>warning</span> Use Caution',
            not_advised:      ' Not Advised',
        };
        return map[status] || status;
    };

    // ── Alert badge config ─────────────────────────────────────────────────
    const alertConfig = {
        frost_warning:             { emoji:'', label:'Frost Warning',   cls:'info' },
        heatwave:                  { emoji:'', label:'Heatwave Alert',  cls:'danger' },
        heavy_rain:                { emoji:'️', label:'Heavy Rain',      cls:'warn' },
        high_humidity_fungal_risk: { emoji:'', label:'Fungal Risk',     cls:'warn' },
        storm_warning:             { emoji:'', label:'Storm Warning',   cls:'danger' },
    };

    // ── Render helpers ─────────────────────────────────────────────────────
    const renderCurrent = (current, location, country) => {
        document.getElementById('displayLocation').textContent  = `${location}, ${country}`;
        document.getElementById('displayTemp').textContent      = `${Math.round(current.temp)}°C`;
        document.getElementById('displayCondition').textContent = current.description || current.conditions;
        document.getElementById('displaySunrise').textContent   = current.sunrise || '—';
        document.getElementById('displaySunset').textContent    = current.sunset  || '—';
        document.getElementById('displayFeels').textContent     = `${current.feels_like}°C`;
        document.getElementById('displayHumidity').textContent  = `${current.humidity}%`;
        document.getElementById('displayWind').textContent      = `${(current.wind_speed * 3.6).toFixed(0)} km/h`;
        document.getElementById('displayRain').textContent      = `${current.rain_1h} mm`;
        document.getElementById('displayHiLo').textContent      = `${current.temp_max}° / ${current.temp_min}°`;
    };

    const renderAlerts = (alerts) => {
        const row = document.getElementById('alertsRow');
        if (!alerts || alerts.length === 0) {
            row.innerHTML = '<span class="no-alerts"><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>check_circle</span> No severe weather alerts today.</span>';
            return;
        }
        row.innerHTML = alerts.map(a => {
            const cfg = alertConfig[a] || { emoji:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>warning</span>', label: a.replace(/_/g,' '), cls:'warn' };
            return `<span class="alert-badge ${cfg.cls}">${cfg.emoji} ${cfg.label}</span>`;
        }).join('');
    };

    const renderAdvisory = (advisory) => {
        const grid = document.getElementById('advisoryGrid');
        const cards = [
            { key:'irrigation', icon:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span>', title:'Irrigation' },
            { key:'sowing',     icon:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>yard</span>', title:'Sowing'     },
            { key:'spraying',   icon:'<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span>', title:'Spraying'   },
        ];
        grid.innerHTML = cards.map(({ key, icon, title }) => {
            const status  = advisory[key] || 'info';
            const cls     = advClass(status);
            const label   = advLabel(status);
            const summary = advisory.summaries?.[key] || '';
            return `
              <div class="advisory-card ${cls}">
                <div class="adv-title">${icon} ${title}</div>
                <div class="adv-status">${label}</div>
                <div class="adv-text">${summary}</div>
              </div>`;
        }).join('');
    };

    const renderHourly = (hourly) => {
        const row = document.getElementById('hourlyRow');
        row.innerHTML = hourly.map(h => `
          <div class="hour-chip">
            <div class="h-time">${h.time}</div>
            <div class="h-icon">${owmIconEmoji(h.icon)}</div>
            <div class="h-temp">${Math.round(h.temp)}°</div>
            <div class="h-rain">${h.rain_mm > 0 ? h.rain_mm + ' mm' : (h.rain_prob > 0 ? Math.round(h.rain_prob * 100) + '% <span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span>' : '--')}</div>
          </div>`).join('');
    };

    const renderDaily = (daily) => {
        const list = document.getElementById('dailyList');
        list.innerHTML = daily.map(d => `
          <div class="day-row">
            <div class="day-name">${d.date}</div>
            <div class="day-icon">${owmIconEmoji(d.icon)}</div>
            <div class="day-desc">${d.description || d.conditions}</div>
            <div class="day-rain">${d.rain_mm > 0 ? '️ ' + d.rain_mm + ' mm' : ''} ${d.rain_prob > 0.1 ? Math.round(d.rain_prob * 100) + '%' : ''}</div>
            <div class="day-temps">${Math.round(d.temp_max)}° / ${Math.round(d.temp_min)}°</div>
          </div>`).join('');
    };

    // ── Main fetch function ────────────────────────────────────────────────
    const fetchWeather = async () => {
        const location = (document.getElementById('weatherLocation')?.value || '').trim();
        if (!location) { alert('Please enter a city or district name.'); return; }

        const btn        = document.getElementById('getWeatherBtn');
        const display    = document.getElementById('weatherDisplay');
        const errBox     = document.getElementById('weatherError');
        const mockBanner = document.getElementById('mockBanner');

        btn.disabled = true;
        btn.textContent = 'Loading...';
        errBox.style.display    = 'none';
        mockBanner.classList.remove('visible');

        try {
            const res  = await fetch(`${WEATHER_BACKEND}/api/weather?city=${encodeURIComponent(location)}`);
            const data = await res.json();

            if (!res.ok || data.status === 'error') {
                throw new Error(data.message || `Server error ${res.status}`);
            }

            // Show mock banner if demo data
            if (data.status === 'mock') {
                document.getElementById('mockBannerText').textContent =
                    data.data_note || 'Demo weather data — connect a live API key for real forecasts.';
                mockBanner.classList.add('visible');
            }

            renderCurrent(data.current, data.location, data.country);
            renderAlerts(data.advisory?.alerts);
            renderAdvisory(data.advisory);
            renderHourly(data.hourly);
            renderDaily(data.daily);

            display.style.display = 'block';
            display.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (err) {
            console.error('Weather fetch error:', err);
            errBox.innerHTML = `<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>cancel</span> ${err.message || 'Could not connect to the weather server. Is the backend running?'}`;
            errBox.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons">search</span> Search';
        }
    };

    // ── Event listeners ────────────────────────────────────────────────────
    const getWeatherBtn      = document.getElementById('getWeatherBtn');
    const weatherLocationInp = document.getElementById('weatherLocation');
    const subAlertsBtn       = document.getElementById('subAlertsBtn');

    if (getWeatherBtn) {
        getWeatherBtn.addEventListener('click', fetchWeather);
    }
    if (weatherLocationInp) {
        weatherLocationInp.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') fetchWeather();
        });
    }
    if (subAlertsBtn) {
        subAlertsBtn.addEventListener('click', () => {
            // Fake push notification opt-in for demo purposes
            if (Notification.permission === 'granted') {
                alert('You are already subscribed to weather alerts for this device.');
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        alert('Success! You will now receive push notifications for severe weather alerts in your area.');
                        subAlertsBtn.innerHTML = '<span class="material-icons">notifications_active</span> Subscribed';
                        subAlertsBtn.style.background = '#dcfce7';
                        subAlertsBtn.style.color = '#166534';
                        subAlertsBtn.style.borderColor = '#bbf7d0';
                    }
                });
            } else {
                alert('Notifications are blocked. Please enable them in your browser settings.');
            }
        });
    }

    /* ===========================
       Market Prices Logic
       =========================== */
    let trendChartInstance = null;
    const getPriceBtn = document.getElementById('getPriceBtn');
    
    if (getPriceBtn) {
        getPriceBtn.addEventListener('click', async () => {
            const crop = document.getElementById('marketCrop').value;
            const marketName = document.getElementById('marketName').value || 'Gujarat';
            
            const priceResult = document.getElementById('priceResult');
            const tableBody = document.getElementById('priceTableBody');
            const trendSection = document.getElementById('trendSection');
            const historyBanner = document.getElementById('historyBanner');
            
            getPriceBtn.disabled = true;
            getPriceBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Loading...';
            
            priceResult.style.display = 'block';
            trendSection.style.display = 'none';
            historyBanner.style.display = 'none';
            tableBody.innerHTML = `
                <tr>
                    <td><div class="skeleton-box" style="width: 80px; height: 20px;"></div></td>
                    <td><div class="skeleton-box" style="width: 120px; height: 20px;"></div></td>
                    <td><div class="skeleton-box" style="width: 90px; height: 20px;"></div></td>
                    <td><div class="skeleton-box" style="width: 100px; height: 20px;"></div></td>
                </tr>
                <tr>
                    <td><div class="skeleton-box" style="width: 70px; height: 20px;"></div></td>
                    <td><div class="skeleton-box" style="width: 140px; height: 20px;"></div></td>
                    <td><div class="skeleton-box" style="width: 80px; height: 20px;"></div></td>
                    <td><div class="skeleton-box" style="width: 90px; height: 20px;"></div></td>
                </tr>
                <tr>
                    <td><div class="skeleton-box" style="width: 85px; height: 20px;"></div></td>
                    <td><div class="skeleton-box" style="width: 110px; height: 20px;"></div></td>
                    <td><div class="skeleton-box" style="width: 85px; height: 20px;"></div></td>
                    <td><div class="skeleton-box" style="width: 95px; height: 20px;"></div></td>
                </tr>
            `;

            try {
                // Fetch today's snapshot
                const res = await fetch(`http://localhost:5001/api/apmc?commodity=${encodeURIComponent(crop)}&state=${encodeURIComponent(marketName)}`);
                const data = await res.json();
                
                if (data.error) throw new Error(data.error);
                
                tableBody.innerHTML = '';
                
                if (data.records && data.records.length > 0) {
                    data.records.forEach(r => {
                        const mName = r.market || 'Unknown Market';
                        const mPrice = r.modal_price ? `₹${r.modal_price}` : 'N/A';
                        const today = new Date().toLocaleDateString();
                        
                        tableBody.innerHTML += `
                            <tr>
                                <td>${crop.charAt(0).toUpperCase() + crop.slice(1)}</td>
                                <td>${mName}</td>
                                <td>${mPrice}</td>
                                <td>${today}</td>
                            </tr>
                        `;
                    });
                } else {
                    tableBody.innerHTML = '<tr><td colspan="4">No data found for this crop/market today.</td></tr>';
                }
                
                // Fetch trend analysis
                const trendRes = await fetch(`http://localhost:5001/api/apmc/trend?commodity=${encodeURIComponent(crop)}&district=${encodeURIComponent(marketName)}`);
                const trendData = await trendRes.json();
                
                if (trendData.status === 'success') {
                    trendSection.style.display = 'grid';
                    
                    if (trendData.days_available < 7) {
                        document.getElementById('historyBannerText').textContent = `Building price history... Only ${trendData.days_available} days collected so far. Check back daily.`;
                        historyBanner.style.display = 'flex';
                    }
                    
                    document.getElementById('statHighest').textContent = trendData.highest ? `₹${trendData.highest}` : 'N/A';
                    document.getElementById('statLowest').textContent = trendData.lowest ? `₹${trendData.lowest}` : 'N/A';
                    document.getElementById('statAverage').textContent = trendData.average ? `₹${trendData.average}` : 'N/A';
                    document.getElementById('trendSuggestion').textContent = trendData.suggestion;
                    
                    // Render Chart.js
                    const ctx = document.getElementById('trendChart').getContext('2d');
                    
                    if (trendChartInstance) {
                        trendChartInstance.destroy();
                    }
                    
                    const labels = trendData.history.map(h => h.date.slice(5)); // MM-DD
                    const prices = trendData.history.map(h => h.modal_price);
                    
                    trendChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: `Avg Modal Price (₹)`,
                                data: prices,
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderWidth: 2,
                                pointBackgroundColor: '#059669',
                                pointRadius: 4,
                                fill: true,
                                tension: 0.3
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: {
                                    beginAtZero: false,
                                    grid: { color: '#f1f5f9' }
                                },
                                x: {
                                    grid: { display: false }
                                }
                            }
                        }
                    });
                }
                
            } catch (err) {
                console.error("Market fetch error:", err);
                tableBody.innerHTML = `<tr><td colspan="4" style="color:red;">Error loading prices: ${err.message}</td></tr>`;
            } finally {
                getPriceBtn.disabled = false;
                getPriceBtn.innerHTML = '<i class="material-icons">search</i><span data-lang="get_prices_btn">Get Prices</span>';
            }
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
                            <h2 data-lang="feedback_title"> Send Us Feedback</h2>
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
                            alert("<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>check_circle</span> " + result.message);
                            document.getElementById('feedbackModal').remove();
                        } else {
                            alert("<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>cancel</span> Error: " + result.error);
                        }
                    } catch (err) {
                        console.error(err);
                        alert("<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>cancel</span> Failed to connect to server.");
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
