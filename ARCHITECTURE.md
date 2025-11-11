# Architecture Overview

## System Design

The Scientific Hypothesis Agent is a sophisticated multi-agent system that combines knowledge graph reasoning with AI-powered scientific discovery. It follows a modular architecture inspired by GraphReasoning (MIT) and SciAgentsDiscovery research.

## Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     CLI      │  │  Web API     │  │  Library     │      │
│  │  (generate)  │  │  (future)    │  │     API      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 Application Layer (index.ts)                 │
│                 SciHypothesisAgent Main Class                │
│  • Initialization  • Workflow Coordination  • Export         │
└─────────────────────────────────────────────────────────────┘
           ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Knowledge Graph │  │  Multi-Agent     │  │  Data Retrieval  │
│      Layer       │  │    System        │  │      Layer       │
│                  │  │                  │  │                  │
│ • GraphBuilder   │  │ • BaseAgent      │  │ • Semantic       │
│ • GraphReasoner  │  │ • Orchestrator   │  │   Scholar        │
│ • Path Sampling  │  │ • 6 Agent Roles  │  │ • PubMed         │
│ • Community      │  │ • 2 Workflows    │  │ • arXiv          │
│   Detection      │  │                  │  │ • CrossRef       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
           ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Graph      │  │ Conversation │  │  External    │      │
│  │   Storage    │  │   History    │  │   APIs       │      │
│  │ (graphology) │  │   (memory)   │  │ (REST/HTTP)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Knowledge Graph Layer

### GraphBuilder (`src/graph/builder.ts`)

**Responsibilities:**
- Parse CSV datasets of scientific papers
- Extract concepts using NLP patterns
- Build co-occurrence relationships
- Construct knowledge graph structure

**Algorithm:**
1. Load papers from CSV
2. For each paper:
   - Extract concepts (methods, materials, theories, phenomena)
   - Track concept frequency
3. Calculate co-occurrence matrix
4. Create weighted edges (weight = co-occurrence frequency)
5. Add to graphology instance

**Key Methods:**
- `loadPapersFromCSV()`: Parse dataset
- `extractConcepts()`: NLP-based concept extraction
- `buildRelationships()`: Co-occurrence analysis
- `buildGraph()`: Complete graph construction

### GraphReasoner (`src/graph/reasoner.ts`)

**Responsibilities:**
- Analyze graph topology
- Community detection (Louvain algorithm)
- Centrality analysis (betweenness)
- Path sampling for hypothesis generation
- Novelty scoring

**Algorithm:**
1. Community Detection:
   - Apply Louvain algorithm
   - Identify research clusters

2. Centrality Analysis:
   - Calculate betweenness centrality
   - Find "bridge" concepts connecting domains

3. Path Sampling:
   - Random walk from source concept
   - Bias towards cross-community jumps
   - Generate diverse paths

4. Novelty Scoring:
   - Cross-community transitions (40%)
   - Edge weakness (30%)
   - Path length (20%)
   - Bridge concepts (10%)

**Key Methods:**
- `analyzeGraph()`: Compute graph metrics
- `findPaths()`: Sample paths between concepts
- `calculateNoveltyScore()`: Assess path novelty
- `findBridgeConcepts()`: Identify connecting concepts

## Multi-Agent System

### BaseAgent (`src/agents/base.ts`)

**Responsibilities:**
- Manage conversation with Claude API
- Maintain conversation history
- Handle API errors and retries

**Features:**
- System prompt initialization
- Message history tracking
- Conversation export
- Reset functionality

### AgentOrchestrator (`src/agents/orchestrator.ts`)

**Responsibilities:**
- Coordinate multiple agents
- Implement workflow patterns
- Parse agent outputs
- Compile final hypotheses

**Workflows:**

#### Sequential Workflow
```
1. Ontologist: Analyze concept relationships in path
   ↓
2. Scientist 1: Generate initial hypothesis
   ↓
3. Scientist 2: Refine and expand hypothesis
   ↓
4. Critic: Evaluate on 5 dimensions
   ↓
5. Compile: Create structured hypothesis object
```

**Use Case:** Thorough exploration of a single research direction

#### Flexible Workflow
```
1. Planner: Develop research strategy
   ↓
2. For each promising path:
   ├─ Ontologist + Scientist 1 (parallel)
   ├─ Scientist 2 (refine)
   ├─ Assistant (novelty check)
   └─ If novel → Critic → Add to results
   ↓
3. Return top N hypotheses
```

**Use Case:** Batch generation with automatic quality filtering

### Agent Roles

| Role | Temperature | Purpose |
|------|-------------|---------|
| **Ontologist** | 0.3 | Analyze semantic relationships |
| **Scientist 1** | 0.7 | Generate creative hypotheses |
| **Scientist 2** | 0.6 | Add technical depth |
| **Critic** | 0.4 | Evaluate objectively |
| **Planner** | 0.3 | Strategic coordination |
| **Assistant** | 0.2 | Novelty checking, data retrieval |

## Data Retrieval Layer

### DataRetrieval (`src/data/retrieval.ts`)

**Responsibilities:**
- Query external paper databases
- Rate limiting and queuing
- Novelty assessment
- Paper deduplication

**External APIs:**
1. **Semantic Scholar**
   - Comprehensive paper metadata
   - Citation counts
   - 100 requests/min rate limit

2. **PubMed**
   - Biomedical literature
   - MeSH terms
   - 3 requests/sec rate limit

3. **arXiv**
   - Preprints
   - Physics, CS, Math focus
   - 1 request/sec rate limit

4. **CrossRef**
   - DOI resolution
   - Publisher metadata
   - 50 requests/min rate limit

