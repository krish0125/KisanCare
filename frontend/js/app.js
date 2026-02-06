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
            const userData = JSON.parse(user);
            loginLink.innerText = `👤 ${userData.name.split(' ')[0]}`;
            loginLink.href = '#';

            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm("Do you want to logout?")) {
                    localStorage.removeItem('kisanUser');
                    window.location.href = 'index.html';
                }
            });
        }
    }

    // Run on load
    checkUserLogin();

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
    const fetchWeather = () => {
        const location = weatherLocation.value;
        if (!location) {
            alert("Please enter a location");
            return;
        }

        // Mock Weather Data
        const weatherDisplay = document.getElementById('weatherDisplay');
        const displayLocation = document.getElementById('displayLocation');
        const displayTemp = document.getElementById('displayTemp');
        const displayCondition = document.getElementById('displayCondition');
        const alertBox = document.getElementById('alertBox');

        weatherDisplay.style.display = 'flex';
        displayLocation.innerText = location;

        // Randomize slightly for demo
        const temp = Math.floor(Math.random() * (35 - 20) + 20);
        displayTemp.innerText = `${temp}°C`;

        if (temp > 30) {
            displayCondition.innerText = "Sunny";
            alertBox.className = "alert-box alert-warning";
            alertBox.innerText = "⚠️ High Heat Alert: Ensure irrigation.";
        } else {
            displayCondition.innerText = "Cloudy";
            alertBox.className = "alert-box alert-safe";
            alertBox.innerText = "✅ Good weather for spraying.";
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

});
