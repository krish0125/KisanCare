document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5001/api/schemes';
    const ELIGIBLE_API_URL = 'http://localhost:5001/api/schemes/eligible';
    
    const schemeGrid = document.querySelector('.scheme-grid');
    if (!schemeGrid) return;
    
    // Check if user is logged in
    const token = localStorage.getItem('kisanToken');
    
    const loadSchemes = async () => {
        try {
            schemeGrid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">Loading schemes...</p>';
            
            let url = API_URL;
            let headers = {};
            
            if (token) {
                url = ELIGIBLE_API_URL;
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const res = await fetch(url, { headers });
            const data = await res.json();
            
            if (data.status === 'success') {
                renderSchemes(data.data);
            } else {
                schemeGrid.innerHTML = '<p style="text-align:center; color:red; grid-column: 1 / -1;">Failed to load schemes.</p>';
            }
        } catch (err) {
            console.error(err);
            schemeGrid.innerHTML = '<p style="text-align:center; color:red; grid-column: 1 / -1;">Error connecting to server.</p>';
        }
    };
    
    const renderSchemes = (schemes) => {
        schemeGrid.innerHTML = '';
        
        if (!schemes || schemes.length === 0) {
            schemeGrid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">No schemes available at the moment.</p>';
            return;
        }
        
        // Sort schemes so eligible ones appear first
        schemes.sort((a, b) => {
            if (a.you_may_be_eligible && !b.you_may_be_eligible) return -1;
            if (!a.you_may_be_eligible && b.you_may_be_eligible) return 1;
            return 0;
        });
        
        schemes.forEach(scheme => {
            const card = document.createElement('div');
            card.className = 'scheme-card';
            
            let eligibleBadge = '';
            let cardStyle = '';
            
            if (scheme.you_may_be_eligible) {
                eligibleBadge = `
                    <div style="background: #e8f5e9; color: #2e7d32; padding: 8px 12px; border-radius: 8px; margin-bottom: 15px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                        <span class="material-icons" style="font-size: 1.2rem;">check_circle</span>
                        You may be eligible — verify details
                    </div>
                `;
                cardStyle = 'border: 2px solid #4caf50; box-shadow: 0 8px 25px rgba(76, 175, 80, 0.2);';
            }
            
            card.style.cssText = cardStyle;
            
            const reqDocs = scheme.required_documents ? scheme.required_documents.join(', ') : 'None specified';
            
            card.innerHTML = `
                <div class="card-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div class="scheme-icon-wrapper" style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); color: #1976d2; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.5rem;"><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>description</span></div>
                    ${scheme.last_date ? `<div class="fund-badge" style="background: #fff3e0; color: #e65100; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">Deadline: ${scheme.last_date}</div>` : ''}
                </div>
                ${eligibleBadge}
                <h3 style="font-size: 1.3rem; margin-bottom: 10px; color: #2c3e50;">${scheme.name}</h3>
                <p class="desc" style="color: #666; font-size: 0.95rem; line-height: 1.5; margin-bottom: 15px; flex-grow: 1;">${scheme.description}</p>
                <ul class="scheme-details-list" style="list-style: none; padding: 0; margin-bottom: 20px; font-size: 0.9rem; color: #555;">
                    <li style="margin-bottom: 6px;"><strong>Benefits:</strong> ${scheme.benefits || 'N/A'}</li>
                    <li style="margin-bottom: 6px;"><strong>Docs:</strong> ${reqDocs}</li>
                </ul>
                <a href="${scheme.application_guidance_url || '#'}" target="_blank" class="btn-check-scheme" style="display: block; text-align: center; background: #2ecc71; color: white; text-decoration: none; padding: 10px; border-radius: 8px; font-weight: 600; transition: all 0.3s;">
                    View Details
                </a>
            `;
            
            schemeGrid.appendChild(card);
        });
    };
    
    loadSchemes();
});
