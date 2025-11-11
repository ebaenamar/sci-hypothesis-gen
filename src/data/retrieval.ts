import axios, { AxiosInstance } from 'axios';
import PQueue from 'p-queue';
import type { Paper, DataSource, NoveltyResult } from '../types/index.js';
import { HealthcareMCPClient, type PubMedResult } from './healthcare-mcp-client.js';

/**
 * External data retrieval service for scientific papers
 * Now with Healthcare MCP integration for improved reliability
 */
export class DataRetrieval {
  private clients: Map<string, AxiosInstance>;
  private queues: Map<string, PQueue>;
  private mcpClient?: HealthcareMCPClient;
  private mcpAvailable: boolean = false;

  constructor(dataSources: DataSource[]) {
    this.clients = new Map();
    this.queues = new Map();
    
    // Try to initialize Healthcare MCP client
    this.initHealthcareMCP();

    for (const source of dataSources) {
      // Create axios client
      const client = axios.create({
        baseURL: source.baseUrl,
        timeout: 30000,
        headers: source.apiKey
          ? { 'x-api-key': source.apiKey }
          : {},
      });

      this.clients.set(source.name, client);

      // Create rate-limited queue
      const queue = new PQueue({
        interval: source.name === 'pubmed' ? 1000 : 60000, // 1s for pubmed, 1min for others
        intervalCap: source.rateLimit,
      });

      this.queues.set(source.name, queue);
    }
  }

  /**
   * Initialize Healthcare MCP client
   */
  private async initHealthcareMCP(): Promise<void> {
    try {
      // Try to connect to local MCP server
      this.mcpClient = new HealthcareMCPClient('http://localhost:3000');
      this.mcpAvailable = await this.mcpClient.healthCheck();
      
      if (this.mcpAvailable) {
        console.log('✅ Healthcare MCP Server connected - using enhanced retrieval');
      } else {
        console.log('⚠️  Healthcare MCP Server not available - using fallback APIs');
      }
    } catch (error) {
      console.log('⚠️  Healthcare MCP initialization failed - using fallback APIs');
      this.mcpAvailable = false;
    }
  }

  /**
   * Convert Healthcare MCP PubMed results to Paper format
   */
  private convertMCPToPaper(mcpResult: PubMedResult): Paper {
    return {
      id: mcpResult.pmid,
      title: mcpResult.title,
      abstract: mcpResult.abstract,
      authors: mcpResult.authors || [],
      year: mcpResult.year || 0,
      pmid: mcpResult.pmid,
      journal: mcpResult.journal,
      doi: mcpResult.doi,
    };
  }

  /**
   * Search Semantic Scholar for papers
   */
  async searchSemanticScholar(query: string, limit: number = 10): Promise<Paper[]> {
    const client = this.clients.get('semantic_scholar');
    const queue = this.queues.get('semantic_scholar');
    if (!client || !queue) return [];

    try {
      const response = await queue.add(async () =>
        client.get('/paper/search', {
          params: {
            query,
            limit,
            fields: 'paperId,title,abstract,authors,year,citationCount,doi',
          },
        })
      );

      const papers: Paper[] = response?.data?.data?.map((item: any) => ({
        id: item.paperId,
        title: item.title,
        abstract: item.abstract || '',
        authors: item.authors?.map((a: any) => a.name) || [],
        year: item.year || 0,
        doi: item.doi,
        citations: item.citationCount || 0,
      })) || [];

      return papers;
    } catch (error) {
      console.error('Semantic Scholar search error:', error);
      return [];
    }
  }

  /**
   * Search PubMed for papers
   * Now uses Healthcare MCP if available for better reliability
   */
  async searchPubMed(query: string, limit: number = 10): Promise<Paper[]> {
    // Try Healthcare MCP first if available
    if (this.mcpAvailable && this.mcpClient) {
      try {
        const mcpResults = await this.mcpClient.searchPubMed(query, limit, '10');
        if (mcpResults.length > 0) {
          return mcpResults.map(r => this.convertMCPToPaper(r));
        }
      } catch (error) {
        console.warn('Healthcare MCP PubMed search failed, falling back to direct API');
        this.mcpAvailable = false; // Mark as unavailable for this session
      }
    }

    // Fallback to direct PubMed API
    const client = this.clients.get('pubmed');
    const queue = this.queues.get('pubmed');
    if (!client || !queue) return [];

    try {
      // Search for IDs
      const searchResponse = await queue.add(async () =>
        client.get('/esearch.fcgi', {
          params: {
            db: 'pubmed',
            term: query,
            retmax: limit,
            retmode: 'json',
          },
        })
      );

      const ids = searchResponse?.data?.esearchresult?.idlist || [];
      if (ids.length === 0) return [];

      // Fetch details
      const detailsResponse = await queue.add(async () =>
        client.get('/esummary.fcgi', {
          params: {
            db: 'pubmed',
            id: ids.join(','),
            retmode: 'json',
          },
        })
      );

      const results = detailsResponse?.data?.result || {};
      const papers: Paper[] = ids.map((id: string) => {
        const item = results[id];
        return {
          id: item.uid,
          title: item.title || '',
          abstract: '', // Need separate fetch for abstract
          authors: item.authors?.map((a: any) => a.name) || [],
          year: parseInt(item.pubdate?.split(' ')[0]) || 0,
          pmid: item.uid,
          journal: item.fulljournalname,
        };
      });

      return papers;
    } catch (error) {
      console.error('PubMed search error:', error);
      return [];
    }
  }

