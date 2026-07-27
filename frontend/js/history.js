document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const API_URL = 'http://localhost:5001/api/history';
    let currentType = 'all';
    let offset = 0;
    const limit = 20;
    
    const timeline = document.getElementById('timeline');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    const typeIcons = {
        'crop_prediction': '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span> Crop Recommendation',
        'disease_detection': '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> Disease Detection',
        'irrigation_advice': '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>water_drop</span> Irrigation Advice',
        'pest_risk': '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>bug_report</span> Pest Risk',
        'fertilizer_calc': '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>calculate</span> Fertilizer Calc'
    };

    const fetchHistory = async (append = false) => {
        try {
            let url = `${API_URL}?limit=${limit}&offset=${offset}`;
            if (currentType !== 'all') url += `&type=${currentType}`;
            
            const res = await authFetch(url);
            const data = await res.json();
            
            if (data.status === 'success') {
                renderHistory(data.data, append);
                if (data.data.length === limit) {
                    loadMoreBtn.style.display = 'inline-block';
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            }
        } catch (err) {
            console.error("Failed to load history", err);
            timeline.innerHTML = '<p style="text-align:center; color:red; padding:20px;">Failed to load history. Please try refreshing or log in again.</p>';
        }
    };

    const renderHistory = (records, append) => {
        if (!append) timeline.innerHTML = '';
        
        if (records.length === 0 && !append) {
            timeline.innerHTML = '<p style="text-align:center; color:#888;">No history found for this category.</p>';
            return;
        }

        records.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'history-card';
            
            // Format content based on type
            let bodyContent = '';
            
            if (rec.type === 'crop_prediction') {
                bodyContent = `
                    <p><strong>Predicted:</strong> <span class="badge">${rec.result_summary.predicted_crop}</span> (${rec.result_summary.confidence}%)</p>
                    <p style="font-size:0.85rem; color:#666;">Inputs: N:${rec.input_summary.N} P:${rec.input_summary.P} K:${rec.input_summary.K} | Temp:${rec.input_summary.temperature}°C | Rain:${rec.input_summary.rainfall}mm</p>
                `;
            } else if (rec.type === 'disease_detection') {
                bodyContent = `
                    <p><strong>Detected:</strong> <span class="badge" style="background:#ffebee; color:#c62828;">${rec.result_summary.disease}</span> (${(rec.result_summary.confidence * 100).toFixed(1)}%)</p>
                    <p style="font-size:0.85rem;"><strong>Treatment:</strong> ${rec.result_summary.organic_treatment}</p>
                `;
            } else if (rec.type === 'irrigation_advice') {
                bodyContent = `
                    <p><strong>Advice:</strong> <span class="badge" style="background:#e3f2fd; color:#1565c0;">${rec.result_summary.recommendation.replace(/_/g, ' ')}</span></p>
                    <p><strong>Quantity:</strong> ${rec.result_summary.water_quantity_mm} mm</p>
                    <p style="font-size:0.85rem; color:#666;">Soil: ${rec.input_summary.soil_moisture} | Stage: ${rec.input_summary.growth_stage}</p>
                `;
            } else if (rec.type === 'pest_risk') {
                bodyContent = `
                    <p><strong>High Risk Pests:</strong> <span class="badge" style="background:#fff3e0; color:#ef6c00;">${rec.result_summary.high_risk_count}</span></p>
                    <p><strong>Total Pests Checked:</strong> ${rec.result_summary.pest_count}</p>
                `;
            } else if (rec.type === 'fertilizer_calc') {
                bodyContent = `
                    <p><strong>Req:</strong> N: ${rec.result_summary.N_kg}kg | P: ${rec.result_summary.P_kg}kg | K: ${rec.result_summary.K_kg}kg</p>
                    <p><strong>Est. Cost:</strong> ₹${rec.result_summary.estimated_cost_inr}</p>
                    <p style="font-size:0.85rem; color:#666;">Area: ${rec.input_summary.land_area_acres} acres | Stage: ${rec.input_summary.growth_stage}</p>
                `;
            }
            
            const dateStr = new Date(rec.timestamp).toLocaleString();
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${typeIcons[rec.type] || rec.type} ${rec.crop ? ` - ${rec.crop}` : ''}</div>
                    <div class="card-date">${dateStr}</div>
                </div>
                <div class="card-body">
                    ${bodyContent}
                </div>
            `;
            timeline.appendChild(card);
        });
    };

    // Filters
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentType = chip.dataset.type;
            offset = 0;
            fetchHistory(false);
        });
    });

    // Load More
    loadMoreBtn.addEventListener('click', () => {
        offset += limit;
        fetchHistory(true);
    });

    // Initial load
    fetchHistory(false);
});
