import axios, { AxiosInstance } from 'axios';
import PQueue from 'p-queue';

/**
 * Client for Healthcare MCP Server
 * Provides access to medical literature and healthcare data
 */
export class HealthcareMCPClient {
  private client: AxiosInstance;
  private queue: PQueue;

  constructor(baseUrl = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Rate limiting queue
    this.queue = new PQueue({
      interval: 1000,
      intervalCap: 3, // 3 requests per second
    });
  }

  /**
   * Search PubMed for medical literature
   */
  async searchPubMed(
    query: string,
    maxResults = 10,
    dateRange?: string
  ): Promise<PubMedResult[]> {
    const result = await this.queue.add(async () => {
      try {
        const response = await this.client.post('/mcp/call-tool', {
          name: 'pubmed_search',
          arguments: {
            query,
            max_results: maxResults,
            date_range: dateRange || '',
          },
        });

        return this.parsePubMedResults(response.data);
      } catch (error) {
        console.warn(`PubMed search error: ${error}`);
        return [];
      }
    });
    return result || [];
  }

  /**
   * Search medRxiv for pre-print articles
   */
  async searchMedRxiv(
    query: string,
    maxResults = 10
  ): Promise<MedRxivResult[]> {
    const result = await this.queue.add(async () => {
      try {
        const response = await this.client.post('/mcp/call-tool', {
          name: 'medrxiv_search',
          arguments: {
            query,
            max_results: maxResults,
          },
        });

        return this.parseMedRxivResults(response.data);
      } catch (error) {
        console.warn(`medRxiv search error: ${error}`);
        return [];
      }
    });
    return result || [];
  }

  /**
   * Search NCBI Bookshelf for biomedical literature
   */
  async searchNCBIBookshelf(
    query: string,
    maxResults = 10
  ): Promise<NCBIResult[]> {
    const result = await this.queue.add(async () => {
      try {
        const response = await this.client.post('/mcp/call-tool', {
          name: 'ncbi_bookshelf_search',
          arguments: {
            query,
            max_results: maxResults,
          },
        });

        return this.parseNCBIResults(response.data);
      } catch (error) {
        console.warn(`NCBI Bookshelf search error: ${error}`);
        return [];
      }
    });
    return result || [];
  }

  /**
   * Search clinical trials
   */
  async searchClinicalTrials(
    condition: string,
    status = 'recruiting',
    maxResults = 10
  ): Promise<ClinicalTrialResult[]> {
    const result = await this.queue.add(async () => {
      try {
        const response = await this.client.post('/mcp/call-tool', {
          name: 'clinical_trials_search',
          arguments: {
            condition,
            status,
            max_results: maxResults,
          },
        });

        return this.parseClinicalTrialResults(response.data);
      } catch (error) {
        console.warn(`Clinical trials search error: ${error}`);
        return [];
      }
    });
    return result || [];
  }

  /**
   * Comprehensive search across all sources
   */
  async searchAll(query: string, maxResults = 5): Promise<SearchResults> {
    const [pubmed, medrxiv, ncbi] = await Promise.all([
      this.searchPubMed(query, maxResults),
      this.searchMedRxiv(query, maxResults),
      this.searchNCBIBookshelf(query, maxResults),
    ]);

    return {
      pubmed,
      medrxiv,
      ncbi,
      totalResults: pubmed.length + medrxiv.length + ncbi.length,
    };
  }

  /**
   * Check if MCP server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Parsing methods
  private parsePubMedResults(data: any): PubMedResult[] {
    try {
      // Healthcare MCP returns data directly in JSON format
      if (data.articles && Array.isArray(data.articles)) {
        return data.articles.map((article: any) => ({
          title: article.title || '',
          pmid: article.id || '',
          abstract: article.abstract || '',
          authors: article.authors || [],
          year: article.publication_date ? parseInt(article.publication_date) : 0,
          journal: article.journal || '',
          doi: article.doi || '',
        }));
      }
      
      // Fallback: try to parse from content field
      const content = data.content?.[0]?.text || '';
      if (content) {
        const results: PubMedResult[] = [];
        const lines = content.split('\n');
        let currentResult: Partial<PubMedResult> = {};
        
        for (const line of lines) {
          if (line.startsWith('Title:')) {
            if (currentResult.title) results.push(currentResult as PubMedResult);
            currentResult = { title: line.replace('Title:', '').trim() };
          } else if (line.startsWith('PMID:')) {
            currentResult.pmid = line.replace('PMID:', '').trim();
          } else if (line.startsWith('Abstract:')) {
            currentResult.abstract = line.replace('Abstract:', '').trim();
          }
        }
        
        if (currentResult.title) results.push(currentResult as PubMedResult);
        return results;
      }
      
      return [];
    } catch (error) {
      console.warn('Error parsing PubMed results:', error);
      return [];
    }
  }

  private parseMedRxivResults(_data: any): MedRxivResult[] {
    // TODO: Implement parsing logic based on actual MCP response
    return [];
  }

  private parseNCBIResults(_data: any): NCBIResult[] {
    // TODO: Implement parsing logic based on actual MCP response
    return [];
  }

  private parseClinicalTrialResults(_data: any): ClinicalTrialResult[] {
    // TODO: Implement parsing logic based on actual MCP response
    return [];
  }
}

// Types
export interface PubMedResult {
  title: string;
  pmid: string;
  abstract: string;
  authors?: string[];
  year?: number;
  journal?: string;
  doi?: string;
}

export interface MedRxivResult {
  title: string;
  abstract: string;
  authors?: string[];
  date?: string;
  doi?: string;
  url?: string;
}

export interface NCBIResult {
  title: string;
  content: string;
  url?: string;
  bookTitle?: string;
}

export interface ClinicalTrialResult {
  nctId: string;
  title: string;
  status: string;
  condition: string;
  description?: string;
  url?: string;
}

export interface SearchResults {
  pubmed: PubMedResult[];
  medrxiv: MedRxivResult[];
  ncbi: NCBIResult[];
  totalResults: number;
}
