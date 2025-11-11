import { describe, it, expect, beforeEach } from 'vitest';
import { GraphBuilder } from './builder.js';
import type { Paper, ConceptNode } from '../types/index.js';

describe('GraphBuilder', () => {
  let builder: GraphBuilder;

  beforeEach(() => {
    builder = new GraphBuilder();
  });

  describe('extractConcepts', () => {
    it('should extract concepts from papers', () => {
      const papers: Paper[] = [
        {
          id: 'paper1',
          title: 'Neural Network Architecture for Protein Folding',
          abstract: 'We present a novel neural network method for predicting protein folding patterns.',
          authors: ['Smith, J.', 'Doe, A.'],
          year: 2023,
          keywords: ['neural networks', 'protein folding', 'machine learning'],
        },
        {
          id: 'paper2',
          title: 'Deep Learning Approaches to Molecular Biology',
          abstract: 'Deep learning methods have shown promise in molecular biology applications.',
          authors: ['Johnson, K.'],
          year: 2023,
          keywords: ['deep learning', 'molecular biology'],
        },
      ];

      const concepts = builder.extractConcepts(papers);

      expect(concepts.size).toBeGreaterThan(0);

      // Check that concepts have required properties
      const firstConcept = Array.from(concepts.values())[0];
      expect(firstConcept).toHaveProperty('id');
      expect(firstConcept).toHaveProperty('label');
      expect(firstConcept).toHaveProperty('type');
      expect(firstConcept).toHaveProperty('papers');
      expect(firstConcept).toHaveProperty('frequency');
    });

    it('should classify concept types correctly', () => {
      const papers: Paper[] = [
        {
          id: 'paper1',
          title: 'A Novel Method for Quantum Computing',
          abstract: 'We introduce a new algorithm for quantum state preparation.',
          authors: ['Researcher, A.'],
          year: 2024,
        },
      ];

      const concepts = builder.extractConcepts(papers);
      const conceptArray = Array.from(concepts.values());

      // Should have some method-type concepts
      const methodConcepts = conceptArray.filter(c => c.type === 'method');
      expect(methodConcepts.length).toBeGreaterThan(0);
    });

    it('should track concept frequency across papers', () => {
      const papers: Paper[] = [
        {
          id: 'paper1',
          title: 'Machine Learning Applications',
          abstract: 'Machine learning has revolutionized data science.',
          authors: ['A'],
          year: 2023,
        },
        {
          id: 'paper2',
          title: 'Advanced Machine Learning Techniques',
          abstract: 'Machine learning continues to advance rapidly.',
          authors: ['B'],
          year: 2023,
        },
      ];

      const concepts = builder.extractConcepts(papers);

      // Find 'machine learning' concept
      const mlConcept = Array.from(concepts.values()).find(c =>
        c.label.includes('machine') && c.label.includes('learning')
      );

      expect(mlConcept).toBeDefined();
      expect(mlConcept!.papers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('buildRelationships', () => {
    it('should create edges between co-occurring concepts', () => {
      const concepts = new Map<string, ConceptNode>([
        [
          'neural_network',
          {
            id: 'neural_network',
            label: 'neural network',
            type: 'method',
            properties: {},
            papers: ['paper1', 'paper2'],
            frequency: 2,
          },
        ],
        [
          'protein_folding',
          {
            id: 'protein_folding',
            label: 'protein folding',
            type: 'phenomenon',
            properties: {},
            papers: ['paper1'],
            frequency: 1,
          },
        ],
      ]);

      const edges = builder.buildRelationships(concepts);

      expect(edges.length).toBeGreaterThan(0);

      // Check edge properties
      const firstEdge = edges[0];
      expect(firstEdge).toHaveProperty('source');
      expect(firstEdge).toHaveProperty('target');
      expect(firstEdge).toHaveProperty('type');
      expect(firstEdge).toHaveProperty('weight');
      expect(firstEdge).toHaveProperty('confidence');
      expect(firstEdge).toHaveProperty('evidence');
    });

    it('should calculate edge weights based on co-occurrence', () => {
      const concepts = new Map<string, ConceptNode>([
        [
          'concept_a',
          {
            id: 'concept_a',
            label: 'concept a',
            type: 'concept',
            properties: {},
            papers: ['p1', 'p2', 'p3'],
            frequency: 3,
          },
        ],
        [
          'concept_b',
          {
            id: 'concept_b',
            label: 'concept b',
            type: 'concept',
            properties: {},
            papers: ['p1', 'p2'],
            frequency: 2,
          },
        ],
      ]);

      const edges = builder.buildRelationships(concepts);

      // Weight should be proportional to co-occurrence
      const edge = edges.find(
        e =>
          (e.source === 'concept_a' && e.target === 'concept_b') ||
          (e.source === 'concept_b' && e.target === 'concept_a')
      );

      if (edge) {
        expect(edge.weight).toBeGreaterThan(0);
        expect(edge.weight).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('getGraph', () => {
    it('should return a graphology instance', () => {
      const graph = builder.getGraph();

      expect(graph).toBeDefined();
      expect(typeof graph.addNode).toBe('function');
      expect(typeof graph.addEdge).toBe('function');
    });
  });
});
