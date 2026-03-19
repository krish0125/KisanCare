document.addEventListener('DOMContentLoaded', () => {
    const chatBtn        = document.getElementById('chat-toggle-btn');
    const chatContainer  = document.getElementById('chat-container');
    const closeChatBtn   = document.getElementById('close-chat');
    const sendBtn        = document.getElementById('send-btn');
    const chatInput      = document.getElementById('chat-input');
    const messagesDiv    = document.getElementById('chat-messages');
    const fileInput      = document.getElementById('chat-file-input');
    const fileLabel      = document.querySelector('.file-upload-label');

    // ── Add header online info ──────────────────────────────────
    const header = document.querySelector('.chat-header span:first-child');
    if (header) {
        header.innerHTML = `
            <div class="chat-header-info">
                <div>
                    <div>Kisan AI Assistant</div>
                    <div class="chat-online">Online • Always ready</div>
                </div>
            </div>`;
    }

    // ── Add quick reply buttons ─────────────────────────────────
    const quickReplies = document.createElement('div');
    quickReplies.className = 'chat-quick-replies';
    quickReplies.id = 'quick-replies-bar';
    const topics = ['💧 Liquid Fertilizer', '🌾 Urea Tips', '🌿 DAP Info', '🧪 NPK Guide', '☀️ Crop Advice'];
    topics.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = t;
        btn.onclick = () => { chatInput.value = t.replace(/^[^ ]+ /, ''); sendMessage(); };
        quickReplies.appendChild(btn);
    });
    chatContainer.insertBefore(quickReplies, messagesDiv);

    // ── Date divider ────────────────────────────────────────────
    const dateDiv = document.createElement('div');
    dateDiv.className = 'chat-date-divider';
    dateDiv.textContent = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    messagesDiv.appendChild(dateDiv);

    // ── Toggle ──────────────────────────────────────────────────
    chatBtn.addEventListener('click', () => {
        chatContainer.classList.toggle('active');
        if (chatContainer.classList.contains('active')) chatInput.focus();
    });
    closeChatBtn.addEventListener('click', () => chatContainer.classList.remove('active'));

    // ── File select ─────────────────────────────────────────────
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileLabel.style.color = '#2ecc71';
            chatInput.placeholder = '📷 Image selected. Add a message...';
        }
    });

    // ── OFFLINE AI REPLIES (fertilizer / crop knowledge) ───────
    const offlineReplies = [
        {
            keys: ['liquid fertilizer', 'liquid', 'liquid fert'],
            reply: `🌊 **Liquid Fertilizers** are nutrient solutions applied directly to soil or leaves.\n\n**Advantages:**\n• Faster absorption (within 24-48 hrs)\n• Suitable for drip/sprinkler irrigation\n• Less wastage – up to 30% more efficient\n\n**Popular Liquid Fertilizers in India:**\n• IFFCO Nano Urea (Liquid)\n• IFFCO Nano DAP (Liquid)\n• Coromandel Plantex Liquid NPK\n• Deepak Fertilisers Liquid NP`
        },
        {
            keys: ['urea', 'urea tips', 'nitrogen'],
            reply: `🌾 **Urea Tips:**\n• Apply at 60-100 kg/acre for most crops\n• Split into 2-3 doses for best results\n• Always irrigate after broadcasting\n• Use Neem-coated Urea to reduce nitrogen loss by 30%\n\n**Best companies:** IFFCO, NFL, RCF, Chambal`
        },
        {
            keys: ['dap', 'dap info', 'phosphorus'],
            reply: `🌱 **DAP (Di-Ammonium Phosphate):**\n• NPK ratio: 18-46-0\n• Best as basal application before sowing\n• Apply 50-100 kg/acre\n• Do NOT mix with Urea directly\n\n**Best brands:** IFFCO DAP, Coromandel Gromor, Zuari Jai Kisaan`
        },
        {
            keys: ['npk', 'npk guide', 'complex'],
            reply: `⚡ **NPK Fertilizers:**\nContain Nitrogen (N), Phosphorus (P) and Potassium (K) in one granule.\n\n**Common ratios:**\n• 12-32-16 – for basal dose\n• 15-15-15 – balanced for all crops (RCF Suphala)\n• 10-26-26 – high PK for vegetables\n\n**Apply:** 75-150 kg/acre depending on crop`
        },
        {
            keys: ['crop advice', 'crop', 'which crop', 'plant'],
            reply: `🌿 **Crop Selection Tips:**\n• Check your Soil Health Card for NPK status\n• Rabi season: Wheat, Mustard, Gram\n• Kharif season: Paddy, Cotton, Soybean\n• Use our Crop Advisory section for detailed guidance!\n\n👉 [Go to Crop Advisory](crop.html)`
        },
        {
            keys: ['compare', 'liquid vs solid', 'which is better', 'difference'],
            reply: `⚖️ **Liquid vs Solid Fertilizers:**\n\n| Factor | Liquid | Solid |\n|---|---|---|\n| Speed | ⚡ Fast (24-48h) | 🐢 Slow (3-7 days) |\n| Cost | 💰 Higher | 💰 Lower |\n| Application | Drip/spray | Broadcast |\n| Absorption | 90%+ | 60-70% |\n| Storage | Short shelf | Long shelf |\n\n✅ **Best choice:** Liquid for horticulture & drip systems. Solid for field crops like wheat & paddy.`
        },
        {
            keys: ['hello', 'hi', 'namaste', 'good morning', 'help'],
            reply: `🌾 **Namaste! Welcome to KisanCare!**\n\nI can help you with:\n• 🧪 Fertilizer recommendations\n• 💧 Liquid vs Solid comparison\n• 🌱 Crop advice\n• ☀️ Weather guidance\n• 💰 Market price queries\n\nWhat would you like to know today?`
        },
        {
            keys: ['price', 'cost', 'rate', 'how much'],
            reply: `💰 **Fertilizer Prices (Approx 2025):**\n\n• Urea (45 kg): ₹266 (subsidized)\n• DAP (50 kg): ₹1,350\n• NPK 15-15-15 (50 kg): ₹1,380\n• MOP (50 kg): ₹850\n• Nano Urea 500ml: ₹195\n\n👉 Visit our [Fertilizer Store](fertilizer.html) for current prices!`
        }
    ];

    function getOfflineReply(text) {
        const lower = text.toLowerCase();
        for (const item of offlineReplies) {
            if (item.keys.some(k => lower.includes(k))) {
                return item.reply;
            }
        }
        return `🤔 I'm not sure about that, but try asking about:\n**Liquid Fertilizer**, **Urea Tips**, **DAP Info**, **NPK Guide**, or **Crop Advice**.\n\nOr visit our [Fertilizer Store](fertilizer.html) for product details.`;
    }

    // ── Send Message ────────────────────────────────────────────
    async function sendMessage() {
        const text = chatInput.value.trim();
        const file = fileInput.files[0];
        if (!text && !file) return;

        appendMessage('user', text, file);
        chatInput.value = '';
        fileInput.value = '';
        fileLabel.style.color = '';
        chatInput.placeholder = 'Type a message...';

        // Show typing indicator
        const typingEl = showTyping();

        // Try server first, fall back to offline AI
        const formData = new FormData();
        formData.append('message', text);
        if (file) formData.append('image', file);

        let replied = false;
        try {
            const res = await Promise.race([
                fetch('http://localhost:5001/chat', { method:'POST', body:formData }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
            ]);
            const data = await res.json();
            removeTyping(typingEl);
            appendMessage('bot', data.reply || "Sorry, I couldn't process that.");
            replied = true;
        } catch {
            // Server unavailable — use local smart replies
        }

        if (!replied) {
            setTimeout(() => {
                removeTyping(typingEl);
                appendMessage('bot', getOfflineReply(text));
            }, 900);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

    // ── Append Message ──────────────────────────────────────────
    function appendMessage(sender, text, imageFile = null) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);

        if (text) {
            const p = document.createElement('p');
            let html = text
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:inherit;text-decoration:underline;">$1</a>');

            // simple table render
            if (html.includes('|')) {
                const rows = html.split('<br>').filter(r => r.trim().startsWith('|'));
                if (rows.length >= 2) {
                    let tableHtml = '<table style="font-size:0.78rem;border-collapse:collapse;margin:6px 0;width:100%;">';
                    rows.forEach((row, i) => {
                        if (row.includes('---')) return;
                        const cells = row.split('|').filter(c => c.trim());
                        const tag = i === 0 ? 'th' : 'td';
                        const style = i === 0
                            ? 'background:#27ae60;color:white;padding:4px 8px;'
                            : 'padding:4px 8px;border-bottom:1px solid #eee;';
                        tableHtml += '<tr>' + cells.map(c => `<${tag} style="${style}">${c.trim()}</${tag}>`).join('') + '</tr>';
                    });
                    tableHtml += '</table>';
                    html = html.replace(rows.map(r => r).join('<br>'), tableHtml);
                }
            }
            p.innerHTML = html;
            msgDiv.appendChild(p);
        }

        if (imageFile) {
            const img = document.createElement('img');
            const reader = new FileReader();
            reader.onload = e => img.src = e.target.result;
            reader.readAsDataURL(imageFile);
            msgDiv.appendChild(img);
        }

        // Timestamp
        const timeEl = document.createElement('span');
        timeEl.className = 'msg-time';
        timeEl.textContent = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
        msgDiv.appendChild(timeEl);

        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // ── Typing Indicator ────────────────────────────────────────
    function showTyping() {
        const el = document.createElement('div');
        el.className = 'typing-indicator';
        el.id = 'typing-' + Date.now();
        el.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        messagesDiv.appendChild(el);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return el;
    }
    function removeTyping(el) { if (el && el.parentNode) el.remove(); }
});
