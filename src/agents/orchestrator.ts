import type { BaseAgent } from './base.js';
import type {
  AgentRole,
  WorkflowState,
  GraphPath,
  Hypothesis,
  Critique,
} from '../types/index.js';
import { randomUUID } from 'crypto';

/**
 * Multi-agent orchestrator for hypothesis generation workflows
 */
export class AgentOrchestrator {
  private agents: Map<AgentRole, BaseAgent>;
  private currentState?: WorkflowState;

  constructor(agents: Map<AgentRole, BaseAgent>) {
    this.agents = agents;
  }

  /**
   * Sequential workflow: Ontologist → Scientist 1 → Scientist 2 → Critic
   */
  async runSequentialWorkflow(graphPath: GraphPath): Promise<Hypothesis> {
    console.log('\n=== Starting Sequential Workflow ===\n');

    const workflowId = randomUUID();
    this.currentState = {
      id: workflowId,
      mode: 'sequential',
      currentAgent: 'ontologist',
      messages: [],
      graphPaths: [graphPath],
      metadata: { startTime: new Date() },
    };

    // Step 1: Ontologist analyzes the path
    console.log('Step 1: Ontologist analyzing concept relationships...');
    const ontologyAnalysis = await this.runOntologist(graphPath);

    // Step 2: Scientist 1 generates initial hypothesis
    console.log('\nStep 2: Scientist 1 generating hypothesis...');
    const initialHypothesis = await this.runScientist1(graphPath, ontologyAnalysis);

    // Step 3: Scientist 2 expands and refines
    console.log('\nStep 3: Scientist 2 refining and expanding...');
    const refinedHypothesis = await this.runScientist2(initialHypothesis);

    // Step 4: Critic reviews
    console.log('\nStep 4: Critic reviewing hypothesis...');
    const critiques = await this.runCritic(refinedHypothesis);

    // Compile final hypothesis
    const hypothesis: Hypothesis = {
      id: randomUUID(),
      title: this.extractTitle(refinedHypothesis),
      summary: this.extractSection(refinedHypothesis, 'summary'),
      motivation: this.extractSection(refinedHypothesis, 'motivation'),
      mechanism: this.extractSection(refinedHypothesis, 'mechanism'),
      designPrinciples: this.extractList(refinedHypothesis, 'design principles'),
      experimentalPriorities: this.extractList(refinedHypothesis, 'experimental'),
      graphPath,
      noveltyScore: this.calculateAverageScore(critiques, 'novelty'),
      feasibilityScore: this.calculateAverageScore(critiques, 'feasibility'),
      impactScore: this.calculateAverageScore(critiques, 'impact'),
      relatedPapers: [],
      generatedAt: new Date(),
      status: 'reviewed',
      critiques,
    };

    console.log('\n=== Workflow Complete ===\n');
    return hypothesis;
  }

  /**
   * Flexible workflow: Planner → Assistant (novelty check) → dynamic agents
   */
  async runFlexibleWorkflow(
    keywords: string[],
    graphPaths: GraphPath[]
  ): Promise<Hypothesis[]> {
    console.log('\n=== Starting Flexible Workflow ===\n');

    const workflowId = randomUUID();
    this.currentState = {
      id: workflowId,
      mode: 'flexible',
      currentAgent: 'planner',
      messages: [],
      graphPaths,
      metadata: { keywords, startTime: new Date() },
    };

    // Step 1: Planner develops strategy
    console.log('Step 1: Planner developing research strategy...');
    await this.runPlanner(keywords, graphPaths);

    // Step 2: Generate hypotheses for multiple paths in parallel
    console.log('\nStep 2: Generating hypotheses for selected paths...');
    const hypotheses: Hypothesis[] = [];

    // Select top paths by novelty
    const topPaths = graphPaths
      .sort((a, b) => b.novelty - a.novelty)
      .slice(0, Math.min(3, graphPaths.length));

    for (const path of topPaths) {
      console.log(`\n  Processing path with novelty ${path.novelty.toFixed(3)}...`);

      // Run ontologist + scientist in parallel
      const [_, initialHypothesis] = await Promise.all([
        this.runOntologist(path),
        this.runScientist1(path, ''),
      ]);

      // Refine with scientist 2
      const refinedHypothesis = await this.runScientist2(initialHypothesis);

      // Check novelty with assistant
      console.log('  Checking novelty...');
      const noveltyCheck = await this.runAssistant(refinedHypothesis);

      if (noveltyCheck.isNovel) {
        // Critique if novel
        const critiques = await this.runCritic(refinedHypothesis);

        hypotheses.push({
          id: randomUUID(),
          title: this.extractTitle(refinedHypothesis),
          summary: this.extractSection(refinedHypothesis, 'summary'),
          motivation: this.extractSection(refinedHypothesis, 'motivation'),
          mechanism: this.extractSection(refinedHypothesis, 'mechanism'),
          designPrinciples: this.extractList(refinedHypothesis, 'design principles'),
          experimentalPriorities: this.extractList(
            refinedHypothesis,
            'experimental'
          ),
          graphPath: path,
          noveltyScore: noveltyCheck.score,
          feasibilityScore: this.calculateAverageScore(critiques, 'feasibility'),
          impactScore: this.calculateAverageScore(critiques, 'impact'),
          relatedPapers: [],
          generatedAt: new Date(),
          status: 'reviewed',
          critiques,
        });
      }
    }

    console.log(`\n=== Generated ${hypotheses.length} novel hypotheses ===\n`);
    return hypotheses;
  }

