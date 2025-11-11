import axios, { AxiosInstance } from 'axios';
import PQueue from 'p-queue';
import type { Paper, DataSource, NoveltyResult } from '../types/index.js';

/**
 * External data retrieval service for scientific papers
 */
export class DataRetrieval {
  private clients: Map<string, AxiosInstance>;
  private queues: Map<string, PQueue>;

  constructor(dataSources: DataSource[]) {
    this.clients = new Map();
    this.queues = new Map();

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
   */
  async searchPubMed(query: string, limit: number = 10): Promise<Paper[]> {
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
   */
  async searchAll(query: string, limit: number = 20): Promise<Paper[]> {
    const results = await Promise.all([
      this.searchSemanticScholar(query, Math.ceil(limit / 2)),
      this.searchPubMed(query, Math.ceil(limit / 4)),
      this.searchArXiv(query, Math.ceil(limit / 4)),
    ]);

    const allPapers = results.flat();

    // Deduplicate by title similarity
    const uniquePapers: Paper[] = [];
    const seenTitles = new Set<string>();

    for (const paper of allPapers) {
      const normalizedTitle = paper.title.toLowerCase().replace(/\W+/g, '');
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniquePapers.push(paper);
      }
    }

    return uniquePapers.slice(0, limit);
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
