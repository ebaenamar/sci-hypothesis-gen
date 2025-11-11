import type { Paper, DataSource, NoveltyResult } from '../types/index.js';
/**
 * External data retrieval service for scientific papers
 * Now with Healthcare MCP integration for improved reliability
 */
export declare class DataRetrieval {
    private clients;
    private queues;
    private mcpClient?;
    private mcpAvailable;
    constructor(dataSources: DataSource[]);
    /**
     * Initialize Healthcare MCP client (lazy initialization)
     */
    private initHealthcareMCP;
    /**
     * Convert Healthcare MCP PubMed results to Paper format
     */
    private convertMCPToPaper;
    /**
     * Search Semantic Scholar for papers
     */
    searchSemanticScholar(query: string, limit?: number): Promise<Paper[]>;
    /**
     * Search PubMed for papers
     * Now uses Healthcare MCP if available for better reliability
     */
    searchPubMed(query: string, limit?: number): Promise<Paper[]>;
    /**
     * Search arXiv for papers
     */
    searchArXiv(query: string, limit?: number): Promise<Paper[]>;
    /**
     * Search across all sources
     * Uses Healthcare MCP comprehensive search when available
     */
    searchAll(query: string, limit?: number): Promise<Paper[]>;
    /**
     * Deduplicate papers by title similarity
     */
    private deduplicatePapers;
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