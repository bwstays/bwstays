class StaticMCPClient {
    constructor(baseUrl = './') {
        this.baseUrl = baseUrl;
        this.manifest = null;
    }
    async init() {
        try {
            const response = await fetch(`${this.baseUrl}/mcp.json`);
            this.manifest = await response.json();
            return true;
        } catch (error) {
            return false;
        }
    }
    async getResource(uri) {
        try {
            const resourceName = uri.replace('resource://', '');
            const response = await fetch(`${this.baseUrl}/resources/${resourceName}.json`);
            const data = await response.json();
            return data.contents[0].text;
        } catch (error) {
            return 'Sorry, I couldn\'t find that information.';
        }
    }
    async callTool(name, args) {
        try {
            if (name === 'search') {
                const query = args.query.toLowerCase();
                let searchType = 'attractions';
                if (query.includes('attractions')) searchType = 'attractions';
                if (query.includes('about') || query.includes('me')) searchType = 'about';
                const response = await fetch(`${this.baseUrl}/tools/search/${searchType}.json`);
                const data = await response.json();
                return data.content[0].text;
            }
        } catch (error) {
            return 'Sorry, I encountered an error processing your request.';
        }
    }
    listResources() {
        return this.manifest?.resources || [];
    }
    listTools() {
        return this.manifest?.tools || [];
    }
}
class GitHubPagesChatbot {
    constructor() {
        this.mcpClient = new StaticMCPClient();
        this.chatContainer = null;
        this.inputField = null;
    }
    async init() {
        await this.mcpClient.init();
        this.setupUI();
        this.addMessage('Hello! I\'m your personal AI assistant. Ask me about attractionss, background, or search for information.', 'bot');
    }
    setupUI() {
        this.chatContainer = document.getElementById('chat-messages');
        this.inputField = document.getElementById('chat-input');
        document.getElementById('send-button').addEventListener('click', () => {
            this.handleUserInput();
        });
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserInput();
            }
        });
    }
    async handleUserInput() {
        const userInput = this.inputField.value.trim();
        if (!userInput) return;
        this.addMessage(userInput, 'user');
        this.inputField.value = '';
        const lowerInput = userInput.toLowerCase();
        let response = '';
        if (lowerInput.includes('about') || lowerInput.includes('who are you')) {
            response = await this.mcpClient.getResource('resource://about');
        } else if (lowerInput.includes('attractions')) {
            response = await this.mcpClient.getResource('resource://attractions');
        } else {
            response = await this.mcpClient.callTool('search', { query: userInput });
        }
        this.addMessage(response, 'bot');
    }
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    const chatbot = new GitHubPagesChatbot();
    await chatbot.init();
});
