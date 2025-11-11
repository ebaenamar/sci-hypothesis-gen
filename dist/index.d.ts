#!/usr/bin/env node
import 'dotenv/config';
import type { Hypothesis } from './types/index.js';
/**
 * Main application class for scientific hypothesis generation
 */
export declare class SciHypothesisAgent {
    private graphBuilder;
    private graphReasoner?;
    private agentFactory;
    private orchestrator?;
    private dataRetrieval;
    private config;
    constructor();
    /**
     * Initialize the system with dataset
     */
    initialize(csvPath: string): Promise<void>;
    /**
     * Generate hypothesis using sequential workflow
     */
    generateHypothesis(keywords: string[]): Promise<Hypothesis>;
    /**
     * Generate multiple hypotheses using flexible workflow
     */
    generateMultipleHypotheses(keywords: string[], count?: number): Promise<Hypothesis[]>;
    /**
     * Explore concept relationships
     */
    exploreConcepts(keywords: string[]): void;
    /**
     * Find bridge concepts for interdisciplinary research
     */
    findBridgeConcepts(topN?: number): void;
    /**
     * Export hypothesis to file
     */
    exportHypothesis(hypothesis: Hypothesis, outputDir?: string): Promise<string>;
    /**
     * Format hypothesis as markdown
     */
    private formatHypothesisMarkdown;
}
export default SciHypothesisAgent;
//# sourceMappingURL=index.d.ts.map