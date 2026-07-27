// frontend/js/admin.js

const API_BASE = 'http://localhost:5001/api/admin';
let token = localStorage.getItem('kisanToken');

// Remove synchronous alert. The API calls in switchTab() will trigger 
// authFetch which handles 401/403 by redirecting to login.
if (!token) {
    window.location.href = 'index.html';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// Handle global 401/403
async function fetchAuth(url, options = {}) {
    options.headers = headers;
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        alert("Admin access required. Please login.");
        window.location.href = 'index.html';
        return null;
    }
    return response;
}

// ── Tab Switching ───────────────────────────────────────────────────────
function switchTab(tabId) {
    document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId + 'Section').classList.add('active');
    
    // Find the button that corresponds to this tab and make it active
    const buttons = document.querySelectorAll('.admin-tab');
    for (let btn of buttons) {
        if (btn.textContent.toLowerCase().includes(tabId.split('-')[0])) {
            btn.classList.add('active');
            break;
        }
    }

    // Auto-fetch data based on tab
    if (tabId === 'stats') fetchStats();
    if (tabId === 'farmers') fetchFarmers();
    if (tabId === 'schemes') fetchSchemes();
    if (tabId === 'notifications') fetchNotifications();
}

// ── Stats ───────────────────────────────────────────────────────────────
async function fetchStats() {
    const res = await fetchAuth(`${API_BASE}/stats`);
    if (!res) return;
    const json = await res.json();
    if (json.status === 'success') {
        const d = json.data;
        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card">
                <h3>Total Farmers</h3>
                <div class="value">${d.total_farmers}</div>
            </div>
            <div class="stat-card">
                <h3>Active Schemes</h3>
                <div class="value">${d.active_schemes}</div>
            </div>
            <div class="stat-card">
                <h3>Total Notifications</h3>
                <div class="value">${d.total_notifications}</div>
            </div>
        `;
    }
}

// ── Farmers ─────────────────────────────────────────────────────────────
async function fetchFarmers() {
    const tbody = document.getElementById('farmersBody');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    const res = await fetchAuth(`${API_BASE}/farmers`);
    if (!res) return;
    const json = await res.json();
    
    if (json.status === 'success') {
        if (json.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No farmers found.</td></tr>';
            return;
        }
        tbody.innerHTML = json.data.map(f => `
            <tr>
                <td>${f.name || 'N/A'}</td>
                <td>${f.email || 'N/A'}</td>
                <td>${f.created_at || 'N/A'}</td>
                <td><button class="btn" style="padding: 5px 10px; font-size: 12px;" onclick="viewFarmer('${f._id}')">Details</button></td>
            </tr>
        `).join('');
    }
}

async function viewFarmer(id) {
    const res = await fetchAuth(`${API_BASE}/farmers/${id}`);
    if (!res) return;
    const json = await res.json();
    if (json.status === 'success') {
        alert(JSON.stringify(json.data, null, 2)); // Simple drill-down view for now
    }
}

// ── Schemes ─────────────────────────────────────────────────────────────
async function fetchSchemes() {
    const tbody = document.getElementById('schemesBody');
    tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
    const res = await fetchAuth(`${API_BASE}/schemes`);
    if (!res) return;
    const json = await res.json();
    
    if (json.status === 'success') {
        if (json.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No schemes found.</td></tr>';
            return;
        }
        tbody.innerHTML = json.data.map(s => `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td>
                    <span style="color: ${s.is_active ? 'green' : 'red'}; font-weight: bold;">
                        ${s.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="btn" style="padding: 5px 10px; font-size: 12px; background: #f39c12;" onclick='editScheme(${JSON.stringify(s).replace(/'/g, "&apos;")})'>Edit</button>
                    <button class="btn" style="padding: 5px 10px; font-size: 12px; background: #e74c3c;" onclick="deleteScheme('${s._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

async function handleSchemeSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('schemeId').value;
    const data = {
        name: document.getElementById('schemeName').value,
        description: document.getElementById('schemeDescription').value,
        url: document.getElementById('schemeUrl').value,
        is_active: document.getElementById('schemeActive').checked
    };

    let url = `${API_BASE}/schemes`;
    let method = 'POST';

    if (id) {
        url = `${API_BASE}/schemes/${id}`;
        method = 'PUT';
    }

    const res = await fetchAuth(url, {
        method: method,
        body: JSON.stringify(data)
    });
    if (!res) return;
    
    const json = await res.json();
    if (json.status === 'success') {
        alert(json.message);
        resetSchemeForm();
        fetchSchemes();
    } else {
        alert("Error: " + json.error);
    }
}

function editScheme(s) {
    document.getElementById('schemeId').value = s._id;
    document.getElementById('schemeName').value = s.name;
    document.getElementById('schemeDescription').value = s.description || '';
    document.getElementById('schemeUrl').value = s.url || '';
    document.getElementById('schemeActive').checked = s.is_active !== false;
    document.getElementById('schemeFormTitle').innerText = "Edit Scheme";
    window.scrollTo(0, document.getElementById('schemesSection').offsetTop);
}

function resetSchemeForm() {
    document.getElementById('schemeForm').reset();
    document.getElementById('schemeId').value = '';
    document.getElementById('schemeFormTitle').innerText = "Add New Scheme";
}

async function deleteScheme(id) {
    if (!confirm("Are you sure you want to delete this scheme?")) return;
    const res = await fetchAuth(`${API_BASE}/schemes/${id}`, { method: 'DELETE' });
    if (!res) return;
    const json = await res.json();
    if (json.status === 'success') {
        fetchSchemes();
    }
}

// ── Notifications ───────────────────────────────────────────────────────
async function fetchNotifications() {
    const tbody = document.getElementById('notificationsBody');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    const res = await fetchAuth(`${API_BASE}/notifications`);
    if (!res) return;
    const json = await res.json();
    
    if (json.status === 'success') {
        if (json.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No logs found.</td></tr>';
            return;
        }
        tbody.innerHTML = json.data.map(n => `
            <tr>
                <td>${new Date(n.sent_at).toLocaleString()}</td>
                <td>${n.user_id || 'Global'}</td>
                <td>${n.trigger_type}</td>
                <td>${n.status}</td>
                <td>${n.message}</td>
            </tr>
        `).join('');
    }
}

// ── Reference Data ──────────────────────────────────────────────────────
async function fetchReference(type) {
    const display = document.getElementById('referenceDataDisplay');
    display.innerHTML = "Fetching...";
    const res = await fetchAuth(`${API_BASE}/${type}-reference`);
    if (!res) return;
    const json = await res.json();
    if (json.status === 'success') {
        display.innerHTML = JSON.stringify(json.data, null, 4);
    } else {
        display.innerHTML = "Error fetching data.";
    }
}

// Init
window.onload = () => {
    switchTab('stats'); // Default tab
};
