import Anthropic from '@anthropic-ai/sdk';
import type { AgentConfig, AgentMessage, AgentRole } from '../types/index.js';
/**
 * Base agent class for all specialized agents
 */
export declare class BaseAgent {
    protected client: Anthropic;
    protected config: AgentConfig;
    protected conversationHistory: AgentMessage[];
    constructor(config: AgentConfig, apiKey?: string);
    /**
     * Send a message to the agent and get response
     */
    chat(userMessage: string): Promise<string>;
    /**
     * Get conversation history
     */
    getHistory(): AgentMessage[];
    /**
     * Clear conversation history (keep system prompt)
     */
    reset(): void;
    /**
     * Get agent role
     */
    getRole(): AgentRole;
    /**
     * Export conversation for analysis
     */
    exportConversation(): string;
}
/**
 * Agent factory for creating specialized agents
 */
export declare class AgentFactory {
    private apiKey?;
    constructor(apiKey?: string);
    /**
     * Create an agent instance
     */
    createAgent(config: AgentConfig): BaseAgent;
    /**
     * Create multiple agents
     */
    createAgents(configs: AgentConfig[]): Map<AgentRole, BaseAgent>;
}
//# sourceMappingURL=base.d.ts.map