**Novelty Detection:**
- Search with hypothesis title + summary
- Calculate text similarity (Jaccard index)
- Score = 1 - max_similarity
- Threshold = 0.3 for novelty

## Data Flow

### Hypothesis Generation Flow

```
1. User Input
   ↓
2. Dataset Loading
   ├─ Parse CSV
   ├─ Extract Papers
   └─ Build Paper Index
   ↓
3. Graph Construction
   ├─ Extract Concepts (NLP)
   ├─ Build Co-occurrence Matrix
   ├─ Create Weighted Graph
   └─ Compute Graph Metrics
   ↓
4. Concept Search
   ├─ Keyword Matching
   ├─ Select Starting Concepts
   └─ Rank by Frequency
   ↓
5. Path Sampling
   ├─ Random Walk
   ├─ Cross-Community Bias
   ├─ Calculate Novelty
   └─ Select Top Paths
   ↓
6. Multi-Agent Workflow
   ├─ Sequential or Flexible
   ├─ Agent Conversations
   ├─ Output Parsing
   └─ Compilation
   ↓
7. External Validation
   ├─ Search Paper DBs
   ├─ Calculate Novelty
   └─ Update Scores
   ↓
8. Export
   ├─ JSON (structured data)
   ├─ Markdown (human-readable)
   └─ Return to User
```

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Graph Construction | O(P × C²) | P=papers, C=concepts per paper |
| Community Detection | O(E × log(N)) | E=edges, N=nodes (Louvain) |
| Path Sampling | O(L × D) | L=path length, D=avg degree |
| Agent Conversation | O(M × T) | M=messages, T=tokens per message |

### Space Complexity

| Component | Space | Notes |
|-----------|-------|-------|
| Knowledge Graph | O(N + E) | N=nodes, E=edges |
| Paper Storage | O(P × K) | P=papers, K=avg paper size |
| Agent History | O(A × M × T) | A=agents, M=messages, T=tokens |

### Bottlenecks

1. **API Latency**: Agent conversations (1-5s per message)
2. **Rate Limits**: External APIs (vary by service)
3. **Graph Construction**: Large datasets (>50k papers)
4. **Memory**: Full graph in RAM

### Optimization Strategies

1. **Parallel Agent Calls**: Use Promise.all for independent agents
2. **Request Queuing**: p-queue for rate limiting
3. **Caching**: Graph metrics, API responses
4. **Batch Processing**: Multiple paths in one workflow
5. **Lazy Loading**: Load papers on-demand

## Extension Points

### Adding New Concept Extractors

```typescript
// Implement custom extractor
class SciBERTExtractor implements ConceptExtractor {
  extract(text: string): ConceptNode[] {
    // Use transformer model
  }
}

// Use in GraphBuilder
builder.setExtractor(new SciBERTExtractor());
```

### Adding New Agent Roles

```typescript
// 1. Define config
const experimentalDesigner: AgentConfig = {
  role: 'experimental_designer',
  systemPrompt: '...',
  // ...
};

// 2. Add to workflow
async runExperimentalDesigner(hypothesis: string) {
  const agent = this.agents.get('experimental_designer');
  return await agent.chat(prompt);
}
```

### Custom Graph Metrics

```typescript
// Add to GraphReasoner
class CustomReasoner extends GraphReasoner {
  computeCustomMetric(): Map<string, number> {
    // Custom graph analysis
  }
}
```

## Security Considerations

1. **API Keys**: Store in environment variables, never commit
2. **Input Validation**: Sanitize CSV input, validate paths
3. **Rate Limiting**: Respect API limits to avoid bans
4. **Output Sanitization**: Escape special characters in exports
5. **Error Handling**: Don't leak sensitive info in errors

## Deployment Considerations

### Resource Requirements

**Minimum:**
- Node.js 18+
- 2GB RAM
- 1GB disk space

**Recommended:**
- Node.js 20+
- 8GB RAM (for large graphs)
- 10GB disk space (datasets + outputs)
- Multi-core CPU (parallel processing)

### Environment Variables

```bash
ANTHROPIC_API_KEY=required
SEMANTIC_SCHOLAR_API_KEY=optional
PUBMED_API_KEY=optional
ANTHROPIC_MODEL=optional (default: claude-sonnet-4)
```

### Monitoring

Key metrics to track:
- API call latency
- Graph construction time
- Hypothesis generation success rate
- Novelty scores distribution
- Agent token usage

## Future Architecture

### Planned Enhancements

1. **Graph Database**: Neo4j for persistence and queries
2. **Message Queue**: Redis for async workflows
3. **Web UI**: React + GraphQL for visualization
4. **Embeddings**: Sentence transformers for semantic similarity
5. **Caching Layer**: Redis for API responses and graph metrics
6. **Distributed Agents**: Multi-machine parallel generation

### Scalability Path

```
Current: Single machine, in-memory graph
    ↓
Next: Graph database + caching
    ↓
Future: Distributed agents + message queue
    ↓
Scale: Cloud deployment + orchestration
```

## References

- **GraphReasoning**: https://github.com/lamm-mit/GraphReasoning (MIT - Markus J. Buehler)
- **SciAgentsDiscovery**: https://github.com/lamm-mit/SciAgentsDiscovery (MIT)
- **AI Scientist Dataset**: https://github.com/sergeicu/aiscientist (Boston Children's Hospital PubMed data, ~20k publications)
- **Advanced Materials Research**: https://doi.org/10.1002/adma.202413523
- **Graphology**: https://graphology.github.io/ (Graph data structure library)
- **Anthropic Claude**: https://docs.anthropic.com/ (AI agent framework)