  /**
   * Search arXiv for papers
   */
  async searchArXiv(query: string, limit: number = 10): Promise<Paper[]> {
    const client = this.clients.get('arxiv');
    const queue = this.queues.get('arxiv');
    if (!client || !queue) return [];

    try {
      const response = await queue.add(async () =>
        client.get('/query', {
          params: {
            search_query: `all:${query}`,
            max_results: limit,
          },
        })
      );

      // Parse XML response (simplified)
      const papers: Paper[] = [];
      const entries = response?.data?.match(/<entry>[\s\S]*?<\/entry>/g) || [];

      for (const entry of entries) {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const idMatch = entry.match(/<id>(.*?)<\/id>/);

        papers.push({
          id: idMatch ? idMatch[1] : '',
          title: titleMatch ? titleMatch[1].trim() : '',
          abstract: summaryMatch ? summaryMatch[1].trim() : '',
          authors: [],
          year: publishedMatch ? parseInt(publishedMatch[1].split('-')[0]) : 0,
        });
      }

      return papers;
    } catch (error) {
      console.error('arXiv search error:', error);
      return [];
    }
  }

  /**
   * Search across all sources
   * Uses Healthcare MCP comprehensive search when available
   */
  async searchAll(query: string, limit: number = 20): Promise<Paper[]> {
    // Try Healthcare MCP comprehensive search first
    if (this.mcpAvailable && this.mcpClient) {
      try {
        console.log('🔍 Using Healthcare MCP for comprehensive search...');
        const mcpResults = await this.mcpClient.searchAll(query, limit);
        
        if (mcpResults.totalResults > 0) {
          const papers: Paper[] = [
            ...mcpResults.pubmed.map(r => this.convertMCPToPaper(r)),
            ...mcpResults.medrxiv.map(r => ({
              id: r.doi || r.title,
              title: r.title,
              abstract: r.abstract,
              authors: r.authors || [],
              year: r.date ? parseInt(r.date.split('-')[0]) : 0,
              doi: r.doi,
            })),
            ...mcpResults.ncbi.map(r => ({
              id: r.url || r.title,
              title: r.title,
              abstract: r.content,
              authors: [],
              year: 0,
            })),
          ];
          
          console.log(`✅ Found ${papers.length} papers via Healthcare MCP`);
          return this.deduplicatePapers(papers).slice(0, limit);
        }
      } catch (error) {
        console.warn('Healthcare MCP comprehensive search failed, using fallback');
      }
    }

    // Fallback to original multi-API approach
    console.log('⚠️  Using fallback APIs for paper search...');
    const results = await Promise.all([
      this.searchSemanticScholar(query, Math.ceil(limit / 2)),
      this.searchPubMed(query, Math.ceil(limit / 4)),
      this.searchArXiv(query, Math.ceil(limit / 4)),
    ]);

    const allPapers = results.flat();
    return this.deduplicatePapers(allPapers).slice(0, limit);
  }

  /**
   * Deduplicate papers by title similarity
   */
  private deduplicatePapers(papers: Paper[]): Paper[] {
    const uniquePapers: Paper[] = [];
    const seenTitles = new Set<string>();

    for (const paper of papers) {
      const normalizedTitle = paper.title.toLowerCase().replace(/\W+/g, '');
      if (!seenTitles.has(normalizedTitle) && normalizedTitle.length > 0) {
        seenTitles.add(normalizedTitle);
        uniquePapers.push(paper);
      }
    }

    return uniquePapers;
  }

  /**
   * Check novelty of hypothesis against existing literature
   */
  async checkNovelty(
    hypothesisTitle: string,
    hypothesisSummary: string
  ): Promise<NoveltyResult> {
    // Search for similar work
    const searchQuery = `${hypothesisTitle} ${hypothesisSummary}`.slice(0, 200);
    const similarPapers = await this.searchAll(searchQuery, 10);

    // Calculate novelty score based on similarity
    let maxSimilarity = 0;
    for (const paper of similarPapers) {
      const similarity = this.calculateTextSimilarity(
        hypothesisTitle.toLowerCase(),
        paper.title.toLowerCase()
      );
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    const noveltyScore = 1 - maxSimilarity;
    const isNovel = noveltyScore > 0.3; // Threshold for novelty

    let reasoning = '';
    if (isNovel) {
      reasoning = `No highly similar existing work found. Maximum title similarity: ${(maxSimilarity * 100).toFixed(1)}%. This appears to be a novel research direction.`;
    } else {
      reasoning = `Found similar existing work with ${(maxSimilarity * 100).toFixed(1)}% title similarity. The hypothesis may need refinement to ensure novelty.`;
    }

    return {
      isNovel,
      score: noveltyScore,
      similarPapers,
      reasoning,
    };
  }

  /**
   * Simple text similarity using Jaccard index
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Retrieve papers by DOIs
   */
  async getPapersByDOIs(dois: string[]): Promise<Paper[]> {
    const papers: Paper[] = [];

    for (const doi of dois) {
      try {
        const result = await this.searchSemanticScholar(`doi:${doi}`, 1);
        if (result.length > 0) {
          papers.push(result[0]);
        }
      } catch (error) {
        console.error(`Error fetching DOI ${doi}:`, error);
      }
    }

    return papers;
  }
}
