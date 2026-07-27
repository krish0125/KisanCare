document.addEventListener('DOMContentLoaded', () => {
    // Note: Calculator works without login, but history is only saved if logged in.
    // We'll still wrap the fetch to send the token if it exists.
    
    document.getElementById('calcForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('calcBtn');
        btn.textContent = 'Calculating...';
        btn.disabled = true;
        
        const payload = {
            crop: document.getElementById('calcCrop').value,
            land_area_acres: parseFloat(document.getElementById('calcArea').value),
            growth_stage: document.getElementById('calcStage').value
        };
        
        // Add overrides if provided
        const n = document.getElementById('overrideN').value;
        const p = document.getElementById('overrideP').value;
        const k = document.getElementById('overrideK').value;
        
        if (n || p || k) {
            payload.soil_test_override = {};
            if (n) payload.soil_test_override.N = parseFloat(n);
            if (p) payload.soil_test_override.P = parseFloat(p);
            if (k) payload.soil_test_override.K = parseFloat(k);
        }
        
        // Show skeleton loader in result panel
        document.getElementById('resultPanel').style.display = 'block';
        const skeletonHtml = '<div class="skeleton-box" style="width:60px;height:24px;"></div>';
        document.getElementById('resUrea').innerHTML = skeletonHtml;
        document.getElementById('resDAP').innerHTML = skeletonHtml;
        document.getElementById('resMOP').innerHTML = skeletonHtml;
        document.getElementById('resCost').innerHTML = '<div class="skeleton-box" style="width:120px;height:24px;"></div>';
        document.getElementById('resSchedule').innerHTML = '<div class="skeleton-box" style="width:100%;height:60px;"></div>';
        document.getElementById('resN').innerHTML = '<div class="skeleton-box" style="width:40px;height:20px;"></div>';
        document.getElementById('resP').innerHTML = '<div class="skeleton-box" style="width:40px;height:20px;"></div>';
        document.getElementById('resK').innerHTML = '<div class="skeleton-box" style="width:40px;height:20px;"></div>';

        try {
            // Using authFetch so token is sent if user is logged in
            const res = await authFetch('http://localhost:5001/api/fertilizer-calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (data.status === 'success') {
                const resData = data.data;
                
                document.getElementById('resUrea').textContent = `${resData.urea_kg} kg`;
                document.getElementById('resDAP').textContent = `${resData.dap_kg} kg`;
                document.getElementById('resMOP').textContent = `${resData.mop_kg} kg`;
                
                document.getElementById('resCost').textContent = `Est. Cost: ₹${resData.estimated_cost_inr.toLocaleString()}`;
                
                document.getElementById('resSchedule').textContent = resData.application_schedule;
                
                document.getElementById('resN').textContent = resData.N_kg;
                document.getElementById('resP').textContent = resData.P_kg;
                document.getElementById('resK').textContent = resData.K_kg;
                
                document.getElementById('resDisclaimer').textContent = resData.disclaimer;
                
                document.getElementById('resultPanel').style.display = 'block';
            } else {
                alert('Error: ' + data.message);
            }
        } catch (err) {
            alert('Failed to calculate fertilizer requirements.');
            console.error(err);
        } finally {
            btn.textContent = 'Calculate Requirement';
            btn.disabled = false;
        }
    };
});