  /**
   * Run ontologist agent
   */
  private async runOntologist(graphPath: GraphPath): Promise<string> {
    const agent = this.agents.get('ontologist');
    if (!agent) throw new Error('Ontologist agent not found');

    const pathDescription = graphPath.nodes.map(n => n.label).join(' → ');
    const edgeTypes = graphPath.edges.map(e => e.type).join(', ');

    const prompt = `Analyze this scientific concept path and describe the relationships:

Path: ${pathDescription}

Relationship types: ${edgeTypes}

For each concept pair, describe:
1. The nature of their relationship
2. The strength of evidence for this relationship
3. Any known interdisciplinary connections
4. Potential for novel combinations

Provide a structured ontological analysis.`;

    return await agent.chat(prompt);
  }

  /**
   * Run scientist 1 agent (initial hypothesis)
   */
  private async runScientist1(
    graphPath: GraphPath,
    ontologyContext: string
  ): Promise<string> {
    const agent = this.agents.get('scientist_1');
    if (!agent) throw new Error('Scientist 1 agent not found');

    const pathDescription = graphPath.nodes.map(n => n.label).join(' → ');

    const prompt = `Generate a novel research hypothesis based on this concept path:

Path: ${pathDescription}
Novelty Score: ${graphPath.novelty.toFixed(3)}

${ontologyContext ? `Ontological Context:\n${ontologyContext}\n` : ''}

Create a comprehensive research hypothesis. You MUST use this EXACT format:

**TITLE**: [Write a clear, descriptive title here]

**SUMMARY**: [Write a 2-3 sentence overview here]

**MOTIVATION**: [Write 1 paragraph explaining why this research matters]

**MECHANISM**: [Write 2-3 paragraphs with detailed explanation of the proposed mechanism]

**DESIGN PRINCIPLES**:
- [Principle 1]
- [Principle 2]
- [Principle 3]
- [Principle 4]
- [Principle 5]

**EXPERIMENTAL PRIORITIES**:
- [Experiment 1]
- [Experiment 2]
- [Experiment 3]
- [Experiment 4]
- [Experiment 5]

Think creatively about connections between these concepts.`;

    return await agent.chat(prompt);
  }

  /**
   * Run scientist 2 agent (refinement)
   */
  private async runScientist2(initialHypothesis: string): Promise<string> {
    const agent = this.agents.get('scientist_2');
    if (!agent) throw new Error('Scientist 2 agent not found');

    const prompt = `Refine and expand this research hypothesis:

${initialHypothesis}

Enhance the proposal by:
1. Adding technical depth and domain-specific details
2. Identifying potential challenges and proposing solutions
3. Discussing scalability and generalizability
4. Connecting to broader research contexts
5. Adding quantitative predictions where possible
6. Suggesting complementary experiments

IMPORTANT: Maintain the EXACT SAME format with **TITLE**, **SUMMARY**, **MOTIVATION**, **MECHANISM**, **DESIGN PRINCIPLES**, and **EXPERIMENTAL PRIORITIES** sections. Just expand the content with more detail.`;

    return await agent.chat(prompt);
  }

  /**
   * Run critic agent
   */
  private async runCritic(hypothesis: string): Promise<Critique[]> {
    const agent = this.agents.get('critic');
    if (!agent) throw new Error('Critic agent not found');

    const prompt = `Critically review this research hypothesis:

${hypothesis}

Evaluate on these dimensions (rate 1-10 and provide detailed comments):

1. **Novelty**: Is this genuinely new research?
2. **Feasibility**: Can this be tested with current methods?
3. **Clarity**: Is the hypothesis well-defined and clear?
4. **Impact**: What is the potential scientific significance?
5. **Methodology**: Are the proposed experiments appropriate?

For each dimension, provide:
- Rating (1-10)
- Detailed comments
- Specific suggestions for improvement

Be constructive but thorough in identifying weaknesses.`;

    const response = await agent.chat(prompt);

    // Parse critique response
    return this.parseCritiques(response);
  }

  /**
   * Run planner agent
   */
  private async runPlanner(
    keywords: string[],
    graphPaths: GraphPath[]
  ): Promise<string> {
    const agent = this.agents.get('planner');
    if (!agent) throw new Error('Planner agent not found');

    const pathSummaries = graphPaths
      .slice(0, 5)
      .map((p, i) => `Path ${i + 1}: ${p.nodes.map(n => n.label).join(' → ')} (novelty: ${p.novelty.toFixed(3)})`)
      .join('\n');

    const prompt = `Develop a research plan for hypothesis generation:

Keywords: ${keywords.join(', ')}

Available concept paths:
${pathSummaries}

Create a strategic plan that:
1. Prioritizes paths based on novelty and potential impact
2. Identifies the most promising interdisciplinary connections
3. Suggests focus areas for hypothesis development
4. Recommends which paths to explore in detail

Provide a structured research strategy.`;

    return await agent.chat(prompt);
  }

