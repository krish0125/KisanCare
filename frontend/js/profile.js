document.addEventListener('DOMContentLoaded', async () => {
    // Ensure user is logged in
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const API_URL = 'http://localhost:5001/api/profile';
    const cropsList = ['Wheat', 'Rice', 'Cotton', 'Maize', 'Sugarcane', 'Soybean', 'Groundnut', 'Mustard', 'Tomato', 'Potato'];
    let selectedCrops = [];

    // Initialize chips
    const chipContainer = document.getElementById('cropChips');
    cropsList.forEach(crop => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = crop;
        chip.dataset.val = crop.toLowerCase();
        chip.onclick = () => {
            if (selectedCrops.includes(crop.toLowerCase())) {
                selectedCrops = selectedCrops.filter(c => c !== crop.toLowerCase());
                chip.classList.remove('selected');
            } else {
                selectedCrops.push(crop.toLowerCase());
                chip.classList.add('selected');
            }
        };
        chipContainer.appendChild(chip);
    });

    // Fetch and populate existing profile
    try {
        const res = await authFetch(API_URL);
        const data = await res.json();
        
        if (data.exists && data.profile) {
            const p = data.profile;
            document.getElementById('profName').value = p.name || '';
            document.getElementById('profPhone').value = p.phone || '';
            document.getElementById('profVillage').value = p.village || '';
            document.getElementById('profDistrict').value = p.district || '';
            document.getElementById('profState').value = p.state || '';
            
            if (p.farm) {
                document.getElementById('profLandArea').value = p.farm.land_area_acres || '';
                document.getElementById('profSoilType').value = p.farm.soil_type || '';
                document.getElementById('profIrrigation').value = p.farm.irrigation_type || '';
                
                selectedCrops = p.farm.preferred_crops || [];
                document.querySelectorAll('.chip').forEach(chip => {
                    if (selectedCrops.includes(chip.dataset.val)) {
                        chip.classList.add('selected');
                    }
                });
            }
            
            if (p.photo_path) {
                const photoUrl = 'http://localhost:5001' + p.photo_path; // p.photo_path comes back as /api/profile/photo/...
                document.getElementById('photoPreview').innerHTML = `<img src="${photoUrl}" alt="Profile">`;
            }
            
            if (p.notification_preferences) {
                document.getElementById('prefEmail').checked = p.notification_preferences.email_enabled;
                document.getElementById('prefWeather').checked = p.notification_preferences.weather_alerts;
                document.getElementById('prefPest').checked = p.notification_preferences.pest_alerts;
                document.getElementById('prefMarket').checked = p.notification_preferences.market_alerts;
                document.getElementById('prefScheme').checked = p.notification_preferences.scheme_alerts;
            }
        }
    } catch (err) {
        console.error("Failed to fetch profile", err);
    }

    // Handle Form Submit
    document.getElementById('profileForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveProfileBtn');
        btn.textContent = 'Saving...';
        btn.disabled = true;

        const payload = {
            name: document.getElementById('profName').value,
            phone: document.getElementById('profPhone').value,
            village: document.getElementById('profVillage').value,
            district: document.getElementById('profDistrict').value,
            state: document.getElementById('profState').value,
            land_area_acres: document.getElementById('profLandArea').value,
            soil_type: document.getElementById('profSoilType').value,
            irrigation_type: document.getElementById('profIrrigation').value,
            preferred_crops: selectedCrops,
            notification_preferences: {
                email_enabled: document.getElementById('prefEmail').checked,
                weather_alerts: document.getElementById('prefWeather').checked,
                pest_alerts: document.getElementById('prefPest').checked,
                market_alerts: document.getElementById('prefMarket').checked,
                scheme_alerts: document.getElementById('prefScheme').checked
            }
        };

        try {
            const res = await authFetch(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('Profile saved successfully!');
            } else {
                alert('Error: ' + data.message);
            }
        } catch (err) {
            alert('Error saving profile');
        } finally {
            btn.textContent = 'Save Profile';
            btn.disabled = false;
        }
    };

    // Handle Photo Upload
    document.getElementById('photoInput').onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const res = await authFetch('http://localhost:5001/api/profile/photo', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                const photoUrl = 'http://localhost:5001' + data.photo_url;
                document.getElementById('photoPreview').innerHTML = `<img src="${photoUrl}" alt="Profile">`;
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Failed to upload photo');
        }
    };
});
