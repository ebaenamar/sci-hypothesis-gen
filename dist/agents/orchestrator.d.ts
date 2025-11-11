import type { BaseAgent } from './base.js';
import type { AgentRole, WorkflowState, GraphPath, Hypothesis } from '../types/index.js';
/**
 * Multi-agent orchestrator for hypothesis generation workflows
 */
export declare class AgentOrchestrator {
    private agents;
    private currentState?;
    constructor(agents: Map<AgentRole, BaseAgent>);
    /**
     * Sequential workflow: Ontologist → Scientist 1 → Scientist 2 → Critic
     */
    runSequentialWorkflow(graphPath: GraphPath): Promise<Hypothesis>;
    /**
     * Flexible workflow: Planner → Assistant (novelty check) → dynamic agents
     */
    runFlexibleWorkflow(keywords: string[], graphPaths: GraphPath[]): Promise<Hypothesis[]>;
    /**
     * Run ontologist agent
     */
    private runOntologist;
    /**
     * Run scientist 1 agent (initial hypothesis)
     */
    private runScientist1;
    /**
     * Run scientist 2 agent (refinement)
     */
    private runScientist2;
    /**
     * Run critic agent
     */
    private runCritic;
    /**
     * Run planner agent
     */
    private runPlanner;
    /**
     * Run assistant agent (novelty check)
     */
    private runAssistant;
    /**
     * Parse critique response into structured format
     */
    private parseCritiques;
    /**
     * Extract title from hypothesis text
     */
    private extractTitle;
    /**
     * Extract section from hypothesis text
     */
    private extractSection;
    /**
     * Extract list items from section
     */
    private extractList;
    /**
     * Calculate average critique score for an aspect
     */
    private calculateAverageScore;
    /**
     * Get current workflow state
     */
    getState(): WorkflowState | undefined;
}
//# sourceMappingURL=orchestrator.d.ts.map