import Graph from 'graphology';
import type { Paper, ConceptNode, ConceptEdge, KnowledgeGraph } from '../types/index.js';
/**
 * Knowledge graph builder from scientific literature
 */
export declare class GraphBuilder {
    private graph;
    private papers;
    constructor();
    /**
     * Load papers from CSV dataset
     */
    loadPapersFromCSV(filePath: string): Promise<Paper[]>;
    /**
     * Extract concepts from papers using NLP patterns
     */
    extractConcepts(papers: Paper[]): Map<string, ConceptNode>;
    /**
     * Identify scientific concepts from text
     * This uses pattern matching - can be enhanced with NER models
     */
    private identifyConcepts;
    /**
     * Classify concept type based on context
     */
    private classifyConceptType;
    /**
     * Build concept co-occurrence relationships
     */
    buildRelationships(concepts: Map<string, ConceptNode>): ConceptEdge[];
    /**
     * Build the complete knowledge graph
     */
    buildGraph(csvPath: string): Promise<KnowledgeGraph>;
    /**
     * Get the graphology instance for analysis
     */
    getGraph(): Graph;
    /**
     * Helper: parse author list
     */
    private parseAuthors;
    /**
     * Helper: parse keywords
     */
    private parseKeywords;
    /**
     * Helper: normalize concept ID
     */
    private normalizeConceptId;
}
//# sourceMappingURL=builder.d.ts.map