# Scientific Hypothesis Agent

An advanced multi-agent system for automated scientific hypothesis generation and meta-research, combining knowledge graph reasoning with AI-powered discovery.

## Overview

This system implements cutting-edge approaches from:
- **AI Scientist dataset** (https://github.com/sergeicu/aiscientist) - 20,000+ PubMed publications from Boston Children's Hospital research output
- **GraphReasoning** (https://github.com/lamm-mit/GraphReasoning) - Knowledge graph-based discovery (MIT, Markus J. Buehler)
- **SciAgentsDiscovery** (https://github.com/lamm-mit/SciAgentsDiscovery) - Multi-agent scientific workflows (MIT)
- **Advanced Materials Research** (https://doi.org/10.1002/adma.202413523) - AI-driven scientific discovery methodologies

## Key Features

### 🧠 Multi-Agent Architecture
- **Ontologist**: Analyzes concept relationships and builds semantic networks
- **Scientist 1**: Generates creative initial hypotheses
- **Scientist 2**: Refines and expands hypotheses with technical depth
- **Critic**: Evaluates novelty, feasibility, clarity, impact, and methodology
- **Planner**: Develops strategic research plans
- **Assistant**: Validates novelty against published literature

### 🕸️ Knowledge Graph Reasoning
- Constructs large-scale ontological knowledge graphs from scientific literature
- Community detection using Louvain algorithm
- Betweenness centrality for identifying bridge concepts
- Path sampling with cross-community preference for novelty
- Calculates novelty scores based on graph topology

### 🔬 Hypothesis Generation Workflows

**Sequential Mode** (Structured pipeline):
```
Ontologist → Scientist 1 → Scientist 2 → Critic → Hypothesis
```

**Flexible Mode** (Dynamic coordination):
```
Planner → [Multiple Paths] → Novelty Check → Parallel Generation → Top Hypotheses
```

### 📚 External Data Integration
- Semantic Scholar API
- PubMed/NCBI API
- arXiv API
- Automated novelty checking against published work

## Installation

```bash
# Clone and navigate to directory
cd sci-hypothesis-agent

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Configuration

Create a `.env` file:

```bash
# Required: Anthropic API for Claude agents
ANTHROPIC_API_KEY=your_anthropic_key

# Optional: External data sources
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_key
PUBMED_API_KEY=your_pubmed_key

# Optional: Model selection
ANTHROPIC_MODEL=claude-sonnet-4
```

## Dataset Setup

### Option 1: Use AI Scientist Dataset (Boston Children's Hospital Research)

The AI Scientist repository contains ~20,000 PubMed publications from Boston Children's Hospital:

```bash
# Clone the dataset repository
git clone https://github.com/sergeicu/aiscientist.git

# Full dataset: 20,415 publications (225 MB)
npm run generate single \
  --dataset ./aiscientist/data/pubmed_data.csv \
  --keywords "pediatric" "genomics" "treatment"

# Or use smaller sample: 2,000 publications
npm run generate single \
  --dataset ./aiscientist/data/pubmed_data_2000.csv \
  --keywords "neural" "development"
```

### Option 2: Custom Dataset

Create a CSV file with these columns:
- `title`: Paper title
- `abstract`: Paper abstract
- `authors`: Author list (semicolon-separated)
- `year`: Publication year
- `doi`: DOI identifier
- `pmid`: PubMed ID
- `keywords`: Keywords (semicolon-separated)
- `journal`: Journal name

## Usage

### Generate a Single Hypothesis

```bash
npm run generate single \
  --dataset ./data/papers.csv \
  --keywords "machine learning" "protein folding" \
  --output ./results
```

This will:
1. Build a knowledge graph from the dataset
2. Find concepts matching your keywords
3. Sample diverse paths through the graph
4. Run the sequential agent workflow
5. Check novelty against published literature
6. Export results to JSON and Markdown

### Generate Multiple Hypotheses

```bash
npm run generate multiple \
  --dataset ./data/papers.csv \
  --keywords "quantum computing" "cryptography" \
  --count 5 \
  --output ./results
```

Uses the flexible workflow to generate multiple hypotheses in parallel, with automatic novelty filtering.

### Explore Concepts

```bash
npm run explore \
  --dataset ./data/papers.csv \
  --keywords "neural" "plasticity"
```

Explores the knowledge graph to find concepts related to your keywords.

### Find Bridge Concepts

```bash
npm run bridges \
  --dataset ./data/papers.csv \
  --count 20
```

Identifies high-centrality concepts that bridge different research domains.

## Programmatic API

```typescript
import SciHypothesisAgent from './src/index.js';

const agent = new SciHypothesisAgent();

// Initialize with dataset
await agent.initialize('./data/papers.csv');

// Generate hypothesis
const hypothesis = await agent.generateHypothesis([
  'materials',
  'biomimetic',
  'composites'
]);

// Export results
await agent.exportHypothesis(hypothesis, './output');
```

## Output Format

Each hypothesis includes:

- **Title & Summary**: Clear description of the research idea
- **Motivation**: Why this research matters
- **Mechanism**: Detailed explanation of the proposed mechanism
- **Design Principles**: Key principles guiding implementation
- **Experimental Priorities**: Specific experiments for validation
- **Scores**:
  - Novelty (0-1): How unique compared to existing work
  - Feasibility (0-1): Practicality with current methods
  - Impact (0-1): Potential scientific significance
- **Graph Path**: The concept path that inspired the hypothesis
- **Critiques**: Detailed reviews from the Critic agent
- **Related Papers**: Similar published work

## Architecture

```
src/
├── types/           # TypeScript type definitions
├── config/          # System configuration
├── graph/
│   ├── builder.ts   # Knowledge graph construction
│   └── reasoner.ts  # Graph analysis and path sampling
├── agents/
│   ├── base.ts      # Base agent implementation
│   └── orchestrator.ts  # Multi-agent workflows
├── data/
│   └── retrieval.ts # External API integration
├── cli/
│   └── generate.ts  # Command-line interface
└── index.ts         # Main application class
```

## Methodology

### Knowledge Graph Construction

1. **Concept Extraction**: NLP patterns identify scientific concepts (methods, materials, theories, phenomena)
2. **Co-occurrence Analysis**: Build relationships based on concept co-occurrence in papers
3. **Weighted Edges**: Edge weights reflect co-occurrence frequency
4. **Community Detection**: Louvain algorithm identifies research clusters

### Novelty Calculation

Novelty score combines multiple factors:
- **Cross-Community Transitions** (40%): Path bridges different research domains
- **Edge Weakness** (30%): Unexpected/rare connections
- **Path Length** (20%): Longer paths = more complex ideas
- **Bridge Concepts** (10%): Avoids well-known connections

### Multi-Agent Coordination

**Sequential Workflow**:
- Structured, thorough exploration
- Each agent builds on previous work
- Comprehensive critique at the end

**Flexible Workflow**:
- Dynamic agent coordination
- Parallel hypothesis generation
- Automatic novelty filtering
- Efficient for batch generation

## Performance Tips

1. **Dataset Size**: Start with 1000-5000 papers for development, scale to 20k+ for production
2. **Path Sampling**: Adjust `pathLength` (3-6) and `maxResults` based on graph density
3. **Agent Temperature**:
   - Lower (0.2-0.4) for Critic, Planner, Assistant
   - Higher (0.6-0.8) for Scientists (creativity)
4. **Rate Limits**: External APIs have rate limits; the system handles this automatically

## Extending the System

### Add Custom Agent Roles

```typescript
const customAgent: AgentConfig = {
  role: 'custom_role' as AgentRole,
  model: 'claude-sonnet-4',
  temperature: 0.5,
  maxTokens: 4000,
  systemPrompt: 'Your custom agent instructions...',
};
```

### Custom Concept Extraction

Override `identifyConcepts()` in `GraphBuilder` to use:
- Named Entity Recognition models
- Domain-specific ontologies
- Custom NLP pipelines

### Advanced Graph Analysis

The system uses `graphology` - you can add:
- PageRank for concept importance
- Triadic closure analysis
- Temporal evolution tracking
- Cross-domain link prediction

## Research Applications

This system is designed for:

- **Interdisciplinary Discovery**: Finding connections between distant research fields
- **Hypothesis Brainstorming**: Generating novel research directions
- **Literature Analysis**: Understanding concept relationships in large corpora
- **Grant Proposals**: Identifying unexplored research opportunities
- **Meta-Research**: Studying patterns in scientific knowledge

## Limitations

- **NLP Quality**: Concept extraction uses pattern matching; can be improved with dedicated NER models
- **Graph Density**: Very sparse or dense graphs affect path sampling quality
- **Agent Creativity**: LLM output quality depends on prompt engineering and model capabilities
- **Computational Cost**: API calls for multiple agents can be expensive at scale

## Future Enhancements

- [ ] Embeddings-based semantic similarity
- [ ] Temporal graph analysis (track research evolution)
- [ ] Interactive web UI for graph exploration
- [ ] Integration with laboratory equipment data
- [ ] Experimental design automation
- [ ] Collaborative multi-user sessions
- [ ] Results database for hypothesis tracking

## Citations

If you use this system in your research, please cite:

```bibtex
@software{sci_hypothesis_agent,
  title={Scientific Hypothesis Agent: Multi-Agent System for Automated Research Discovery},
  year={2025},
  author={Your Name},
  note={Inspired by GraphReasoning (Buehler) and SciAgentsDiscovery}
}
```

## License

MIT License - see LICENSE file

## Contributing

Contributions welcome! Areas of interest:
- Better concept extraction (NER, domain ontologies)
- Additional agent roles and workflows
- Graph analysis algorithms
- UI/UX improvements
- Documentation and examples

## Support

For issues, questions, or contributions:
- GitHub Issues: [Create an issue]
- Email: your.email@example.com

---

**Built with:** TypeScript, Claude (Anthropic), Graphology, Node.js

**Inspired by:** AI Scientist, GraphReasoning (MIT), SciAgentsDiscovery
