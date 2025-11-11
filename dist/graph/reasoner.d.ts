import Graph from 'graphology';
import type { ConceptNode, GraphPath, SearchParams } from '../types/index.js';
/**
 * Graph reasoning engine for scientific discovery
 * Implements path sampling, community detection, and novelty assessment
 */
export declare class GraphReasoner {
    private graph;
    private communities?;
    private centrality?;
    constructor(graph: Graph);
    /**
     * Analyze graph structure and compute metrics
     */
    analyzeGraph(): void;
    /**
     * Find paths between concepts with various strategies
     */
    findPaths(sourceId: string, targetId?: string, params?: SearchParams): GraphPath[];
    /**
     * Sample diverse paths using random walks with constraints
     */
    private sampleDiversePaths;
    /**
     * Random walk through graph with biased selection
     */
    private randomWalk;
    /**
     * Select next node with preference for cross-community jumps
     */
    private selectNextNode;
    /**
     * Construct GraphPath object from node IDs
     */
    private constructGraphPath;
    /**
     * Calculate novelty score based on path characteristics
     */
    private calculateNoveltyScore;
    /**
     * Find most central concepts (potential research hubs)
     */
    findBridgeConcepts(topN?: number): ConceptNode[];
    /**
     * Find concepts by keyword search
     */
    searchConcepts(keywords: string[]): ConceptNode[];
    /**
     * Get community information for a concept
     */
    getCommunity(conceptId: string): number | undefined;
    /**
     * Get concepts in the same community
     */
    getCommunityConcepts(communityId: number, limit?: number): ConceptNode[];
    /**
     * Generate path summary for hypothesis context
     */
    summarizePath(path: GraphPath): string;
}
//# sourceMappingURL=reasoner.d.ts.map