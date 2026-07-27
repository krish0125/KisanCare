document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const listContainer = document.getElementById('notificationList');
    
    try {
        const res = await authFetch('http://localhost:5001/api/notifications');
        const data = await res.json();
        
        if (data.status === 'success') {
            renderNotifications(data.data);
        } else {
            listContainer.innerHTML = '<div class="empty-state"><span class="material-icons">error</span><p>Failed to load notifications.</p></div>';
        }
    } catch (err) {
        console.error(err);
        listContainer.innerHTML = '<div class="empty-state"><span class="material-icons">cloud_off</span><p>Error connecting to server.</p></div>';
    }
    
    function renderNotifications(notifications) {
        if (!notifications || notifications.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">notifications_none</span>
                    <p>No notifications yet.</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = '';
        
        notifications.forEach(notif => {
            const card = document.createElement('div');
            card.className = 'notification-card';
            
            if (notif.status.includes('error') || notif.status.includes('not_sent')) {
                card.classList.add('error');
            }
            
            const dateStr = new Date(notif.sent_at).toLocaleString();
            
            card.innerHTML = `
                <div class="notif-header">
                    <span class="notif-title">${formatTriggerType(notif.trigger_type)}</span>
                    <span class="notif-date">${dateStr}</span>
                </div>
                <div class="notif-body">${notif.message}</div>
                <div style="margin-top: 10px; font-size: 0.8rem; color: #95a5a6; display: flex; justify-content: space-between;">
                    <span>Channel: ${notif.channel.toUpperCase()}</span>
                    <span>Status: ${notif.status}</span>
                </div>
            `;
            
            listContainer.appendChild(card);
        });
    }
    
    function formatTriggerType(type) {
        const map = {
            'weather_alert': '️ Weather Alert',
            'pest_alert': '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>pest_control</span> Pest Warning',
            'scheme_deadline': '️ Scheme Deadline',
            'market_alert': '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>trending_up</span> Market Update'
        };
        return map[type] || type;
    }
});