  /**
   * Run assistant agent (novelty check)
   */
  private async runAssistant(hypothesis: string): Promise<{ isNovel: boolean; score: number }> {
    const agent = this.agents.get('assistant');
    if (!agent) throw new Error('Assistant agent not found');

    const prompt = `Check the novelty of this research hypothesis:

${hypothesis}

Assess:
1. Is this genuinely novel or does similar work exist?
2. What are the key innovative elements?
3. Are there closely related published works?

Provide a novelty score (0-1) and reasoning.

Format your response as:
NOVELTY_SCORE: [0.0-1.0]
IS_NOVEL: [yes/no]
REASONING: [explanation]`;

    const response = await agent.chat(prompt);

    // Parse response
    const scoreMatch = response.match(/NOVELTY_SCORE:\s*([\d.]+)/i);
    const novelMatch = response.match(/IS_NOVEL:\s*(yes|no)/i);

    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
    const isNovel = novelMatch ? novelMatch[1].toLowerCase() === 'yes' : true;

    return { isNovel, score };
  }

  /**
   * Parse critique response into structured format
   */
  private parseCritiques(response: string): Critique[] {
    const critiques: Critique[] = [];
    const aspects: Critique['aspect'][] = [
      'novelty',
      'feasibility',
      'clarity',
      'impact',
      'methodology',
    ];

    for (const aspect of aspects) {
      const regex = new RegExp(
        `\\*\\*${aspect}\\*\\*[^]*?rating[^\\d]*(\\d+)[^]*?comments?:?\\s*([^]*?)(?=\\*\\*|suggestions?:?|$)`,
        'i'
      );
      const match = response.match(regex);

      if (match) {
        const rating = parseInt(match[1]);
        const comments = match[2].trim();

        critiques.push({
          aspect,
          rating,
          comments,
          suggestions: [],
          reviewer: 'critic',
        });
      }
    }

    return critiques;
  }

  /**
   * Extract title from hypothesis text
   */
  private extractTitle(text: string): string {
    // Try multiple patterns
    const patterns = [
      /\*\*TITLE\*\*:?\s*(.+?)(?=\n\n|\*\*|$)/i,
      /\*\*Title\*\*:?\s*(.+?)(?=\n\n|\*\*|$)/i,
      /^#\s+(.+?)(?=\n|$)/m,
      /Title:?\s*(.+?)(?=\n|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1].trim()) {
        return match[1].trim().replace(/\[|\]/g, '');
      }
    }
    
    return 'Untitled Hypothesis';
  }

  /**
   * Extract section from hypothesis text
   */
  private extractSection(text: string, section: string): string {
    // Try multiple patterns with case-insensitive matching
    const patterns = [
      new RegExp(`\\*\\*${section.toUpperCase()}\\*\\*:?\\s*([^]*?)(?=\\n\\*\\*|$)`, 'i'),
      new RegExp(`\\*\\*${section}\\*\\*:?\\s*([^]*?)(?=\\n\\*\\*|$)`, 'i'),
      new RegExp(`^##\\s+${section}\\s*\\n([^]*?)(?=\\n##|$)`, 'im'),
      new RegExp(`${section}:?\\s*\\n([^]*?)(?=\\n[A-Z][a-z]+:|$)`, 'i'),
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1].trim()) {
        return match[1].trim().replace(/^\[|\]$/g, '');
      }
    }
    
    return '';
  }

  /**
   * Extract list items from section
   */
  private extractList(text: string, section: string): string[] {
    const sectionText = this.extractSection(text, section);
    if (!sectionText) return [];
    
    // Try to match list items with various formats
    const patterns = [
      /^\s*[-*•]\s*(.+?)$/gm,  // Bullet points
      /^\s*\d+[\.)]\s*(.+?)$/gm,  // Numbered lists
      /^\s*\[.+?\]\s*(.+?)$/gm,  // [Label] format
    ];
    
    for (const pattern of patterns) {
      const matches = Array.from(sectionText.matchAll(pattern));
      if (matches.length > 0) {
        return matches.map(m => m[1].trim().replace(/^\[|\]$/g, ''));
      }
    }
    
    // Fallback: split by newlines and filter non-empty
    return sectionText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^\*\*|^##/))
      .slice(0, 10);  // Limit to reasonable number
  }

  /**
   * Calculate average critique score for an aspect
   */
  private calculateAverageScore(
    critiques: Critique[],
    aspect: Critique['aspect']
  ): number {
    const relevant = critiques.filter(c => c.aspect === aspect);
    if (relevant.length === 0) return 0;
    return relevant.reduce((sum, c) => sum + c.rating, 0) / relevant.length / 10;
  }

  /**
   * Get current workflow state
   */
  getState(): WorkflowState | undefined {
    return this.currentState;
  }
}
