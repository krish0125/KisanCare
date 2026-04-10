document.addEventListener('DOMContentLoaded', () => {
    const chatBtn        = document.getElementById('chat-toggle-btn');
    const chatContainer  = document.getElementById('chat-container');
    const closeChatBtn   = document.getElementById('close-chat');
    const sendBtn        = document.getElementById('send-btn');
    const chatInput      = document.getElementById('chat-input');
    const messagesDiv    = document.getElementById('chat-messages');
    const fileInput      = document.getElementById('chat-file-input');
    const fileLabel      = document.querySelector('.file-upload-label');
    const voiceBtn       = document.getElementById('voice-btn');
    const langSelect     = document.getElementById('chat-lang-select');

    // ── Add header online info ──────────────────────────────────
    const header = document.querySelector('.chat-header span:first-child');
    if (header) {
        header.innerHTML = `
            <div class="chat-header-info">
                <div>
                    <div>Kisan AI Assistant</div>
                    <div class="chat-online">🤖 Powered by Gemini AI</div>
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

    // ══════════════════════════════════════════════════════════════
    //  LANGUAGE SUPPORT
    // ══════════════════════════════════════════════════════════════

    // Language → BCP-47 tag map for Speech API
    const langCodeMap = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'gu': 'gu-IN',
        'mr': 'mr-IN',
        'pa': 'pa-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'bn': 'bn-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'or': 'or-IN',
        'ur': 'ur-IN'
    };

    // Language → display name for UI messages
    const langNames = {
        'en': 'English', 'hi': 'हिन्दी', 'gu': 'ગુજરાતી', 'mr': 'मराठी',
        'pa': 'ਪੰਜਾਬੀ', 'ta': 'தமிழ்', 'te': 'తెలుగు', 'bn': 'বাংলা',
        'kn': 'ಕನ್ನಡ', 'ml': 'മലയാളം', 'or': 'ଓଡ଼ିଆ', 'ur': 'اردو'
    };

    function getSelectedLang() {
        return langSelect ? langSelect.value : 'en';
    }

    // ── Simple offline fallback (for when server is completely down) ──
    const offlineFallback = {
        'en': '🤖 I\'m currently offline. Please check your internet or start the backend server.\n\nI can help with: **Crops**, **Fertilizers**, **Weather**, **Market Prices**, and more!\n\nTry reloading the page.',
        'hi': '🤖 मैं अभी ऑफ़लाइन हूँ। कृपया अपना इंटरनेट जांचें या बैकेंड सर्वर शुरू करें।\n\nमैं मदद कर सकता हूँ: **फसल**, **खाद**, **मौसम**, **बाज़ार भाव** और भी बहुत कुछ!',
        'gu': '🤖 હું હાલમાં ઑફલાઇન છું. કૃપા કરીને તમારું ઇન્ટરનેટ ચકાસો અથવા બેકેન્ડ સર્વર શરૂ કરો.\n\nહું મદદ કરી શકું: **પાક**, **ખાતર**, **હવામાન**, **બજાર ભાવ** અને ઘણું બધું!',
        'mr': '🤖 मी सध्या ऑफलाइन आहे. कृपया तुमचे इंटरनेट तपासा किंवा बॅकएंड सर्व्हर सुरू करा.\n\nमी मदत करू शकतो: **पीक**, **खत**, **हवामान**, **बाजार भाव** आणि बरेच काही!',
        'pa': '🤖 ਮੈਂ ਹੁਣ ਔਫਲਾਈਨ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਇੰਟਰਨੈੱਟ ਚੈੱਕ ਕਰੋ ਜਾਂ ਬੈਕਐਂਡ ਸਰਵਰ ਸ਼ੁਰੂ ਕਰੋ।',
        'ta': '🤖 நான் தற்போது ஆஃப்லைனில் இருக்கிறேன். தயவுசெய்து இணைய இணைப்பை சரிபார்க்கவும்.',
        'te': '🤖 నేను ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉన్నాను. దయచేసి మీ ఇంటర్నెట్ తనిఖీ చేయండి.',
        'bn': '🤖 আমি এখন অফলাইনে আছি। দয়া করে আপনার ইন্টারনেট পরীক্ষা করুন।',
        'kn': '🤖 ನಾನು ಪ್ರಸ್ತುತ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ.',
        'ml': '🤖 ഞാൻ ഇപ്പോൾ ഓഫ്‌ലൈനാണ്. ദയവായി നിങ്ങളുടെ ഇന്റർനെറ്റ് പരിശോധിക്കുക.',
        'or': '🤖 ମୁଁ ବର୍ତ୍ତମାନ ଅଫଲାଇନ ଅଛି। ଦୟାକରି ଆପଣଙ୍କ ଇଣ୍ଟରନେଟ ଯାଞ୍ଚ କରନ୍ତୁ।',
        'ur': '🤖 میں ابھی آف لائن ہوں۔ براہ کرم اپنا انٹرنیٹ چیک کریں۔'
    };

    // ══════════════════════════════════════════════════════════════
    //  VOICE INPUT — Speech-to-Text (Web Speech API)
    // ══════════════════════════════════════════════════════════════

    let recognition = null;
    let isRecording = false;

    // Create voice status tooltip
    const voiceStatus = document.createElement('div');
    voiceStatus.className = 'voice-status';
    voiceStatus.textContent = '🎤 Listening...';
    if (voiceBtn) voiceBtn.appendChild(voiceStatus);

    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('⚠️ Voice input is not supported in this browser. Please use Chrome or Edge.');
            return null;
        }

        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        // Set language based on dropdown
        const lang = getSelectedLang();
        rec.lang = langCodeMap[lang] || 'en-IN';

        rec.onstart = () => {
            isRecording = true;
            if (voiceBtn) {
                voiceBtn.classList.add('recording');
                voiceStatus.classList.add('visible');

                const langLabels = {
                    'en': '🎤 Listening...', 'hi': '🎤 सुन रहा हूँ...',
                    'gu': '🎤 સાંભળી રહ્યો છું...', 'mr': '🎤 ऐकत आहे...',
                    'pa': '🎤 ਸੁਣ ਰਿਹਾ ਹਾਂ...', 'ta': '🎤 கேட்கிறேன்...',
                    'te': '🎤 వింటున్నాను...', 'bn': '🎤 শুনছি...',
                    'kn': '🎤 ಕೇಳುತ್ತಿದ್ದೇನೆ...', 'ml': '🎤 കേൾക്കുന്നു...',
                    'or': '🎤 ଶୁଣୁଛି...', 'ur': '🎤 سن رہا ہوں...'
                };
                voiceStatus.textContent = langLabels[lang] || '🎤 Listening...';
            }
        };

        rec.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            chatInput.value = transcript;
        };

        rec.onend = () => {
            isRecording = false;
            if (voiceBtn) {
                voiceBtn.classList.remove('recording');
                voiceStatus.classList.remove('visible');
            }
            // Auto-send if there's text
            if (chatInput.value.trim()) {
                sendMessage();
            }
        };

        rec.onerror = (event) => {
            isRecording = false;
            if (voiceBtn) {
                voiceBtn.classList.remove('recording');
                voiceStatus.classList.remove('visible');
            }
            if (event.error === 'no-speech') {
                // Silent fail
            } else if (event.error === 'not-allowed') {
                alert('🎤 Microphone access denied. Please allow microphone permissions in your browser settings.');
            } else {
                console.warn('Speech recognition error:', event.error);
            }
        };

        return rec;
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (isRecording && recognition) {
                recognition.stop();
                return;
            }

            recognition = initSpeechRecognition();
            if (recognition) {
                try {
                    recognition.start();
                } catch (e) {
                    console.warn('Speech recognition start error:', e);
                }
            }
        });
    }

    // ══════════════════════════════════════════════════════════════
    //  TEXT-TO-SPEECH — Read Bot Replies Aloud
    // ══════════════════════════════════════════════════════════════

    function speakText(text, button) {
        // If already speaking, stop
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            document.querySelectorAll('.msg-speak-btn.speaking').forEach(b => b.classList.remove('speaking'));
            return;
        }

        // Strip markdown and HTML for cleaner speech
        let cleanText = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[|]/g, ' ')
            .replace(/[-]{3,}/g, '')
            .replace(/[#•⚡🌊🌾🌱🌿⚖️💰🤔✅👉🤖☀️🧪💧🏛️🔔💸☂️💳🚜💦🏦🎉🐛🍅🍚☁️🥔🧅]/g, '')
            .replace(/\n+/g, '. ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const lang = getSelectedLang();
        utterance.lang = langCodeMap[lang] || 'en-IN';
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        if (button) button.classList.add('speaking');

        utterance.onend = () => {
            if (button) button.classList.remove('speaking');
        };
        utterance.onerror = () => {
            if (button) button.classList.remove('speaking');
        };

        window.speechSynthesis.speak(utterance);
    }

    // ══════════════════════════════════════════════════════════════
    //  SEND MESSAGE — Gemini AI via Backend
    // ══════════════════════════════════════════════════════════════

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

        // Build request
        const formData = new FormData();
        formData.append('message', text);
        formData.append('language', getSelectedLang());
        if (file) formData.append('image', file);

        try {
            const res = await Promise.race([
                fetch('http://localhost:5001/chat', { method: 'POST', body: formData }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))
            ]);
            const data = await res.json();
            removeTyping(typingEl);

            if (data.reply) {
                appendMessage('bot', data.reply);
            } else if (data.error) {
                appendMessage('bot', `⚠️ ${data.error}`);
            } else {
                appendMessage('bot', "Sorry, I couldn't process that.");
            }
        } catch (err) {
            removeTyping(typingEl);
            console.warn('Chat fetch error:', err);
            const lang = getSelectedLang();
            appendMessage('bot', offlineFallback[lang] || offlineFallback['en']);
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

        // ── 🔊 Speak Button for bot messages ────────────────────
        if (sender === 'bot' && text) {
            const speakBtn = document.createElement('button');
            speakBtn.className = 'msg-speak-btn';
            speakBtn.title = 'Listen to this message';
            speakBtn.innerHTML = '<span class="material-icons">volume_up</span> Listen';
            speakBtn.addEventListener('click', () => speakText(text, speakBtn));
            msgDiv.appendChild(speakBtn);
        }

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
