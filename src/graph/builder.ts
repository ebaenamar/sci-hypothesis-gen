import { parse } from 'csv-parse/sync';
import { readFile } from 'fs/promises';
import Graph from 'graphology';
import type { Paper, ConceptNode, ConceptEdge, KnowledgeGraph } from '../types/index.js';

/**
 * Knowledge graph builder from scientific literature
 */
export class GraphBuilder {
  private graph: Graph;
  private papers: Map<string, Paper>;

  constructor() {
    this.graph = new Graph({ multi: false, type: 'directed' });
    this.papers = new Map();
  }

  /**
   * Load papers from CSV dataset
   */
  async loadPapersFromCSV(filePath: string): Promise<Paper[]> {
    const content = await readFile(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
    });

    const papers: Paper[] = records.map((record: any, index: number) => ({
      id: record.pmid || record.doi || `paper_${index}`,
      title: record.title || record.ArticleTitle || '',
      abstract: record.abstract || record.Abstract || '',
      authors: this.parseAuthors(record.authors || record.AuthorList || ''),
      year: parseInt(record.year || record.PubDate || '0'),
      journal: record.journal || record.Journal || undefined,
      doi: record.doi || record.DOI || undefined,
      pmid: record.pmid || record.PMID || undefined,
      keywords: this.parseKeywords(record.keywords || record.MeshHeadingList || ''),
      citations: parseInt(record.citations || '0'),
    }));

