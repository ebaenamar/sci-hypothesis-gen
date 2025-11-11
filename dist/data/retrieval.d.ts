import type { Paper, DataSource, NoveltyResult } from '../types/index.js';
/**
 * External data retrieval service for scientific papers
 */
export declare class DataRetrieval {
    private clients;
    private queues;
    constructor(dataSources: DataSource[]);
    /**
     * Search Semantic Scholar for papers
     */
    searchSemanticScholar(query: string, limit?: number): Promise<Paper[]>;
    /**
     * Search PubMed for papers
     */
    searchPubMed(query: string, limit?: number): Promise<Paper[]>;
    /**
     * Search arXiv for papers
     */
    searchArXiv(query: string, limit?: number): Promise<Paper[]>;
    /**
     * Search across all sources
     */
    searchAll(query: string, limit?: number): Promise<Paper[]>;
    /**
     * Check novelty of hypothesis against existing literature
     */
    checkNovelty(hypothesisTitle: string, hypothesisSummary: string): Promise<NoveltyResult>;
    /**
     * Simple text similarity using Jaccard index
     */
    private calculateTextSimilarity;
    /**
     * Retrieve papers by DOIs
     */
    getPapersByDOIs(dois: string[]): Promise<Paper[]>;
}
//# sourceMappingURL=retrieval.d.ts.map