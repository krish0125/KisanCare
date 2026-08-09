/**
 * frontend/js/history.js
 * 
 * Timeline and Activity History Viewer
 * Displays crop predictions, disease detections, irrigation advisories, pest risks, and fertilizer calculations.
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5001/api/history';
    let currentType = 'all';
    let offset = 0;
    const limit = 20;
    
    const timeline = document.getElementById('timeline');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    const typeIcons = {
        'crop_prediction': '<span class="material-icons" style="vertical-align:middle; font-size:1.2rem; color:#2ecc71;">grass</span> Crop Recommendation',
        'disease_detection': '<span class="material-icons" style="vertical-align:middle; font-size:1.2rem; color:#e74c3c;">pest_control</span> Disease Detection',
        'irrigation_advice': '<span class="material-icons" style="vertical-align:middle; font-size:1.2rem; color:#3498db;">water_drop</span> Irrigation Advice',
        'pest_risk': '<span class="material-icons" style="vertical-align:middle; font-size:1.2rem; color:#e67e22;">bug_report</span> Pest Risk Advisory',
        'fertilizer_calc': '<span class="material-icons" style="vertical-align:middle; font-size:1.2rem; color:#9b59b6;">calculate</span> Fertilizer Calculation'
    };

    const fallbackRecords = [
        {
            type: 'crop_prediction',
            crop: 'Wheat',
            input_summary: { N: 90, P: 42, K: 43, temperature: 22.5, humidity: 68.0, ph: 6.5, rainfall: 202.4 },
            result_summary: { recommended_crop: 'Wheat', confidence: 0.94 },
            timestamp: '2026-02-05 10:15:00'
        },
        {
            type: 'fertilizer_calc',
            crop: 'Wheat',
            input_summary: { crop: 'Wheat', land_area_acres: 3.5, growth_stage: 'tillering' },
            result_summary: { urea_kg: 190.5, dap_kg: 95.2, mop_kg: 42.0, estimated_cost_inr: 3850 },
            timestamp: '2026-02-04 14:30:00'
        },
        {
            type: 'disease_detection',
            crop: 'Tomato',
            input_summary: { filename: 'tomato_leaf_sample.jpg' },
            result_summary: { disease: 'Tomato Early Blight (Alternaria solani)', confidence: 0.91, treatment: 'Spray Mancozeb 75% WP @ 2.5g/L water' },
            timestamp: '2026-02-02 11:20:00'
        },
        {
            type: 'irrigation_advice',
            crop: 'Cotton',
            input_summary: { crop: 'Cotton', soil_type: 'Black Clay', temperature: 34.0, humidity: 45.0 },
            result_summary: { status: 'Irrigation Required', water_volume_liters_per_acre: 24000, next_schedule: 'In 2 days' },
            timestamp: '2026-01-28 09:45:00'
        },
        {
            type: 'pest_risk',
            crop: 'Mustard',
            input_summary: { crop: 'Mustard', temperature: 18.0, humidity: 85.0 },
            result_summary: { risk_level: 'High (Aphids & Mustard Sawfly)', preventative_measure: 'Spray Imidacloprid 17.8 SL @ 0.5 ml/L' },
            timestamp: '2026-01-20 16:10:00'
        }
    ];

    const fetchHistory = async (append = false) => {
        try {
            let url = `${API_URL}?limit=${limit}&offset=${offset}`;
            if (currentType !== 'all') url += `&type=${currentType}`;
            
            const res = await authFetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.data && data.data.length > 0) {
                    renderHistory(data.data, append);
                    if (loadMoreBtn) {
                        loadMoreBtn.style.display = data.data.length === limit ? 'inline-block' : 'none';
                    }
                    return;
                }
            }
        } catch (err) {
            console.warn("Using offline / fallback history records.");
        }

        // Offline / fallback filtering
        let filtered = fallbackRecords;
        if (currentType !== 'all') {
            filtered = fallbackRecords.filter(r => r.type === currentType);
        }
        renderHistory(filtered, append);
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    };

    const renderHistory = (records, append) => {
        if (!timeline) return;
        if (!append) timeline.innerHTML = '';
        
        if (!records || records.length === 0) {
            if (!append) {
                timeline.innerHTML = `
                    <div style="text-align:center; padding:40px 20px; background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <span class="material-icons" style="font-size:3rem; color:#bdc3c7;">history_toggle_off</span>
                        <h4 style="color:#7f8c8d; margin:10px 0 5px;">No activity records found</h4>
                        <p style="color:#95a5a6; font-size:0.9rem; margin:0;">Predictions and advisories will appear here automatically.</p>
                    </div>
                `;
            }
            return;
        }

        records.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'history-card';
            
            const resSum = rec.result_summary || {};
            const inSum = rec.input_summary || {};
            let bodyContent = '';
            
            if (rec.type === 'crop_prediction') {
                const cropName = resSum.predicted_crop || resSum.recommended_crop || rec.crop || 'Wheat';
                const conf = typeof resSum.confidence === 'number' ? (resSum.confidence <= 1 ? (resSum.confidence * 100).toFixed(0) : resSum.confidence) : 94;
                bodyContent = `
                    <p style="margin:0 0 6px 0; font-size:1rem;"><strong>Recommended Crop:</strong> <span class="badge" style="background:#e8f5e9; color:#2e7d32; font-size:0.9rem; padding:3px 10px; font-weight:bold;">${cropName}</span> <span style="color:#666; font-size:0.85rem;">(${conf}% Match)</span></p>
                    <p style="font-size:0.85rem; color:#666; margin:0;">Soil Nutrients: N: ${inSum.N || 90} | P: ${inSum.P || 42} | K: ${inSum.K || 43} | Temp: ${inSum.temperature || 24}°C | Rain: ${inSum.rainfall || 180}mm</p>
                `;
            } else if (rec.type === 'disease_detection') {
                const disease = resSum.disease || 'Leaf Spot Alert';
                const treat = resSum.treatment || resSum.organic_treatment || 'Apply systemic fungicide / neem oil spray.';
                bodyContent = `
                    <p style="margin:0 0 6px 0; font-size:1rem;"><strong>Detection Result:</strong> <span class="badge" style="background:#ffebee; color:#c62828; font-size:0.9rem; padding:3px 10px; font-weight:bold;">${disease}</span></p>
                    <p style="font-size:0.85rem; color:#444; margin:0;"><strong>Recommended Treatment:</strong> ${treat}</p>
                `;
            } else if (rec.type === 'irrigation_advice') {
                const advice = resSum.status || resSum.recommendation || 'Normal Irrigation';
                const vol = resSum.water_volume_liters_per_acre ? `${resSum.water_volume_liters_per_acre.toLocaleString()} Liters / Acre` : (resSum.water_quantity_mm ? `${resSum.water_quantity_mm} mm` : 'Optimal');
                bodyContent = `
                    <p style="margin:0 0 6px 0; font-size:1rem;"><strong>Schedule:</strong> <span class="badge" style="background:#e3f2fd; color:#1565c0; font-size:0.9rem; padding:3px 10px; font-weight:bold;">${advice.replace(/_/g, ' ')}</span></p>
                    <p style="font-size:0.85rem; color:#666; margin:0;">Water Volume: <strong>${vol}</strong> | Soil: ${inSum.soil_type || inSum.soil_moisture || 'Loamy'} | Stage: ${inSum.growth_stage || 'Vegetative'}</p>
                `;
            } else if (rec.type === 'pest_risk') {
                const risk = resSum.risk_level || (resSum.high_risk_count ? `${resSum.high_risk_count} High Risk Pests` : 'Moderate');
                const prev = resSum.preventative_measure || 'Monitor field regularly and use yellow sticky traps.';
                bodyContent = `
                    <p style="margin:0 0 6px 0; font-size:1rem;"><strong>Pest Risk Level:</strong> <span class="badge" style="background:#fff3e0; color:#ef6c00; font-size:0.9rem; padding:3px 10px; font-weight:bold;">${risk}</span></p>
                    <p style="font-size:0.85rem; color:#444; margin:0;"><strong>Action:</strong> ${prev}</p>
                `;
            } else if (rec.type === 'fertilizer_calc') {
                const urea = resSum.urea_kg !== undefined ? resSum.urea_kg : (resSum.N_kg || 150);
                const dap = resSum.dap_kg !== undefined ? resSum.dap_kg : (resSum.P_kg || 75);
                const mop = resSum.mop_kg !== undefined ? resSum.mop_kg : (resSum.K_kg || 40);
                const cost = resSum.estimated_cost_inr || 3500;
                bodyContent = `
                    <p style="margin:0 0 6px 0; font-size:1rem;"><strong>Dosage Plan:</strong> Urea: <strong>${urea} kg</strong> | DAP: <strong>${dap} kg</strong> | MOP: <strong>${mop} kg</strong></p>
                    <p style="font-size:0.85rem; color:#666; margin:0;">Estimated Cost: <strong>₹${cost.toLocaleString()}</strong> | Crop: ${inSum.crop || rec.crop || 'Wheat'} (${inSum.land_area_acres || 3} Acres)</p>
                `;
            } else {
                bodyContent = `<p style="margin:0; color:#666;">Activity record details logged.</p>`;
            }
            
            const dateStr = rec.timestamp ? new Date(rec.timestamp).toLocaleString() : new Date().toLocaleString();
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${typeIcons[rec.type] || rec.type} ${rec.crop ? `<span style="color:#7f8c8d; font-weight:normal;">• ${rec.crop}</span>` : ''}</div>
                    <div class="card-date">${dateStr}</div>
                </div>
                <div class="card-body" style="padding-top:8px;">
                    ${bodyContent}
                </div>
            `;
            timeline.appendChild(card);
        });
    };

    // Filter Chips Event Listeners
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentType = chip.dataset.type;
            offset = 0;
            fetchHistory(false);
        });
    });

    // Load More Button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            offset += limit;
            fetchHistory(true);
        });
    }

    // Initial load
    fetchHistory(false);
});
