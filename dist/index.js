#!/usr/bin/env node
import 'dotenv/config';
import { GraphBuilder } from './graph/builder.js';
import { GraphReasoner } from './graph/reasoner.js';
import { AgentFactory } from './agents/base.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { DataRetrieval } from './data/retrieval.js';
import { loadConfig } from './config/default.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
/**
 * Main application class for scientific hypothesis generation
 */
export class SciHypothesisAgent {
    graphBuilder;
    graphReasoner;
    agentFactory;
    orchestrator;
    dataRetrieval;
    config = loadConfig();
    constructor() {
        this.graphBuilder = new GraphBuilder();
        this.agentFactory = new AgentFactory(process.env.ANTHROPIC_API_KEY);
        this.dataRetrieval = new DataRetrieval(this.config.dataSources);
    }
    /**
     * Initialize the system with dataset
     */
    async initialize(csvPath) {
        console.log('🔬 Initializing Scientific Hypothesis Agent...\n');
        // Build knowledge graph
        await this.graphBuilder.buildGraph(csvPath);
        // Initialize graph reasoner
        this.graphReasoner = new GraphReasoner(this.graphBuilder.getGraph());
        this.graphReasoner.analyzeGraph();
        // Initialize agents
        const agents = this.agentFactory.createAgents(Object.values(this.config.agents));
        // Initialize orchestrator
        this.orchestrator = new AgentOrchestrator(agents);
        console.log('\n✅ System initialized successfully!\n');
    }
    /**
     * Generate hypothesis using sequential workflow
     */
    async generateHypothesis(keywords) {
        if (!this.graphReasoner || !this.orchestrator) {
            throw new Error('System not initialized. Call initialize() first.');
        }
        console.log(`\n🎯 Generating hypothesis for: ${keywords.join(', ')}\n`);
        // Find concepts matching keywords
        const concepts = this.graphReasoner.searchConcepts(keywords);
        if (concepts.length === 0) {
            throw new Error('No concepts found matching the keywords');
        }
        console.log(`Found ${concepts.length} matching concepts`);
        console.log(`Starting from: ${concepts[0].label}\n`);
        // Find interesting paths from the concept
        const paths = this.graphReasoner.findPaths(concepts[0].id, undefined, {
            pathLength: 4,
            maxResults: 5,
        });
        if (paths.length === 0) {
            throw new Error('No paths found for hypothesis generation');
        }
        console.log(`Sampled ${paths.length} paths through knowledge graph`);
        const selectedPath = paths[0];
        console.log(`Selected path with novelty score: ${selectedPath.novelty.toFixed(3)}\n`);
        console.log(this.graphReasoner.summarizePath(selectedPath));
        // Generate hypothesis using sequential workflow
        const hypothesis = await this.orchestrator.runSequentialWorkflow(selectedPath);
        // Check novelty against external sources
        console.log('\n🔍 Checking novelty against published literature...');
        const noveltyResult = await this.dataRetrieval.checkNovelty(hypothesis.title, hypothesis.summary);
        hypothesis.noveltyScore = noveltyResult.score;
        hypothesis.relatedPapers = noveltyResult.similarPapers;
        console.log(`Novelty assessment: ${noveltyResult.reasoning}\n`);
        return hypothesis;
    }
    /**
     * Generate multiple hypotheses using flexible workflow
     */
    async generateMultipleHypotheses(keywords, count = 3) {
        if (!this.graphReasoner || !this.orchestrator) {
            throw new Error('System not initialized. Call initialize() first.');
        }
        console.log(`\n🎯 Generating ${count} hypotheses for: ${keywords.join(', ')}\n`);
        // Find concepts
        const concepts = this.graphReasoner.searchConcepts(keywords);
        if (concepts.length === 0) {
            throw new Error('No concepts found matching the keywords');
        }
        // Sample multiple diverse paths
        const allPaths = concepts
            .slice(0, Math.min(3, concepts.length))
            .flatMap(concept => this.graphReasoner.findPaths(concept.id, undefined, {
            pathLength: 4,
            maxResults: count * 2,
        }));
        console.log(`Sampled ${allPaths.length} diverse paths\n`);
        // Generate hypotheses using flexible workflow
        const hypotheses = await this.orchestrator.runFlexibleWorkflow(keywords, allPaths);
        // Check novelty for each
        for (const hypothesis of hypotheses) {
            const noveltyResult = await this.dataRetrieval.checkNovelty(hypothesis.title, hypothesis.summary);
            hypothesis.noveltyScore = noveltyResult.score;
            hypothesis.relatedPapers = noveltyResult.similarPapers;
        }
        return hypotheses.slice(0, count);
    }
    /**
     * Explore concept relationships
     */
    exploreConcepts(keywords) {
        if (!this.graphReasoner) {
            throw new Error('System not initialized. Call initialize() first.');
        }
        console.log(`\n🔎 Exploring concepts related to: ${keywords.join(', ')}\n`);
        const concepts = this.graphReasoner.searchConcepts(keywords);
        console.log(`Found ${concepts.length} matching concepts:\n`);
        concepts.slice(0, 10).forEach((concept, i) => {
            const community = this.graphReasoner.getCommunity(concept.id);
            console.log(`${i + 1}. ${concept.label} (${concept.type}, frequency: ${concept.frequency}, community: ${community})`);
        });
    }
    /**
     * Find bridge concepts for interdisciplinary research
     */
    findBridgeConcepts(topN = 10) {
        if (!this.graphReasoner) {
            throw new Error('System not initialized. Call initialize() first.');
        }
        console.log('\n🌉 Finding bridge concepts (high centrality)...\n');
        const bridges = this.graphReasoner.findBridgeConcepts(topN);
        bridges.forEach((concept, i) => {
            const community = this.graphReasoner.getCommunity(concept.id);
            console.log(`${i + 1}. ${concept.label} (${concept.type}, community: ${community})`);
            console.log(`   Papers: ${concept.papers.length}, Frequency: ${concept.frequency}\n`);
        });
    }
    /**
     * Export hypothesis to file
     */
    async exportHypothesis(hypothesis, outputDir = './output') {
        await mkdir(outputDir, { recursive: true });
        const filename = `hypothesis_${hypothesis.id}.json`;
        const filepath = join(outputDir, filename);
        await writeFile(filepath, JSON.stringify(hypothesis, null, 2));
        // Also create markdown version
        const mdFilename = `hypothesis_${hypothesis.id}.md`;
        const mdFilepath = join(outputDir, mdFilename);
        const markdown = this.formatHypothesisMarkdown(hypothesis);
        await writeFile(mdFilepath, markdown);
        console.log(`\n📄 Hypothesis exported to:`);
        console.log(`   JSON: ${filepath}`);
        console.log(`   Markdown: ${mdFilepath}`);
        return filepath;
    }
    /**
     * Format hypothesis as markdown
     */
    formatHypothesisMarkdown(hypothesis) {
        let md = `# ${hypothesis.title}\n\n`;
        md += `**Generated:** ${hypothesis.generatedAt.toISOString()}\n`;
        md += `**Status:** ${hypothesis.status}\n`;
        md += `**Novelty Score:** ${(hypothesis.noveltyScore * 100).toFixed(1)}%\n`;
        md += `**Feasibility Score:** ${(hypothesis.feasibilityScore * 100).toFixed(1)}%\n`;
        md += `**Impact Score:** ${(hypothesis.impactScore * 100).toFixed(1)}%\n\n`;
        md += `## Summary\n\n${hypothesis.summary}\n\n`;
        md += `## Motivation\n\n${hypothesis.motivation}\n\n`;
        md += `## Mechanism\n\n${hypothesis.mechanism}\n\n`;
        md += `## Design Principles\n\n`;
        hypothesis.designPrinciples.forEach((principle, i) => {
            md += `${i + 1}. ${principle}\n`;
        });
        md += '\n';
        md += `## Experimental Priorities\n\n`;
        hypothesis.experimentalPriorities.forEach((priority, i) => {
            md += `${i + 1}. ${priority}\n`;
        });
        md += '\n';
        md += `## Knowledge Graph Path\n\n`;
        md += `**Path Length:** ${hypothesis.graphPath.length}\n`;
        md += `**Novelty Score:** ${hypothesis.graphPath.novelty.toFixed(3)}\n\n`;
        md += '**Concepts:**\n';
        hypothesis.graphPath.nodes.forEach((node, i) => {
            md += `${i + 1}. ${node.label} (${node.type})\n`;
        });
        md += '\n';
        if (hypothesis.critiques && hypothesis.critiques.length > 0) {
            md += `## Critiques\n\n`;
            hypothesis.critiques.forEach(critique => {
                md += `### ${critique.aspect.charAt(0).toUpperCase() + critique.aspect.slice(1)}\n`;
                md += `**Rating:** ${critique.rating}/10\n\n`;
                md += `${critique.comments}\n\n`;
            });
        }
        if (hypothesis.relatedPapers.length > 0) {
            md += `## Related Papers\n\n`;
            hypothesis.relatedPapers.forEach(paper => {
                md += `- **${paper.title}** (${paper.year})\n`;
                if (paper.authors.length > 0) {
                    md += `  Authors: ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ', et al.' : ''}\n`;
                }
                if (paper.doi)
                    md += `  DOI: ${paper.doi}\n`;
                md += '\n';
            });
        }
        return md;
    }
}
// Export main class
export default SciHypothesisAgent;
//# sourceMappingURL=index.js.map