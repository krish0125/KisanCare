document.addEventListener('DOMContentLoaded', () => {
    const chatBtn = document.getElementById('chat-toggle-btn');
    const chatContainer = document.getElementById('chat-container');
    const closeChatBtn = document.getElementById('close-chat');
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');
    const fileInput = document.getElementById('chat-file-input');
    const fileLabel = document.querySelector('.file-upload-label');

    // Toggle Chat
    chatBtn.addEventListener('click', () => {
        chatContainer.classList.toggle('active');
        if (chatContainer.classList.contains('active')) {
            chatInput.focus();
        }
    });

    closeChatBtn.addEventListener('click', () => {
        chatContainer.classList.remove('active');
    });

    // Handle File Selection (Visual Feedback)
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileLabel.style.color = '#2ecc71'; // Green to indicate selection
            chatInput.placeholder = "Image selected. Type a message...";
        }
    });

    // Send Message
    async function sendMessage() {
        const text = chatInput.value.trim();
        const file = fileInput.files[0];

        if (!text && !file) return;

        // Display User Message
        appendMessage('user', text, file);

        // Clear Inputs
        chatInput.value = '';
        fileInput.value = '';
        fileLabel.style.color = '#777';
        chatInput.placeholder = "Type your question...";

        // Show Typing Indicator
        const loadingId = appendMessage('bot', 'Analyzing...', null, true);

        // Prepare Data
        const formData = new FormData();
        formData.append('message', text);
        if (file) {
            formData.append('image', file);
        }

        try {
            const response = await fetch('http://localhost:5001/chat', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            // Remove Loading
            removeMessage(loadingId);

            // Display Bot Response
            if (data.reply) {
                appendMessage('bot', data.reply);
            } else {
                appendMessage('bot', "Sorry, I couldn't process that.");
            }

        } catch (error) {
            console.error('Chat Error:', error);
            removeMessage(loadingId);
            appendMessage('bot', "Server error. Please try again later.");
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Helper: Append Message
    function appendMessage(sender, text, imageFile = null, isLoading = false) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        if (isLoading) msgDiv.id = 'loading-msg-' + Date.now();

        // Text
        if (text) {
            const p = document.createElement('p');
            // Basic Markdown Formatting for Chat
            let formattedText = text
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic support

            p.innerHTML = formattedText;
            msgDiv.appendChild(p);
        }

        // Image Preview (for user)
        if (imageFile) {
            const img = document.createElement('img');
            const reader = new FileReader();
            reader.onload = (e) => img.src = e.target.result;
            reader.readAsDataURL(imageFile);
            msgDiv.appendChild(img);
        }

        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        return msgDiv.id;
    }

    function removeMessage(id) {
        if (!id) return;
        const msg = document.getElementById(id);
        if (msg) msg.remove();
    }
});
