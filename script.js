document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const apiKeyModal = document.getElementById('api-key-modal');
    const saveApiKeysButton = document.getElementById('save-api-keys');
    const cerebrasApiKeyInput = document.getElementById('cerebras-api-key');
    const openrouterApiKeyInput = document.getElementById('openrouter-api-key');

    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const modelSelect = document.getElementById('model-select');
    const welcomeScreen = document.getElementById('welcome-screen');

    const historyList = document.getElementById('history-list');
    const clearHistoryButton = document.getElementById('clear-history');
    const newChatButton = document.getElementById('new-chat-button');

    // --- State Management ---
    let cerebrasApiKey = localStorage.getItem('cerebrasApiKey');
    let openrouterApiKey = localStorage.getItem('openrouterApiKey');
    let currentChatId = null;
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || {};

    // --- Initialization ---
    const init = () => {
        if (!cerebrasApiKey || !openrouterApiKey) {
            apiKeyModal.style.display = 'flex';
        } else {
            loadHistoryList();
            startNewChat();
        }

        // --- Event Listeners ---
        saveApiKeysButton.addEventListener('click', saveApiKeys);
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', handleKeyPress);
        chatInput.addEventListener('input', autoResizeInput);
        clearHistoryButton.addEventListener('click', clearAllHistory);
        newChatButton.addEventListener('click', startNewChat);
        document.querySelectorAll('.prompt-card').forEach(card => {
            card.addEventListener('click', () => {
                chatInput.value = card.textContent;
                sendMessage();
            });
        });
    };

    // --- API Key Handling ---
    const saveApiKeys = () => {
        cerebrasApiKey = cerebrasApiKeyInput.value;
        openrouterApiKey = openrouterApiKeyInput.value;

        if (cerebrasApiKey && openrouterApiKey) {
            localStorage.setItem('cerebrasApiKey', cerebrasApiKey);
            localStorage.setItem('openrouterApiKey', openrouterApiKey);
            apiKeyModal.style.display = 'none';
            loadHistoryList();
            startNewChat();
        } else {
            alert('Please provide both API keys.');
        }
    };

    // --- Chat Management ---
    const startNewChat = () => {
        currentChatId = `chat_${Date.now()}`;
        chatMessages.innerHTML = ''; // Clear messages
        chatMessages.appendChild(welcomeScreen); // Show welcome screen
        welcomeScreen.style.display = 'flex';
        chatInput.value = '';
    };

    const sendMessage = async () => {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        welcomeScreen.style.display = 'none';
        displayMessage('user', messageText);
        chatInput.value = '';
        autoResizeInput();

        // Save user message to history
        if (!chatHistory[currentChatId]) {
            chatHistory[currentChatId] = [];
        }
        chatHistory[currentChatId].push({ role: 'user', content: messageText });

        const aiMessageElement = displayMessage('ai', '');
        const aiMessageContent = aiMessageElement.querySelector('.message-text');

        try {
            const selectedModel = modelSelect.value;
            const provider = selectedModel.includes('/') ? 'openrouter' : 'cerebras';
            const apiKey = provider === 'openrouter' ? openrouterApiKey : cerebrasApiKey;
            const url = provider === 'openrouter' 
                ? 'https://openrouter.ai/api/v1/chat/completions' 
                : 'https://api.cerebras.ai/v1/chat/completions';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: chatHistory[currentChatId], // Send conversation history
                    stream: true,
                }),
            });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        if (jsonStr === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(jsonStr);
                            const delta = parsed.choices[0]?.delta?.content || '';
                            fullResponse += delta;
                            aiMessageContent.innerHTML = marked.parse(fullResponse);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        } catch (e) {
                            console.error('Error parsing stream chunk:', e);
                        }
                    }
                }
            }
            
            // Save full AI response to history
            chatHistory[currentChatId].push({ role: 'assistant', content: fullResponse });
            saveChatHistory();

        } catch (error) {
            console.error('API Error:', error);
            aiMessageContent.innerHTML = `<p style="color: #ff4d4d;">Error: ${error.message}</p>`;
        }
    };

    // --- UI & Display ---
    const displayMessage = (sender, text) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${sender}`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const icon = document.createElement('div');
        icon.className = `message-icon ${sender}-icon`;
        icon.textContent = sender === 'user' ? 'You' : 'AI';

        const textElement = document.createElement('div');
        textElement.className = 'message-text';
        textElement.innerHTML = marked.parse(text);

        messageContent.appendChild(icon);
        messageContent.appendChild(textElement);
        messageWrapper.appendChild(messageContent);
        chatMessages.appendChild(messageWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return messageWrapper;
    };

    const autoResizeInput = () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = `${chatInput.scrollHeight}px`;
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // --- History Management ---
    const saveChatHistory = () => {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        loadHistoryList(); // Refresh the list
    };

    const loadHistoryList = () => {
        historyList.innerHTML = '';
        Object.keys(chatHistory).sort().reverse().forEach(chatId => {
            const firstUserMessage = chatHistory[chatId].find(m => m.role === 'user');
            if (firstUserMessage) {
                const li = document.createElement('li');
                li.textContent = firstUserMessage.content.substring(0, 25) + '...';
                li.dataset.chatId = chatId;
                li.addEventListener('click', () => loadChat(chatId));
                historyList.appendChild(li);
            }
        });
    };

    const loadChat = (chatId) => {
        currentChatId = chatId;
        welcomeScreen.style.display = 'none';
        chatMessages.innerHTML = '';
        chatHistory[chatId].forEach(message => {
            displayMessage(message.role === 'user' ? 'user' : 'ai', message.content);
        });
    };

    const clearAllHistory = () => {
        if (confirm('Are you sure you want to delete all chat history?')) {
            chatHistory = {};
            localStorage.removeItem('chatHistory');
            historyList.innerHTML = '';
            startNewChat();
        }
    };

    // --- Start the App ---
    init();
});
