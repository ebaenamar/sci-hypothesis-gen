# Contributing to Scientific Hypothesis Agent

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/sci-hypothesis-agent.git
   cd sci-hypothesis-agent
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Build and test**
   ```bash
   npm run build
   npm test
   npm run typecheck
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Code Style

- Use TypeScript for all new code
- Follow existing code style (enforced by ESLint)
- Use ES modules (`import`/`export`)
- Prefer `const` over `let`, never use `var`
- Use destructuring when appropriate
- Add JSDoc comments for public APIs

```typescript
/**
 * Generate a scientific hypothesis from concept path
 *
 * @param keywords - Keywords to search for concepts
 * @param options - Generation options
 * @returns Generated hypothesis
 */
export async function generateHypothesis(
  keywords: string[],
  options?: GenerationOptions
): Promise<Hypothesis> {
  // Implementation
}
```

### Testing

- Write tests for new features using Vitest
- Place test files next to source files: `module.ts` → `module.test.ts`
- Aim for >80% code coverage
- Test both success and error cases

```typescript
import { describe, it, expect } from 'vitest';

describe('MyModule', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### Type Safety

- Avoid `any` type unless absolutely necessary
- Define interfaces for complex data structures
- Use type guards for runtime type checking
- Export types from `src/types/index.ts`

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build, dependencies, etc.

Examples:
```
feat(graph): add temporal analysis for research evolution

fix(agents): correct critique parsing regex

docs(readme): add installation troubleshooting section
```

## Areas for Contribution

### High Priority

1. **Improved Concept Extraction**
   - Integrate NER models (spaCy, SciBERT, etc.)
   - Domain-specific ontologies (MeSH, Gene Ontology)
   - Custom entity recognition for materials, methods, etc.

2. **Graph Analysis Enhancements**
   - PageRank for concept importance
   - Temporal evolution tracking
   - Cross-domain link prediction
   - Subgraph pattern mining

3. **Agent Improvements**
   - Additional specialized agents (Experimenter, Theorist, etc.)
   - Better prompt engineering
   - Agent memory and learning
   - Multi-turn refinement workflows

4. **Performance Optimization**
   - Parallel graph construction
   - Caching strategies
   - Batch API calls
   - Graph database integration (Neo4j)

### Medium Priority

5. **Web UI**
   - Interactive graph visualization
   - Hypothesis exploration interface
   - Real-time progress tracking
   - Collaborative annotation

6. **Data Integration**
   - Additional APIs (Google Scholar, bioRxiv, etc.)
   - Full-text PDF parsing
   - Citation network analysis
   - Experimental data integration

7. **Evaluation Framework**
   - Benchmark datasets
   - Human evaluation tools
   - Automated quality metrics
   - A/B testing framework

### Low Priority but Welcome

8. **Documentation**
   - Tutorial videos
   - Jupyter notebook examples
   - API reference
   - Architecture diagrams

9. **Testing**
   - Integration tests
   - E2E tests for CLI
   - Performance benchmarks
   - Mock services for external APIs

10. **Deployment**
    - Docker containers
    - Cloud deployment guides (AWS, GCP, Azure)
    - CI/CD pipelines
    - Monitoring and logging

## Code Organization

```
src/
├── types/           # TypeScript type definitions
│   └── index.ts     # Central type exports
├── config/          # Configuration management
│   └── default.ts   # Default system config
├── graph/           # Knowledge graph construction and reasoning
│   ├── builder.ts   # Graph construction from papers
│   └── reasoner.ts  # Path sampling and analysis
├── agents/          # Multi-agent system
│   ├── base.ts      # Base agent class
│   └── orchestrator.ts  # Workflow coordination
├── data/            # External data retrieval
│   └── retrieval.ts # API clients for paper databases
├── cli/             # Command-line interface
│   └── generate.ts  # CLI commands
└── index.ts         # Main application class
```

## Adding New Features

### Example: Adding a New Agent

1. **Define agent config in `src/config/default.ts`**
```typescript
experimenter: {
  role: 'experimenter',
  model: 'claude-sonnet-4',
  temperature: 0.5,
  maxTokens: 4000,
  systemPrompt: 'You are an experimental scientist...',
}
```

2. **Add role to types in `src/types/index.ts`**
```typescript
export type AgentRole =
  | 'ontologist'
  | 'scientist_1'
  | 'experimenter'  // New role
  | ...;
```

3. **Implement workflow in `src/agents/orchestrator.ts`**
```typescript
private async runExperimenter(hypothesis: string): Promise<string> {
  const agent = this.agents.get('experimenter');
  // Implementation
}
```

4. **Add tests**
```typescript
describe('Experimenter Agent', () => {
  it('should generate experimental protocols', async () => {
    // Test implementation
  });
});
```

5. **Update documentation**
   - Add to README.md agent list
   - Document in CONTRIBUTING.md
   - Add usage example

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test thoroughly**
   ```bash
   npm run build
   npm test
   npm run typecheck
   npm run lint
   ```

4. **Commit with clear messages**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature
   ```

6. **Create Pull Request**
   - Describe what the PR does
   - Reference related issues
   - Include screenshots/examples if relevant
   - Request review from maintainers

### PR Requirements

- [ ] Code builds without errors
- [ ] All tests pass
- [ ] Type checking passes
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Examples added/updated if relevant
- [ ] CHANGELOG.md updated (for significant changes)

## Code Review Process

- Maintainers will review PRs within 1-2 weeks
- Address feedback and update PR
- Once approved, maintainers will merge

## Questions?

- Open an issue for bug reports or feature requests
- Use discussions for questions and ideas
- Email maintainers for sensitive issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Scientific Hypothesis Agent! 🔬
