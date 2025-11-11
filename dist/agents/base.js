import Anthropic from '@anthropic-ai/sdk';
/**
 * Base agent class for all specialized agents
 */
export class BaseAgent {
    client;
    config;
    conversationHistory;
    constructor(config, apiKey) {
        this.config = config;
        this.client = new Anthropic({
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        });
        this.conversationHistory = [];
        // Add system prompt to history
        this.conversationHistory.push({
            role: 'system',
            content: config.systemPrompt,
            agentRole: config.role,
            timestamp: new Date(),
        });
    }
    /**
     * Send a message to the agent and get response
     */
    async chat(userMessage) {
        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        });
        try {
            // Convert to Anthropic format
            const messages = this.conversationHistory
                .filter(m => m.role !== 'system')
                .map(m => ({
                role: m.role,
                content: m.content,
            }));
            const response = await this.client.messages.create({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                system: this.config.systemPrompt,
                messages,
            });
            const contentBlock = response.content[0];
            if (contentBlock.type !== 'text') {
                throw new Error('Unexpected response type from API');
            }
            const assistantMessage = contentBlock.text;
            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage,
                agentRole: this.config.role,
                timestamp: new Date(),
            });
            return assistantMessage;
        }
        catch (error) {
            console.error(`Error in ${this.config.role} agent:`, error);
            throw error;
        }
    }
    /**
     * Get conversation history
     */
    getHistory() {
        return [...this.conversationHistory];
    }
    /**
     * Clear conversation history (keep system prompt)
     */
    reset() {
        const systemPrompt = this.conversationHistory[0];
        this.conversationHistory = [systemPrompt];
    }
    /**
     * Get agent role
     */
    getRole() {
        return this.config.role;
    }
    /**
     * Export conversation for analysis
     */
    exportConversation() {
        return this.conversationHistory
            .map(msg => {
            const timestamp = msg.timestamp.toISOString();
            const role = msg.agentRole || msg.role;
            return `[${timestamp}] ${role}:\n${msg.content}\n`;
        })
            .join('\n---\n\n');
    }
}
/**
 * Agent factory for creating specialized agents
 */
export class AgentFactory {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    /**
     * Create an agent instance
     */
    createAgent(config) {
        return new BaseAgent(config, this.apiKey);
    }
    /**
     * Create multiple agents
     */
    createAgents(configs) {
        const agents = new Map();
        configs.forEach(config => {
            agents.set(config.role, this.createAgent(config));
        });
        return agents;
    }
}
//# sourceMappingURL=base.js.map