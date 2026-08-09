/**
 * frontend/js/profile.js
 * 
 * Interactive Farmer Profile management with API & local fallback persistence.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:5001/api/profile';
    const cropsList = ['Wheat', 'Rice', 'Cotton', 'Maize', 'Sugarcane', 'Soybean', 'Groundnut', 'Mustard', 'Tomato', 'Potato', 'Gram', 'Onion'];
    let selectedCrops = ['wheat', 'cotton', 'soybean'];

    // --- Toast Notification Helper ---
    const showToast = (message, isError = false) => {
        let toast = document.getElementById('profileToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'profileToast';
            toast.style.cssText = `
                position: fixed; bottom: 30px; right: 30px; z-index: 99999;
                padding: 14px 24px; border-radius: 8px; font-size: 0.95rem; font-weight: 600;
                box-shadow: 0 8px 24px rgba(0,0,0,0.18); transition: all 0.3s ease;
                display: flex; align-items: center; gap: 10px; color: #fff;
            `;
            document.body.appendChild(toast);
        }
        toast.style.background = isError ? '#e74c3c' : '#2ecc71';
        toast.innerHTML = `<span class="material-icons" style="font-size:1.2rem;">${isError ? 'error' : 'check_circle'}</span> ${message}`;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
        }, 3500);
    };

    // --- Initialize Crop Chips ---
    const chipContainer = document.getElementById('cropChips');
    if (chipContainer) {
        chipContainer.innerHTML = '';
        cropsList.forEach(crop => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.textContent = crop;
            chip.dataset.val = crop.toLowerCase();
            if (selectedCrops.includes(crop.toLowerCase())) {
                chip.classList.add('selected');
            }
            chip.onclick = () => {
                const val = crop.toLowerCase();
                if (selectedCrops.includes(val)) {
                    selectedCrops = selectedCrops.filter(c => c !== val);
                    chip.classList.remove('selected');
                } else {
                    selectedCrops.push(val);
                    chip.classList.add('selected');
                }
            };
            chipContainer.appendChild(chip);
        });
    }

    const updateChipsUI = () => {
        document.querySelectorAll('.chip').forEach(chip => {
            if (selectedCrops.includes(chip.dataset.val)) {
                chip.classList.add('selected');
            } else {
                chip.classList.remove('selected');
            }
        });
    };

    // --- Populate Form helper ---
    const populateForm = (p) => {
        if (!p) return;
        if (p.name) document.getElementById('profName').value = p.name;
        if (p.phone) document.getElementById('profPhone').value = p.phone;
        if (p.village) document.getElementById('profVillage').value = p.village;
        if (p.district) document.getElementById('profDistrict').value = p.district;
        if (p.state) document.getElementById('profState').value = p.state;

        if (p.farm) {
            if (p.farm.land_area_acres !== undefined) document.getElementById('profLandArea').value = p.farm.land_area_acres;
            if (p.farm.soil_type) document.getElementById('profSoilType').value = p.farm.soil_type;
            if (p.farm.irrigation_type) document.getElementById('profIrrigation').value = p.farm.irrigation_type;
            if (p.farm.preferred_crops && p.farm.preferred_crops.length) {
                selectedCrops = p.farm.preferred_crops.map(c => c.toLowerCase());
                updateChipsUI();
            }
        }

        if (p.photo_path) {
            const photoUrl = p.photo_path.startsWith('data:') || p.photo_path.startsWith('http') 
                ? p.photo_path 
                : 'http://localhost:5001' + p.photo_path;
            document.getElementById('photoPreview').innerHTML = `<img src="${photoUrl}" alt="Profile Photo" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }

        if (p.notification_preferences) {
            const notif = p.notification_preferences;
            if (document.getElementById('prefEmail')) document.getElementById('prefEmail').checked = notif.email_enabled !== false;
            if (document.getElementById('prefWeather')) document.getElementById('prefWeather').checked = notif.weather_alerts !== false;
            if (document.getElementById('prefPest')) document.getElementById('prefPest').checked = notif.pest_alerts !== false;
            if (document.getElementById('prefMarket')) document.getElementById('prefMarket').checked = notif.market_alerts !== false;
            if (document.getElementById('prefScheme')) document.getElementById('prefScheme').checked = notif.scheme_alerts !== false;
        }
    };

    // Load default fallback profile first
    const defaultProfile = {
        name: 'Ramesh Patel',
        phone: '9876543210',
        village: 'Kisan Nagar',
        district: 'Anand',
        state: 'Gujarat',
        farm: {
            land_area_acres: 5.0,
            soil_type: 'loamy',
            irrigation_type: 'drip',
            preferred_crops: ['wheat', 'cotton', 'soybean']
        },
        notification_preferences: {
            email_enabled: true,
            weather_alerts: true,
            pest_alerts: true,
            market_alerts: true,
            scheme_alerts: true
        }
    };

    const savedLocalProfile = JSON.parse(localStorage.getItem('kisanProfile') || 'null') || defaultProfile;
    populateForm(savedLocalProfile);

    // Check stored photo
    const storedPhoto = localStorage.getItem('kisanPhoto');
    if (storedPhoto) {
        document.getElementById('photoPreview').innerHTML = `<img src="${storedPhoto}" alt="Profile Photo" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    }

    // --- Fetch from Backend API ---
    try {
        const res = await authFetch(API_URL);
        if (res.ok) {
            const data = await res.json();
            if (data.exists && data.profile) {
                populateForm(data.profile);
                localStorage.setItem('kisanProfile', JSON.stringify(data.profile));
            }
        }
    } catch (err) {
        console.warn("Using offline / cached profile data.");
    }

    // --- Handle Form Submit ---
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('saveProfileBtn');
            btn.textContent = 'Saving...';
            btn.disabled = true;

            const payload = {
                name: document.getElementById('profName').value.trim(),
                phone: document.getElementById('profPhone').value.trim(),
                village: document.getElementById('profVillage').value.trim(),
                district: document.getElementById('profDistrict').value.trim(),
                state: document.getElementById('profState').value.trim(),
                land_area_acres: parseFloat(document.getElementById('profLandArea').value) || 0.0,
                soil_type: document.getElementById('profSoilType').value,
                irrigation_type: document.getElementById('profIrrigation').value,
                preferred_crops: selectedCrops,
                notification_preferences: {
                    email_enabled: document.getElementById('prefEmail') ? document.getElementById('prefEmail').checked : true,
                    weather_alerts: document.getElementById('prefWeather') ? document.getElementById('prefWeather').checked : true,
                    pest_alerts: document.getElementById('prefPest') ? document.getElementById('prefPest').checked : true,
                    market_alerts: document.getElementById('prefMarket') ? document.getElementById('prefMarket').checked : true,
                    scheme_alerts: document.getElementById('prefScheme') ? document.getElementById('prefScheme').checked : true
                }
            };

            // Save to localStorage
            const localDoc = {
                ...payload,
                farm: {
                    land_area_acres: payload.land_area_acres,
                    soil_type: payload.soil_type,
                    irrigation_type: payload.irrigation_type,
                    preferred_crops: selectedCrops
                }
            };
            localStorage.setItem('kisanProfile', JSON.stringify(localDoc));

            // Sync user name in user session
            const user = JSON.parse(localStorage.getItem('kisanUser') || '{}');
            user.name = payload.name;
            localStorage.setItem('kisanUser', JSON.stringify(user));

            try {
                const res = await authFetch(API_URL, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast('Farmer Profile updated successfully! ✨');
                } else {
                    showToast('Profile saved locally! ✨');
                }
            } catch (err) {
                showToast('Profile saved locally! ✨');
            } finally {
                btn.textContent = 'Save Profile';
                btn.disabled = false;
            }
        };
    }

    // --- Handle Photo Upload & Preview ---
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Instant Client-side Preview & Local Storage
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                document.getElementById('photoPreview').innerHTML = `<img src="${base64}" alt="Profile Photo" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                localStorage.setItem('kisanPhoto', base64);
                showToast('Photo uploaded successfully! 📸');
            };
            reader.readAsDataURL(file);

            // Upload to API
            const formData = new FormData();
            formData.append('photo', file);

            try {
                await authFetch('http://localhost:5001/api/profile/photo', {
                    method: 'POST',
                    body: formData
                });
            } catch (err) {
                console.warn('Backend photo upload skipped, preview saved in local storage.');
            }
        };
    }
});
