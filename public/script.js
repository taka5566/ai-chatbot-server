// public/script.js

let conversationHistory = [];
let isProcessing = false;

const personalityDescriptions = {
    jackson: 'Jackson: Your portfolio AI assistant representing Jackson the Analyst Programmer',
    claude: 'Claude 3.5 Sonnet: Professional and thoughtful AI',
    friendly: 'Friendly Assistant: Warm and encouraging AI',
    professional: 'Professional Assistant: Formal and precise AI',
    creative: 'Creative Assistant: Imaginative and playful AI'
};

const languageNames = {
    en: 'English',
    zh: '中文',
    ja: '日本語',
};

function updatePersonalityInfo() {
    const personality = document.getElementById('personality').value;
    const language = document.getElementById('language').value;
    const infoDiv = document.getElementById('personality-info');
    infoDiv.innerHTML = `<strong>${personalityDescriptions[personality].split(':')[0]}</strong>: ${personalityDescriptions[personality].split(':')[1]} | Language: ${languageNames[language]}`;
}

function addMessage(text, isUser, aiName = '') {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : aiName === 'System' ? 'system' : 'ai'}`;
    
    if (!isUser && aiName && aiName !== 'System') {
        messageDiv.innerHTML = `
            <div class="ai-name">${aiName}</div>
            <div>${formatMessage(text)}</div>
        `;
    } else {
        messageDiv.innerHTML = formatMessage(text);
    }
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function formatMessage(text) {
    // Basic markdown-like formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function hideTypingIndicator() {
    const typingDiv = document.getElementById('typing');
    if (typingDiv) {
        typingDiv.remove();
    }
}

function setProcessing(processing) {
    isProcessing = processing;
    const button = document.querySelector('.chat-input button');
    const input = document.getElementById('message-input');
    
    button.disabled = processing;
    input.disabled = processing;
    button.textContent = processing ? 'Sending...' : 'Send';
}

async function sendMessage() {
    if (isProcessing) return;
    
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    const personality = document.getElementById('personality').value;
    const language = document.getElementById('language').value;
    
    addMessage(message, true);
    input.value = '';
    
    setProcessing(true);
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/chat.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                personality,
                language,  // Send selected language
                conversationHistory
            })
        });
        
        const data = await response.json();
        
        hideTypingIndicator();
        
        if (data.success) {
            addMessage(data.response, false, data.aiName);
            
            conversationHistory.push({
                role: 'user',
                content: message
            });
            
            conversationHistory.push({
                role: 'assistant',
                content: data.response
            });
            
            // Keep only last 10 messages to avoid token limits
            if (conversationHistory.length > 20) {
                conversationHistory = conversationHistory.slice(-20);
            }
        } else {
            addMessage(`Error: ${data.error}`, false, 'System');
        }
        
    } catch (error) {
        hideTypingIndicator();
        addMessage(`Connection error: ${error.message}. Please check your internet connection and API key.`, false, 'System');
    } finally {
        setProcessing(false);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !isProcessing) {
        sendMessage();
    }
}

function clearChat() {
    conversationHistory = [];
    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.innerHTML = '';
    addMessage('Chat cleared! Start a new conversation.', false, 'System');
}

// Event listeners
document.getElementById('personality').addEventListener('change', function() {
    updatePersonalityInfo();
    clearChat();
});

document.getElementById('language').addEventListener('change', function() {
    updatePersonalityInfo();
    clearChat();
});

// Add welcome message on load
window.onload = () => {
    updatePersonalityInfo();
    addMessage('👋 Hello! I\'m your AI assistant. Choose a personality and language above and start chatting! Try "Jackson" to learn about my portfolio.', false, 'System');
};