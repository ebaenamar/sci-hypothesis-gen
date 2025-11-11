# Quick Reference Guide

## Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Build project
npm run build

# 4. Verify installation
npm test
```

## Common Commands

### Generate Single Hypothesis
```bash
npm run generate single \
  --dataset ./data/papers.csv \
  --keywords "machine learning" "protein" \
  --output ./results
```

### Generate Multiple Hypotheses
```bash
npm run generate multiple \
  --dataset ./data/papers.csv \
  --keywords "quantum" "materials" \
  --count 5 \
  --output ./results
```

### Explore Concepts
```bash
npm run explore \
  --dataset ./data/papers.csv \
  --keywords "neural" "plasticity"
```

### Find Bridge Concepts
```bash
npm run bridges \
  --dataset ./data/papers.csv \
  --count 20
```

## Programmatic Usage

```typescript
import SciHypothesisAgent from './src/index.js';

// Initialize
const agent = new SciHypothesisAgent();
await agent.initialize('./data/papers.csv');

// Generate hypothesis
const hypothesis = await agent.generateHypothesis([
  'biomimetic',
  'materials',
  'design'
]);

// Export
await agent.exportHypothesis(hypothesis, './output');
```

## File Structure

```
sci-hypothesis-agent/
├── src/
│   ├── types/          # TypeScript types
│   ├── config/         # Configuration
│   ├── graph/          # Knowledge graph
│   ├── agents/         # Multi-agent system
│   ├── data/           # Data retrieval
│   ├── cli/            # CLI interface
│   └── index.ts        # Main application
├── examples/           # Usage examples
├── data/              # Datasets (add your CSV here)
├── output/            # Generated hypotheses
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
└── README.md          # Full documentation
```

## Dataset Format

Your CSV should have these columns:
```csv
title,abstract,authors,year,doi,pmid,keywords,journal
"Paper Title","Abstract text","Author1;Author2",2023,10.xxx,12345,"keyword1;keyword2","Journal Name"
```

Minimum required: `title`, `abstract`

## Output Format

### JSON Output
```json
{
  "id": "uuid",
  "title": "Hypothesis Title",
  "summary": "Brief overview",
  "motivation": "Why this matters",
  "mechanism": "Detailed explanation",
  "designPrinciples": ["principle1", "principle2"],
  "experimentalPriorities": ["experiment1", "experiment2"],
  "noveltyScore": 0.85,
  "feasibilityScore": 0.75,
  "impactScore": 0.90,
  "graphPath": { /* concept path */ },
  "critiques": [ /* agent reviews */ ],
  "relatedPapers": [ /* similar work */ ]
}
```

### Markdown Output
- Human-readable format
- Includes all sections
- Ready for documentation/presentations

## Key Concepts

### Knowledge Graph
- **Nodes**: Scientific concepts (methods, materials, theories, phenomena)
- **Edges**: Co-occurrence relationships with weights
- **Communities**: Research clusters identified by Louvain algorithm
- **Bridge Concepts**: High centrality nodes connecting domains

### Novelty Score
Combines multiple factors:
- Cross-community transitions (40%)
- Edge weakness (30%)
- Path length (20%)
- Bridge concepts (10%)

Range: 0-1 (higher = more novel)

### Agent Roles
- **Ontologist**: Analyzes concept relationships
- **Scientist 1**: Generates initial hypotheses (creative)
- **Scientist 2**: Refines with technical depth
- **Critic**: Evaluates novelty, feasibility, clarity, impact, methodology
- **Planner**: Develops research strategies
- **Assistant**: Checks novelty against literature

### Workflows

**Sequential** (thorough):
```
Ontologist → Scientist 1 → Scientist 2 → Critic
```

**Flexible** (batch):
```
Planner → [Parallel Paths] → Novelty Filter → Top Results
```

## Troubleshooting

### "No concepts found"
- Dataset too small (<100 papers)
- Keywords not in dataset
- Solution: Use broader keywords or larger dataset

### "API rate limit"
- Too many requests to external APIs
- Solution: Wait a few minutes, system auto-queues requests

### "Out of memory"
- Graph too large (>100k papers)
- Solution: Use subset of data, or increase Node memory:
  ```bash
  NODE_OPTIONS="--max-old-space-size=8192" npm run generate ...
  ```

### "Agent timeout"
- Long hypothesis generation
- Solution: Normal for complex hypotheses, wait or reduce path length

## Performance Tips

1. **Start small**: Test with 1000-5000 papers first
2. **Use caching**: Results are cached automatically
3. **Parallel generation**: Use `multiple` command for batch
4. **Adjust path length**: Shorter paths (3-4) are faster
5. **Filter results**: Set quality thresholds in code

## Advanced Configuration

Edit `src/config/default.ts`:

```typescript
// Agent temperature (creativity)
scientist_1: {
  temperature: 0.7,  // Lower = more conservative
}

