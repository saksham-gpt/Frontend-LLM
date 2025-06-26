document.addEventListener('DOMContentLoaded', () => {
    const apiKeyModal = document.getElementById('api-key-modal');
    const saveApiKeysButton = document.getElementById('save-api-keys');
    const cerebrasApiKeyInput = document.getElementById('cerebras-api-key');
    const openrouterApiKeyInput = document.getElementById('openrouter-api-key');
    const geminiApiKeyInput = document.getElementById('gemini-api-key');

    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const modelSelect = document.getElementById('model-select');

    const historyList = document.getElementById('history-list');
    const clearHistoryButton = document.getElementById('clear-history');

    let cerebrasApiKey = localStorage.getItem('cerebrasApiKey');
    let openrouterApiKey = localStorage.getItem('openrouterApiKey');
    let geminiApiKey = localStorage.getItem('geminiApiKey');

    if (!cerebrasApiKey || !openrouterApiKey || !geminiApiKey) {
        apiKeyModal.style.display = 'flex';
    } else {
        chatContainer.style.display = 'flex';
    }

    saveApiKeysButton.addEventListener('click', () => {
        cerebrasApiKey = cerebrasApiKeyInput.value;
        openrouterApiKey = openrouterApiKeyInput.value;
        geminiApiKey = geminiApiKeyInput.value;

        if (cerebrasApiKey && openrouterApiKey && geminiApiKey) {
            localStorage.setItem('cerebrasApiKey', cerebrasApiKey);
            localStorage.setItem('openrouterApiKey', openrouterApiKey);
            localStorage.setItem('geminiApiKey', geminiApiKey);
            apiKeyModal.style.display = 'none';
            chatContainer.style.display = 'flex';
        } else {
            alert('Please enter all API keys.');
        }
    });

    const displayMessage = (sender, message) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble');
        bubble.textContent = message;
        messageElement.appendChild(bubble);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        displayMessage('user', message);
        chatInput.value = '';

        const selectedModel = modelSelect.value;
        let response;

        try {
            if (selectedModel.startsWith('gemini-')) {
                response = await callGeminiApi(message, selectedModel);
            } else if (selectedModel.includes('/')) {
                response = await callOpenRouterApi(message, selectedModel);
            } else {
                response = await callCerebrasApi(message, selectedModel);
            }
            displayMessage('ai', response);
            saveChatHistory();
        } catch (error) {
            console.error('API Error:', error);
            displayMessage('ai', 'Sorry, something went wrong. Please check the console for details.');
        }
    };

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    const callGeminiApi = async (prompt, modelName) => {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: modelName});
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    };

    const callOpenRouterApi = async (prompt, modelName) => {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openrouterApiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    };

    const callCerebrasApi = async (prompt, modelName) => {
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cerebrasApiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    };

    const saveChatHistory = () => {
        const messages = Array.from(chatMessages.children).map(messageElement => ({
            sender: messageElement.classList.contains('user') ? 'user' : 'ai',
            text: messageElement.querySelector('.message-bubble').textContent
        }));
        localStorage.setItem('chatHistory', JSON.stringify(messages));
        updateHistoryList();
    };

    const loadChatHistory = () => {
        const history = JSON.parse(localStorage.getItem('chatHistory'));
        if (history) {
            history.forEach(message => displayMessage(message.sender, message.text));
        }
        updateHistoryList();
    };

    const updateHistoryList = () => {
        historyList.innerHTML = '';
        const history = JSON.parse(localStorage.getItem('chatHistory'));
        if (history) {
            const userMessages = history.filter(m => m.sender === 'user');
            userMessages.forEach(message => {
                const li = document.createElement('li');
                li.textContent = message.text.substring(0, 20) + '...';
                li.addEventListener('click', () => {
                    // This could be enhanced to load the full conversation
                    chatInput.value = message.text;
                });
                historyList.appendChild(li);
            });
        }
    };

    clearHistoryButton.addEventListener('click', () => {
        localStorage.removeItem('chatHistory');
        chatMessages.innerHTML = '';
        historyList.innerHTML = '';
    });

    loadChatHistory();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});
