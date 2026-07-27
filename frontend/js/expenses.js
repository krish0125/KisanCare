document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const API_URL = 'http://localhost:5001/api/crop-cycles';
    let currentCycleId = null;
    let cyclesData = [];

    // --- UI Helpers ---
    window.openNewCycleModal = () => { document.getElementById('newCycleModal').classList.add('active'); };
    window.openAddExpenseModal = () => { 
        if(!currentCycleId) return;
        document.getElementById('aeDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('addExpenseModal').classList.add('active'); 
    };
    window.openEditMetaModal = () => { 
        if(!currentCycleId) return;
        const c = cyclesData.find(x => x.cycle_id === currentCycleId);
        if(c) {
            document.getElementById('emExpPrice').value = c.expected_sale_price_inr_per_quintal || '';
            document.getElementById('emActPrice').value = c.actual_sale_price_inr_per_quintal || '';
            document.getElementById('emYield').value = c.actual_yield_quintals || '';
        }
        document.getElementById('editMetaModal').classList.add('active'); 
    };
    window.closeModal = (id) => { document.getElementById(id).classList.remove('active'); };
    
    // Format currency
    const fmtRs = (val) => '₹' + parseFloat(val).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});

    // --- Data Fetching ---
    const loadCycles = async () => {
        try {
            const res = await authFetch(API_URL);
            const data = await res.json();
            if (data.status === 'success') {
                cyclesData = data.data;
                renderCycleList();
                
                // If a cycle is selected, refresh its view; else show empty
                if (currentCycleId && cyclesData.find(c => c.cycle_id === currentCycleId)) {
                    renderMainView(currentCycleId);
                } else {
                    document.getElementById('mainView').style.display = 'none';
                    document.getElementById('emptyView').style.display = 'flex';
                }
            }
        } catch (err) {
            console.error(err);
            document.getElementById('cycleList').innerHTML = '<p style="color:red; text-align:center; padding:10px;">Failed to load cycles. Please refresh or log in again.</p>';
            document.getElementById('mainView').style.display = 'none';
            document.getElementById('emptyView').style.display = 'flex';
        }
    };

    const loadSingleCycle = async (id) => {
        try {
            const res = await authFetch(`${API_URL}/${id}`);
            const data = await res.json();
            if (data.status === 'success') {
                const idx = cyclesData.findIndex(c => c.cycle_id === id);
                if(idx !== -1) cyclesData[idx] = data.cycle;
                renderMainView(id);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to load cycle details. Please check your connection.');
        }
    };

    // --- Rendering ---
    const renderCycleList = () => {
        const list = document.getElementById('cycleList');
        list.innerHTML = '';
        
        if (cyclesData.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#888;">No crop cycles found.</p>';
            return;
        }

        cyclesData.forEach(c => {
            const card = document.createElement('div');
            card.className = `cycle-card ${c.cycle_id === currentCycleId ? 'active' : ''}`;
            
            const profit = c.summary ? c.summary.profit_loss_inr : 0;
            const profitColor = profit >= 0 ? '#2e7d32' : '#d32f2f';
            
            card.innerHTML = `
                <h4>${c.cycle_name}</h4>
                <div style="display:flex; justify-content:space-between;">
                    <p>${c.crop.charAt(0).toUpperCase() + c.crop.slice(1)} • ${c.land_area_acres} ac</p>
                    <p style="color:${profitColor}; font-weight:bold;">${profit >= 0 ? '+' : ''}${fmtRs(profit)}</p>
                </div>
            `;
            
            card.onclick = () => {
                currentCycleId = c.cycle_id;
                document.querySelectorAll('.cycle-card').forEach(el => el.classList.remove('active'));
                card.classList.add('active');
                renderMainView(currentCycleId);
            };
            
            list.appendChild(card);
        });
    };

    const renderMainView = (id) => {
        const cycle = cyclesData.find(c => c.cycle_id === id);
        if (!cycle) return;

        document.getElementById('emptyView').style.display = 'none';
        document.getElementById('mainView').style.display = 'flex';
        
        document.getElementById('viewCycleName').textContent = cycle.cycle_name;
        document.getElementById('viewCycleMeta').textContent = `${cycle.crop.charAt(0).toUpperCase() + cycle.crop.slice(1)} | ${cycle.land_area_acres} Acres | Started: ${cycle.start_date}`;
        
        // Stats
        const sum = cycle.summary || {};
        document.getElementById('statInvest').textContent = fmtRs(sum.total_investment_inr || 0);
        document.getElementById('statRev').textContent = fmtRs(sum.current_revenue_estimate_inr || 0);
        
        const pl = sum.profit_loss_inr || 0;
        const plEl = document.getElementById('statProfit');
        plEl.textContent = `${pl >= 0 ? '+' : ''}${fmtRs(pl)}`;
        plEl.className = `stat-value ${pl >= 0 ? 'profit' : 'loss'}`;
        
        // Expenses Table
        const tbody = document.getElementById('expenseTbody');
        tbody.innerHTML = '';
        
        const expenses = cycle.expenses || [];
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#888;">No expenses recorded yet.</td></tr>';
        } else {
            // Sort newest first
            [...expenses].sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${exp.date}</td>
                    <td style="text-transform:capitalize;">${exp.category}</td>
                    <td>${fmtRs(exp.amount_inr)}</td>
                    <td>${exp.note || '-'}</td>
                    <td><button class="btn-delete" onclick="deleteExpense('${exp.expense_id}')">️</button></td>
                `;
                tbody.appendChild(tr);
            });
        }
    };

    // --- Actions ---
    
    // 1. Create Cycle
    document.getElementById('newCycleForm').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            cycle_name: document.getElementById('ncName').value,
            crop: document.getElementById('ncCrop').value,
            land_area_acres: parseFloat(document.getElementById('ncArea').value),
            start_date: document.getElementById('ncDate').value
        };
        
        try {
            const res = await authFetch(API_URL, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                closeModal('newCycleModal');
                document.getElementById('newCycleForm').reset();
                currentCycleId = data.cycle.cycle_id;
                await loadCycles(); // Refresh all to get summary
            } else alert(data.message);
        } catch (err) { alert('Failed to create cycle'); }
    };
    
    // 2. Add Expense
    document.getElementById('addExpenseForm').onsubmit = async (e) => {
        e.preventDefault();
        if(!currentCycleId) return;
        
        const payload = {
            category: document.getElementById('aeCategory').value,
            amount_inr: parseFloat(document.getElementById('aeAmount').value),
            date: document.getElementById('aeDate').value,
            note: document.getElementById('aeNote').value
        };
        
        try {
            const res = await authFetch(`${API_URL}/${currentCycleId}/expenses`, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                closeModal('addExpenseModal');
                document.getElementById('addExpenseForm').reset();
                await loadSingleCycle(currentCycleId);
                renderCycleList(); // Update sidebar profit num
            }
        } catch (err) { alert('Failed to add expense'); }
    };
    
    // 3. Delete Expense (Global function)
    window.deleteExpense = async (expId) => {
        if(!currentCycleId || !confirm('Delete this expense?')) return;
        try {
            const res = await authFetch(`${API_URL}/${currentCycleId}/expenses/${expId}`, { method: 'DELETE' });
            if (res.ok) {
                await loadSingleCycle(currentCycleId);
                renderCycleList();
            }
        } catch (err) { alert('Failed to delete expense'); }
    };
    
    // 4. Update Meta
    document.getElementById('editMetaForm').onsubmit = async (e) => {
        e.preventDefault();
        if(!currentCycleId) return;
        
        const payload = {
            expected_sale_price: parseFloat(document.getElementById('emExpPrice').value || 0),
            actual_sale_price: parseFloat(document.getElementById('emActPrice').value || 0),
            actual_yield: parseFloat(document.getElementById('emYield').value || 0)
        };
        
        try {
            const res = await authFetch(`${API_URL}/${currentCycleId}`, {
                method: 'PUT',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                closeModal('editMetaModal');
                await loadSingleCycle(currentCycleId);
                renderCycleList();
            }
        } catch (err) { alert('Failed to update details'); }
    };
    
    // 5. Download Report
    window.downloadReport = async (fmt) => {
        if(!currentCycleId) return;
        const token = getToken();
        if (!token) return;
        
        // Use standard window.open or fetch+blob for download
        // Fetch is better to pass Authorization header natively
        try {
            const res = await authFetch(`${API_URL}/${currentCycleId}/report?format=${fmt}`);
            if (!res.ok) throw new Error('Download failed');
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `CropCycle_Report.${fmt}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download report.');
        }
    };

    // Initial fetch
    loadCycles();
});
