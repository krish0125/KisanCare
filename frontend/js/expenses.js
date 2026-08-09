/**
 * frontend/js/expenses.js
 * 
 * Interactive Crop Cycle & Expense / Profit Tracker
 * Supports dynamic financial recalculation, PDF/Excel export, and dual backend/localStorage sync.
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5001/api/crop-cycles';
    let currentCycleId = null;
    let cyclesData = [];

    // --- UI Helpers ---
    window.openNewCycleModal = () => { 
        document.getElementById('newCycleModal').classList.add('active'); 
    };
    
    window.openAddExpenseModal = () => { 
        if (!currentCycleId) return;
        document.getElementById('aeDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('addExpenseModal').classList.add('active'); 
    };
    
    window.openEditMetaModal = () => { 
        if (!currentCycleId) return;
        const c = cyclesData.find(x => x.cycle_id === currentCycleId);
        if (c) {
            document.getElementById('emExpPrice').value = c.expected_sale_price_inr_per_quintal || '';
            document.getElementById('emActPrice').value = c.actual_sale_price_inr_per_quintal || '';
            document.getElementById('emYield').value = c.actual_yield_quintals || '';
        }
        document.getElementById('editMetaModal').classList.add('active'); 
    };
    
    window.closeModal = (id) => { 
        document.getElementById(id).classList.remove('active'); 
    };

    // Format currency
    const fmtRs = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Financial Calculation Helper
    const computeSummary = (c) => {
        const totalInvestment = (c.expenses || []).reduce((acc, exp) => acc + (parseFloat(exp.amount_inr) || 0), 0);
        const expPrice = parseFloat(c.expected_sale_price_inr_per_quintal) || 0;
        const actPrice = parseFloat(c.actual_sale_price_inr_per_quintal) || 0;
        const yld = parseFloat(c.actual_yield_quintals) || 0;
        
        const revPrice = actPrice > 0 ? actPrice : expPrice;
        const revenue = revPrice * yld;
        const profitLoss = revenue - totalInvestment;
        const landArea = parseFloat(c.land_area_acres) || 1;
        const profitPerAcre = landArea > 0 ? profitLoss / landArea : profitLoss;

        return {
            total_investment_inr: totalInvestment,
            expected_revenue_inr: expPrice * yld,
            actual_revenue_inr: actPrice * yld,
            current_revenue_estimate_inr: revenue,
            profit_loss_inr: profitLoss,
            profit_loss_per_acre_inr: profitPerAcre,
            is_profitable: profitLoss >= 0
        };
    };

    // Default Fallback Demo Data
    const defaultCycles = [
        {
            cycle_id: 'cycle-wheat-2026',
            cycle_name: 'Wheat Rabi 2025-26',
            crop: 'Wheat',
            land_area_acres: 3.5,
            start_date: '2025-11-10',
            status: 'active',
            expenses: [
                { expense_id: 'exp-w-1', category: 'seeds', amount_inr: 4500.0, date: '2025-11-12', note: 'High-yield HD-2967 certified seeds (140 kg)' },
                { expense_id: 'exp-w-2', category: 'fertilizer', amount_inr: 6200.0, date: '2025-11-20', note: 'DAP & Urea basal application (3 bags)' },
                { expense_id: 'exp-w-3', category: 'labour', amount_inr: 5000.0, date: '2025-12-05', note: 'Weeding and initial soil treatment' },
                { expense_id: 'exp-w-4', category: 'irrigation', amount_inr: 3200.0, date: '2025-12-25', note: 'First crown root initiation irrigation pump charges' },
                { expense_id: 'exp-w-5', category: 'machinery', amount_inr: 4000.0, date: '2026-01-10', note: 'Tractor cultivator and rotavator service' }
            ],
            expected_sale_price_inr_per_quintal: 2425.0,
            actual_sale_price_inr_per_quintal: 2475.0,
            actual_yield_quintals: 42.0
        },
        {
            cycle_id: 'cycle-cotton-2025',
            cycle_name: 'Cotton Kharif 2025',
            crop: 'Cotton',
            land_area_acres: 2.0,
            start_date: '2025-06-15',
            status: 'completed',
            expenses: [
                { expense_id: 'exp-c-1', category: 'seeds', amount_inr: 3800.0, date: '2025-06-18', note: 'Bt-Cotton hybrid packets' },
                { expense_id: 'exp-c-2', category: 'fertilizer', amount_inr: 5500.0, date: '2025-07-02', note: 'NPK 19:19:19 & Micronutrients' },
                { expense_id: 'exp-c-3', category: 'labour', amount_inr: 7500.0, date: '2025-09-15', note: 'Boll picking labour (3 rounds)' },
                { expense_id: 'exp-c-4', category: 'transport', amount_inr: 2200.0, date: '2025-10-20', note: 'Mandi transport cartage' }
            ],
            expected_sale_price_inr_per_quintal: 7200.0,
            actual_sale_price_inr_per_quintal: 7450.0,
            actual_yield_quintals: 18.0
        }
    ];

    const saveLocalCycles = () => {
        localStorage.setItem('kisanCycles', JSON.stringify(cyclesData));
    };

    // --- Data Fetching ---
    const loadCycles = async () => {
        try {
            const res = await authFetch(API_URL);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.data && data.data.length > 0) {
                    cyclesData = data.data;
                    saveLocalCycles();
                } else {
                    const saved = localStorage.getItem('kisanCycles');
                    cyclesData = saved ? JSON.parse(saved) : defaultCycles;
                }
            } else {
                const saved = localStorage.getItem('kisanCycles');
                cyclesData = saved ? JSON.parse(saved) : defaultCycles;
            }
        } catch (err) {
            const saved = localStorage.getItem('kisanCycles');
            cyclesData = saved ? JSON.parse(saved) : defaultCycles;
        }

        // Ensure summaries computed
        cyclesData.forEach(c => {
            if (!c.summary) c.summary = computeSummary(c);
        });

        renderCycleList();
        
        if (cyclesData.length > 0) {
            const targetId = (currentCycleId && cyclesData.find(c => c.cycle_id === currentCycleId)) 
                ? currentCycleId 
                : cyclesData[0].cycle_id;
            currentCycleId = targetId;
            renderMainView(currentCycleId);
        } else {
            document.getElementById('mainView').style.display = 'none';
            document.getElementById('emptyView').style.display = 'flex';
        }
    };

    // --- Rendering ---
    const renderCycleList = () => {
        const list = document.getElementById('cycleList');
        if (!list) return;
        list.innerHTML = '';
        
        if (cyclesData.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">No crop cycles yet. Click "+ New" to add one.</p>';
            return;
        }

        cyclesData.forEach(c => {
            const sum = c.summary || computeSummary(c);
            const profit = sum.profit_loss_inr || 0;
            const profitColor = profit >= 0 ? '#2e7d32' : '#d32f2f';
            
            const card = document.createElement('div');
            card.className = `cycle-card ${c.cycle_id === currentCycleId ? 'active' : ''}`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <h4 style="margin:0; font-size:1rem; color:#2c3e50;">${c.cycle_name}</h4>
                    <span style="font-size:0.75rem; padding:2px 8px; border-radius:10px; background:${c.status === 'completed' ? '#e8f5e9' : '#e3f2fd'}; color:${c.status === 'completed' ? '#2e7d32' : '#1565c0'}; text-transform:capitalize;">${c.status || 'active'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <p style="margin:0; font-size:0.85rem; color:#666;">${c.crop} • ${c.land_area_acres} Acres</p>
                    <p style="margin:0; color:${profitColor}; font-weight:700; font-size:0.9rem;">${profit >= 0 ? '+' : ''}${fmtRs(profit)}</p>
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
        document.getElementById('viewCycleMeta').textContent = `${cycle.crop} | ${cycle.land_area_acres} Acres | Started: ${cycle.start_date || 'N/A'}`;
        
        // Stats
        const sum = cycle.summary || computeSummary(cycle);
        document.getElementById('statInvest').textContent = fmtRs(sum.total_investment_inr);
        document.getElementById('statRev').textContent = fmtRs(sum.current_revenue_estimate_inr);
        
        const pl = sum.profit_loss_inr;
        const plEl = document.getElementById('statProfit');
        plEl.textContent = `${pl >= 0 ? '+' : ''}${fmtRs(pl)}`;
        plEl.className = `stat-value ${pl >= 0 ? 'profit' : 'loss'}`;
        
        // Expenses Table
        const tbody = document.getElementById('expenseTbody');
        tbody.innerHTML = '';
        
        const expenses = cycle.expenses || [];
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#888; padding:20px;">No expenses recorded yet. Click "+ Add Expense" above.</td></tr>';
        } else {
            [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-size:0.9rem; color:#555;">${exp.date}</td>
                    <td><span class="badge" style="text-transform:capitalize; background:#e8f5e9; color:#2e7d32; padding:3px 8px; border-radius:12px; font-size:0.8rem;">${exp.category}</span></td>
                    <td style="font-weight:600; color:#2c3e50;">${fmtRs(exp.amount_inr)}</td>
                    <td style="color:#666; font-size:0.9rem;">${exp.note || '-'}</td>
                    <td><button class="btn-delete" title="Delete Expense" onclick="deleteExpense('${exp.expense_id}')" style="cursor:pointer; background:none; border:none; color:#e74c3c; font-size:1.1rem;"><span class="material-icons" style="font-size:1.2rem; vertical-align:middle;">delete</span></button></td>
                `;
                tbody.appendChild(tr);
            });
        }
    };

    // --- Actions ---
    
    // 1. Create Cycle
    const newCycleForm = document.getElementById('newCycleForm');
    if (newCycleForm) {
        newCycleForm.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                cycle_name: document.getElementById('ncName').value.trim(),
                crop: document.getElementById('ncCrop').value.trim(),
                land_area_acres: parseFloat(document.getElementById('ncArea').value) || 1.0,
                start_date: document.getElementById('ncDate').value || new Date().toISOString().split('T')[0]
            };
            
            const newCycleObj = {
                cycle_id: 'cycle-' + Date.now(),
                ...payload,
                status: 'active',
                expenses: [],
                expected_sale_price_inr_per_quintal: 0,
                actual_sale_price_inr_per_quintal: 0,
                actual_yield_quintals: 0
            };
            newCycleObj.summary = computeSummary(newCycleObj);

            cyclesData.unshift(newCycleObj);
            currentCycleId = newCycleObj.cycle_id;
            saveLocalCycles();
            renderCycleList();
            renderMainView(currentCycleId);
            closeModal('newCycleModal');
            newCycleForm.reset();

            // Sync with backend API
            try {
                const res = await authFetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.status === 'success' && data.cycle) {
                    newCycleObj.cycle_id = data.cycle.cycle_id;
                    currentCycleId = data.cycle.cycle_id;
                    saveLocalCycles();
                    renderCycleList();
                }
            } catch (err) {
                console.warn('Saved cycle locally.');
            }
        };
    }
    
    // 2. Add Expense
    const addExpenseForm = document.getElementById('addExpenseForm');
    if (addExpenseForm) {
        addExpenseForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!currentCycleId) return;
            
            const payload = {
                category: document.getElementById('aeCategory').value,
                amount_inr: parseFloat(document.getElementById('aeAmount').value) || 0,
                date: document.getElementById('aeDate').value || new Date().toISOString().split('T')[0],
                note: document.getElementById('aeNote').value.trim()
            };
            
            const cycle = cyclesData.find(c => c.cycle_id === currentCycleId);
            if (cycle) {
                const newExp = {
                    expense_id: 'exp-' + Date.now(),
                    ...payload
                };
                if (!cycle.expenses) cycle.expenses = [];
                cycle.expenses.push(newExp);
                cycle.summary = computeSummary(cycle);
                saveLocalCycles();
                renderCycleList();
                renderMainView(currentCycleId);
            }

            closeModal('addExpenseModal');
            addExpenseForm.reset();

            // Sync with API
            try {
                await authFetch(`${API_URL}/${currentCycleId}/expenses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.warn('Expense saved locally.');
            }
        };
    }
    
    // 3. Delete Expense (Global function)
    window.deleteExpense = async (expId) => {
        if (!currentCycleId || !confirm('Are you sure you want to delete this expense?')) return;
        
        const cycle = cyclesData.find(c => c.cycle_id === currentCycleId);
        if (cycle && cycle.expenses) {
            cycle.expenses = cycle.expenses.filter(e => e.expense_id !== expId);
            cycle.summary = computeSummary(cycle);
            saveLocalCycles();
            renderCycleList();
            renderMainView(currentCycleId);
        }

        try {
            await authFetch(`${API_URL}/${currentCycleId}/expenses/${expId}`, { method: 'DELETE' });
        } catch (err) {
            console.warn('Deleted locally.');
        }
    };
    
    // 4. Update Meta
    const editMetaForm = document.getElementById('editMetaForm');
    if (editMetaForm) {
        editMetaForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!currentCycleId) return;
            
            const payload = {
                expected_sale_price: parseFloat(document.getElementById('emExpPrice').value || 0),
                actual_sale_price: parseFloat(document.getElementById('emActPrice').value || 0),
                actual_yield: parseFloat(document.getElementById('emYield').value || 0)
            };

            const cycle = cyclesData.find(c => c.cycle_id === currentCycleId);
            if (cycle) {
                cycle.expected_sale_price_inr_per_quintal = payload.expected_sale_price;
                cycle.actual_sale_price_inr_per_quintal = payload.actual_sale_price;
                cycle.actual_yield_quintals = payload.actual_yield;
                cycle.summary = computeSummary(cycle);
                saveLocalCycles();
                renderCycleList();
                renderMainView(currentCycleId);
            }

            closeModal('editMetaModal');

            try {
                await authFetch(`${API_URL}/${currentCycleId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.warn('Yield & Price updated locally.');
            }
        };
    }
    
    // 5. Download Report (CSV / Text Export)
    window.downloadReport = async (fmt) => {
        if (!currentCycleId) return;
        const cycle = cyclesData.find(c => c.cycle_id === currentCycleId);
        if (!cycle) return;

        const sum = cycle.summary || computeSummary(cycle);

        if (fmt === 'xlsx' || fmt === 'csv') {
            let csv = `Crop Cycle Report: ${cycle.cycle_name}\n`;
            csv += `Crop,${cycle.crop}\nLand Area (Acres),${cycle.land_area_acres}\nStart Date,${cycle.start_date}\n\n`;
            csv += `Financial Summary\n`;
            csv += `Total Investment,₹${sum.total_investment_inr}\n`;
            csv += `Est. Revenue,₹${sum.current_revenue_estimate_inr}\n`;
            csv += `Net Profit / Loss,₹${sum.profit_loss_inr}\n\n`;
            csv += `Expenses Detail\n`;
            csv += `Date,Category,Amount (INR),Note\n`;
            (cycle.expenses || []).forEach(exp => {
                csv += `"${exp.date}","${exp.category}","${exp.amount_inr}","${exp.note || ''}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cycle.cycle_name.replace(/\s+/g, '_')}_Financial_Report.csv`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // PDF or Printable HTML view
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>${cycle.cycle_name} Report</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
                            h1 { color: #2e7d32; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                            th { background-color: #f1f8e9; }
                            .stat-box { display: flex; gap: 20px; margin: 20px 0; }
                            .stat-item { flex: 1; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #eee; }
                        </style>
                    </head>
                    <body>
                        <h1>🌱 KisanCare - Crop Cycle Financial Report</h1>
                        <h2>${cycle.cycle_name}</h2>
                        <p><strong>Crop:</strong> ${cycle.crop} | <strong>Area:</strong> ${cycle.land_area_acres} Acres | <strong>Start Date:</strong> ${cycle.start_date}</p>
                        
                        <div class="stat-box">
                            <div class="stat-item"><strong>Total Investment:</strong><br>${fmtRs(sum.total_investment_inr)}</div>
                            <div class="stat-item"><strong>Est. Revenue:</strong><br>${fmtRs(sum.current_revenue_estimate_inr)}</div>
                            <div class="stat-item" style="color:${sum.profit_loss_inr >= 0 ? '#2e7d32' : '#d32f2f'};"><strong>Net Profit / Loss:</strong><br>${fmtRs(sum.profit_loss_inr)}</div>
                        </div>

                        <h3>Expense Breakdown</h3>
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Category</th><th>Amount (INR)</th><th>Note</th></tr>
                            </thead>
                            <tbody>
                                ${(cycle.expenses || []).map(e => `
                                    <tr>
                                        <td>${e.date}</td>
                                        <td style="text-transform:capitalize;">${e.category}</td>
                                        <td>${fmtRs(e.amount_inr)}</td>
                                        <td>${e.note || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    // Initial fetch
    loadCycles();
});
