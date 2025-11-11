/**
 * Core type definitions for scientific hypothesis generation system
 */

/**
 * Scientific paper metadata from dataset
 */
export interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  journal?: string;
  doi?: string;
  pmid?: string;
  keywords?: string[];
  citations?: number;
}

/**
 * Knowledge graph node representing a scientific concept
 */
export interface ConceptNode {
  id: string;
  label: string;
  type: 'concept' | 'method' | 'material' | 'theory' | 'phenomenon';
  properties: Record<string, unknown>;
  embedding?: number[];
  papers: string[]; // Paper IDs where this concept appears
  frequency: number;
}

/**
 * Knowledge graph edge representing relationships
 */
export interface ConceptEdge {
  source: string;
  target: string;
  type: 'relates_to' | 'enables' | 'contradicts' | 'derives_from' | 'applied_in';
  weight: number;
  confidence: number;
  evidence: string[]; // Paper IDs supporting this relationship
}

/**
 * Knowledge graph structure
 */
export interface KnowledgeGraph {
  nodes: Map<string, ConceptNode>;
  edges: ConceptEdge[];
  metadata: {
    paperCount: number;
    conceptCount: number;
    createdAt: Date;
    lastUpdated: Date;
  };
}

/**
 * Path through knowledge graph
 */
export interface GraphPath {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  length: number;
  totalWeight: number;
  novelty: number; // How unusual this path combination is
}

/**
 * Research hypothesis structure
 */
export interface Hypothesis {
  id: string;
  title: string;
  summary: string;
  motivation: string;
  mechanism: string;
  designPrinciples: string[];
  experimentalPriorities: string[];
  graphPath: GraphPath;
  noveltyScore: number;
  feasibilityScore: number;
  impactScore: number;
  relatedPapers: Paper[];
  generatedAt: Date;
  status: 'draft' | 'reviewed' | 'validated' | 'rejected';
  critiques?: Critique[];
}

/**
 * Critique from review agent
 */
export interface Critique {
  aspect: 'novelty' | 'feasibility' | 'clarity' | 'impact' | 'methodology';
  rating: number; // 1-10
  comments: string;
  suggestions: string[];
  reviewer: string;
}

/**
 * Agent role definitions
 */
export type AgentRole =
  | 'ontologist'
  | 'scientist_1'
  | 'scientist_2'
  | 'critic'
  | 'planner'
  | 'assistant';

/**
 * Agent configuration
 */
export interface AgentConfig {
  role: AgentRole;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

/**
 * Agent message in conversation
 */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  agentRole?: AgentRole;
  timestamp: Date;
}

/**
 * Multi-agent workflow state
 */
export interface WorkflowState {
  id: string;
  mode: 'sequential' | 'flexible';
  currentAgent: AgentRole;
  messages: AgentMessage[];
  hypothesis?: Hypothesis;
  graphPaths: GraphPath[];
  metadata: Record<string, unknown>;
}

/**
 * Search parameters for hypothesis generation
 */
export interface SearchParams {
  keywords?: string[];
  conceptIds?: string[];
  pathLength?: number;
  minNovelty?: number;
  maxResults?: number;
  domains?: string[];
}

/**
 * External data source configuration
 */
export interface DataSource {
  name: 'semantic_scholar' | 'pubmed' | 'arxiv' | 'crossref';
  apiKey?: string;
  baseUrl: string;
  rateLimit: number;
}

/**
 * Novelty detection result
 */
export interface NoveltyResult {
  isNovel: boolean;
  score: number;
  similarPapers: Paper[];
  reasoning: string;
}

/**
 * System configuration
 */
export interface SystemConfig {
  dataSources: DataSource[];
  agents: Record<AgentRole, AgentConfig>;
  graphConfig: {
    minEdgeWeight: number;
    maxPathLength: number;
    embeddingDimensions: number;
  };
  memoryConfig: {
    storageDir: string;
    maxSessionHistory: number;
  };
}