    papers.forEach(paper => this.papers.set(paper.id, paper));
    console.log(`Loaded ${papers.length} papers from ${filePath}`);
    return papers;
  }

  /**
   * Extract concepts from papers using NLP patterns
   */
  extractConcepts(papers: Paper[]): Map<string, ConceptNode> {
    const concepts = new Map<string, ConceptNode>();

    for (const paper of papers) {
      const text = `${paper.title} ${paper.abstract} ${paper.keywords?.join(' ') || ''}`;
      const extractedConcepts = this.identifyConcepts(text, paper.id);

      for (const concept of extractedConcepts) {
        if (!concepts.has(concept.id)) {
          concepts.set(concept.id, concept);
        } else {
          const existing = concepts.get(concept.id)!;
          existing.papers.push(paper.id);
          existing.frequency++;
        }
      }
    }

    console.log(`Extracted ${concepts.size} unique concepts from papers`);
    return concepts;
  }

  /**
   * Identify scientific concepts from text
   * This uses pattern matching - can be enhanced with NER models
   */
  private identifyConcepts(text: string, paperId: string): ConceptNode[] {
    const concepts: ConceptNode[] = [];

    // Common scientific term patterns
    const patterns = {
      method: /\b(method|technique|approach|algorithm|procedure|protocol|assay)\b/gi,
      material: /\b(material|compound|protein|molecule|cell|tissue|polymer|composite)\b/gi,
      theory: /\b(theory|model|hypothesis|framework|paradigm|principle)\b/gi,
      phenomenon: /\b(effect|phenomenon|process|mechanism|pathway|interaction)\b/gi,
    };

    // Extract key phrases (2-4 word combinations)
    const words = text.toLowerCase().match(/\b[a-z]+(?:-[a-z]+)?\b/g) || [];
    const phrases: string[] = [];

    for (let i = 0; i < words.length - 1; i++) {
      // Bigrams
      phrases.push(`${words[i]} ${words[i + 1]}`);
      // Trigrams
      if (i < words.length - 2) {
        phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
    }

    // Filter and classify phrases
    const phraseFreq = new Map<string, number>();
    phrases.forEach(phrase => {
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1);
    });

    // Keep phrases that appear at least twice
    for (const [phrase, freq] of phraseFreq) {
      if (freq >= 2 && phrase.length > 5) {
        const type = this.classifyConceptType(phrase, patterns);
        const conceptId = this.normalizeConceptId(phrase);

        concepts.push({
          id: conceptId,
          label: phrase,
          type,
          properties: {},
          papers: [paperId],
          frequency: freq,
        });
      }
    }

    return concepts;
  }

  /**
   * Classify concept type based on context
   */
  private classifyConceptType(
    phrase: string,
    patterns: Record<string, RegExp>
  ): ConceptNode['type'] {
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(phrase)) {
        return type as ConceptNode['type'];
      }
    }
    return 'concept'; // default
  }

  /**
   * Build concept co-occurrence relationships
   */
  buildRelationships(concepts: Map<string, ConceptNode>): ConceptEdge[] {
    const edges: ConceptEdge[] = [];
    const cooccurrence = new Map<string, Map<string, number>>();

    // Count co-occurrences in papers
    for (const paper of this.papers.values()) {
      const paperConcepts = Array.from(concepts.values())
        .filter(c => c.papers.includes(paper.id))
        .map(c => c.id);

      // Create edges for all pairs
      for (let i = 0; i < paperConcepts.length; i++) {
        for (let j = i + 1; j < paperConcepts.length; j++) {
          const source = paperConcepts[i];
          const target = paperConcepts[j];

          if (!cooccurrence.has(source)) {
            cooccurrence.set(source, new Map());
          }
          const targetMap = cooccurrence.get(source)!;
          targetMap.set(target, (targetMap.get(target) || 0) + 1);
        }
      }
    }

    // Create edges with weights
    for (const [source, targets] of cooccurrence) {
      const sourceConcept = concepts.get(source);
      if (!sourceConcept) continue;

      for (const [target, count] of targets) {
        const targetConcept = concepts.get(target);
        if (!targetConcept) continue;

        // Calculate edge weight based on co-occurrence frequency
        const weight = count / Math.min(sourceConcept.frequency, targetConcept.frequency);
        const confidence = count / Math.max(sourceConcept.frequency, targetConcept.frequency);

        if (weight > 0.1) {
          // Threshold for significance
          const evidence = Array.from(this.papers.values())
            .filter(p =>
              sourceConcept.papers.includes(p.id) &&
              targetConcept.papers.includes(p.id)
            )
            .map(p => p.id);

          edges.push({
            source,
            target,
            type: 'relates_to',
            weight,
            confidence,
            evidence,
          });
        }
      }
    }

    console.log(`Built ${edges.length} relationships between concepts`);
    return edges;
  }

  /**
   * Build the complete knowledge graph
   */
  async buildGraph(csvPath: string): Promise<KnowledgeGraph> {
    console.log('Building knowledge graph...');

    // Load papers
    const papers = await this.loadPapersFromCSV(csvPath);

    // Extract concepts
    const concepts = this.extractConcepts(papers);

    // Build relationships
    const edges = this.buildRelationships(concepts);

    // Add to graphology instance
    for (const concept of concepts.values()) {
      this.graph.addNode(concept.id, concept);
    }

    for (const edge of edges) {
      try {
        this.graph.addEdge(edge.source, edge.target, edge);
      } catch (e) {
        // Edge might already exist, skip
      }
    }

    const knowledgeGraph: KnowledgeGraph = {
      nodes: concepts,
      edges,
      metadata: {
        paperCount: papers.length,
        conceptCount: concepts.size,
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
    };

    console.log('Knowledge graph built successfully!');
    console.log(`  Papers: ${papers.length}`);
    console.log(`  Concepts: ${concepts.size}`);
    console.log(`  Relationships: ${edges.length}`);
    console.log(`  Graph density: ${(edges.length / (concepts.size * (concepts.size - 1))).toFixed(6)}`);

    return knowledgeGraph;
  }

  /**
   * Get the graphology instance for analysis
   */
  getGraph(): Graph {
    return this.graph;
  }

  /**
   * Helper: parse author list
   */
  private parseAuthors(authorStr: string): string[] {
    if (!authorStr) return [];
    return authorStr
      .split(/[;,]/)
      .map(a => a.trim())
      .filter(a => a.length > 0);
  }

  /**
   * Helper: parse keywords
   */
  private parseKeywords(keywordStr: string): string[] {
    if (!keywordStr) return [];
    return keywordStr
      .split(/[;,]/)
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }

  /**
   * Helper: normalize concept ID
   */
  private normalizeConceptId(phrase: string): string {
    return phrase.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }
}