// Graph sampling
graphConfig: {
  maxPathLength: 5,   // Longer = more complex hypotheses
  minEdgeWeight: 0.1, // Higher = stronger relationships only
}
```

## Integration Examples

### With Research Pipeline
```typescript
// 1. Generate hypotheses
const hypotheses = await agent.generateMultipleHypotheses(keywords, 10);

// 2. Filter by quality
const highQuality = hypotheses.filter(h =>
  h.noveltyScore > 0.7 &&
  h.feasibilityScore > 0.6
);

// 3. Export for review
for (const h of highQuality) {
  await agent.exportHypothesis(h, './review-queue');
}

// 4. Send to lab management system
await sendToLIMS(highQuality);
```

### With Grant Writing
```typescript
// Generate hypotheses for grant proposal
const hypotheses = await agent.generateMultipleHypotheses(
  ['interdisciplinary', 'innovation', 'impact'],
  5
);

// Format for specific aims section
const aims = hypotheses.map(h => ({
  aim: h.title,
  rationale: h.motivation,
  approach: h.experimentalPriorities,
}));
```

## Resources

- **Full Documentation**: README.md
- **Architecture Details**: ARCHITECTURE.md
- **Contributing Guide**: CONTRIBUTING.md
- **Examples**: examples/ directory
- **API Reference**: TypeScript definitions in src/types/

## Getting Help

1. Check README.md for detailed documentation
2. Review examples/ for code samples
3. Read ARCHITECTURE.md for system design
4. Open GitHub issue for bugs
5. Start discussion for questions

## Quick Tips

✅ **DO:**
- Use specific keywords for better results
- Start with explore/bridges to understand graph
- Filter by novelty/feasibility scores
- Review critique comments for improvements
- Export results for later reference

❌ **DON'T:**
- Use extremely broad keywords ("science", "research")
- Generate 100+ hypotheses at once (rate limits)
- Ignore novelty warnings (may duplicate existing work)
- Skip dataset quality checks
- Commit API keys to version control

## Example Workflow

```bash
# 1. Get dataset
git clone https://github.com/sergeicu/aiscientist.git
cp aiscientist/data/pubmed_data.csv ./data/

# 2. Set up environment
echo "ANTHROPIC_API_KEY=your-key" > .env

# 3. Explore the graph
npm run explore -- --dataset ./data/pubmed_data.csv --keywords neural brain

# 4. Find interesting bridges
npm run bridges -- --dataset ./data/pubmed_data.csv --count 20

# 5. Generate hypotheses
npm run generate multiple \
  --dataset ./data/pubmed_data.csv \
  --keywords neural plasticity learning \
  --count 3 \
  --output ./results

# 6. Review outputs in ./results/
```

## Next Steps

1. ✅ Install and configure
2. ✅ Test with small dataset
3. ✅ Explore knowledge graph
4. ✅ Generate first hypothesis
5. ✅ Review and refine keywords
6. ✅ Scale to larger datasets
7. ✅ Integrate into workflow
8. ✅ Contribute improvements!

---

**Need more help?** See README.md for comprehensive documentation.
