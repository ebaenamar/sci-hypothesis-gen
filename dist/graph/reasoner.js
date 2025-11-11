import { bidirectional } from 'graphology-shortest-path';
import louvain from 'graphology-communities-louvain';
import betweennessCentrality from 'graphology-metrics/centrality/betweenness';
/**
 * Graph reasoning engine for scientific discovery
 * Implements path sampling, community detection, and novelty assessment
 */
export class GraphReasoner {
    graph;
    communities;
    centrality;
    constructor(graph) {
        this.graph = graph;
    }
    /**
     * Analyze graph structure and compute metrics
     */
    analyzeGraph() {
        console.log('Analyzing graph structure...');
        // Community detection using Louvain algorithm
        this.communities = new Map();
        const communities = louvain(this.graph, {
            resolution: 1.0,
        });
        Object.entries(communities).forEach(([nodeId, communityId]) => {
            this.communities.set(nodeId, communityId);
        });
        const uniqueCommunities = new Set(this.communities.values());
        console.log(`  Detected ${uniqueCommunities.size} communities`);
        // Betweenness centrality for finding bridge concepts
        this.centrality = new Map();
        const centralityScores = betweennessCentrality(this.graph);
        Object.entries(centralityScores).forEach(([nodeId, score]) => {
            this.centrality.set(nodeId, score);
        });
        const topCentral = Array.from(this.centrality.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        console.log('  Top bridge concepts:');
        topCentral.forEach(([nodeId, score]) => {
            const node = this.graph.getNodeAttributes(nodeId);
            console.log(`    - ${node.label} (centrality: ${score.toFixed(4)})`);
        });
    }
    /**
     * Find paths between concepts with various strategies
     */
    findPaths(sourceId, targetId, params) {
        const maxLength = params?.pathLength || 4;
        const maxResults = params?.maxResults || 10;
        const paths = [];
        if (targetId) {
            // Find shortest paths between specific concepts
            const shortestPath = bidirectional(this.graph, sourceId, targetId);
            if (shortestPath) {
                paths.push(this.constructGraphPath(shortestPath));
            }
        }
        else {
            // Sample diverse paths from source
            paths.push(...this.sampleDiversePaths(sourceId, maxLength, maxResults));
        }
        // Calculate novelty scores
        paths.forEach(path => {
            path.novelty = this.calculateNoveltyScore(path);
        });
        // Sort by novelty
        paths.sort((a, b) => b.novelty - a.novelty);
        return paths.slice(0, maxResults);
    }
    /**
     * Sample diverse paths using random walks with constraints
     */
    sampleDiversePaths(sourceId, maxLength, maxPaths) {
        const paths = [];
        const visitedPaths = new Set();
        let attempts = 0;
        const maxAttempts = maxPaths * 10;
        while (paths.length < maxPaths && attempts < maxAttempts) {
            attempts++;
            const path = this.randomWalk(sourceId, maxLength);
            const pathKey = path.map(n => n).join('->');
            // Skip if we've seen this path
            if (visitedPaths.has(pathKey))
                continue;
            visitedPaths.add(pathKey);
            // Skip too short paths
            if (path.length < 2)
                continue;
            paths.push(this.constructGraphPath(path));
        }
        return paths;
    }
    /**
     * Random walk through graph with biased selection
     */
    randomWalk(startId, maxLength) {
        const path = [startId];
        const visited = new Set([startId]);
        let current = startId;
        for (let i = 0; i < maxLength - 1; i++) {
            const neighbors = this.graph.outNeighbors(current);
            const unvisited = neighbors.filter(n => !visited.has(n));
            if (unvisited.length === 0)
                break;
            // Bias towards cross-community connections for novelty
            const next = this.selectNextNode(current, unvisited);
            path.push(next);
            visited.add(next);
            current = next;
        }
        return path;
    }
    /**
     * Select next node with preference for cross-community jumps
     */
    selectNextNode(currentId, candidates) {
        if (!this.communities) {
            // Random selection if no community info
            return candidates[Math.floor(Math.random() * candidates.length)];
        }
        const currentCommunity = this.communities.get(currentId);
        const scores = candidates.map(nodeId => {
            const nodeCommunity = this.communities.get(nodeId);
            const edge = this.graph.getEdgeAttributes(currentId, nodeId);
            const baseScore = edge.weight || 0.5;
            // Boost score for cross-community connections
            const communityBonus = nodeCommunity !== currentCommunity ? 2.0 : 1.0;
            return baseScore * communityBonus;
        });
        // Weighted random selection
        const totalScore = scores.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalScore;
        for (let i = 0; i < candidates.length; i++) {
            random -= scores[i];
            if (random <= 0)
                return candidates[i];
        }
        return candidates[candidates.length - 1];
    }
    /**
     * Construct GraphPath object from node IDs
     */
    constructGraphPath(nodeIds) {
        const nodes = [];
        const edges = [];
        let totalWeight = 0;
        for (let i = 0; i < nodeIds.length; i++) {
            const node = this.graph.getNodeAttributes(nodeIds[i]);
            nodes.push(node);
            if (i < nodeIds.length - 1) {
                const edge = this.graph.getEdgeAttributes(nodeIds[i], nodeIds[i + 1]);
                edges.push(edge);
                totalWeight += edge.weight;
            }
        }
        return {
            nodes,
            edges,
            length: nodeIds.length,
            totalWeight,
            novelty: 0, // Calculated separately
        };
    }
    /**
     * Calculate novelty score based on path characteristics
     */
    calculateNoveltyScore(path) {
        if (!this.communities)
            return 0.5;
        let score = 0;
        // Factor 1: Cross-community transitions (0-1)
        let communityChanges = 0;
        for (let i = 0; i < path.nodes.length - 1; i++) {
            const comm1 = this.communities.get(path.nodes[i].id);
            const comm2 = this.communities.get(path.nodes[i + 1].id);
            if (comm1 !== comm2)
                communityChanges++;
        }
        const crossCommunityScore = communityChanges / (path.nodes.length - 1);
        // Factor 2: Edge weakness (weaker edges = more surprising) (0-1)
        const avgWeight = path.totalWeight / path.edges.length;
        const edgeNoveltyScore = 1 - Math.min(avgWeight, 1.0);
        // Factor 3: Path length (longer = more complex/novel) (0-1)
        const lengthScore = Math.min(path.length / 6, 1.0);
        // Factor 4: Bridge concepts (high centrality = known bridges) (0-1)
        const avgCentrality = this.centrality
            ? path.nodes.reduce((sum, n) => sum + (this.centrality.get(n.id) || 0), 0) /
                path.nodes.length
            : 0.5;
        const bridgeScore = 1 - Math.min(avgCentrality * 10, 1.0);
        // Weighted combination
        score =
            crossCommunityScore * 0.4 +
                edgeNoveltyScore * 0.3 +
                lengthScore * 0.2 +
                bridgeScore * 0.1;
        return Math.min(Math.max(score, 0), 1);
    }
    /**
     * Find most central concepts (potential research hubs)
     */
    findBridgeConcepts(topN = 20) {
        if (!this.centrality) {
            this.analyzeGraph();
        }
        return Array.from(this.centrality.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([nodeId]) => this.graph.getNodeAttributes(nodeId));
    }
    /**
     * Find concepts by keyword search
     */
    searchConcepts(keywords) {
        const results = [];
        const keywordLower = keywords.map(k => k.toLowerCase());
        this.graph.forEachNode((_nodeId, attrs) => {
            const node = attrs;
            const label = node.label.toLowerCase();
            if (keywordLower.some(k => label.includes(k))) {
                results.push(node);
            }
        });
        // Sort by frequency (popularity)
        results.sort((a, b) => b.frequency - a.frequency);
        return results;
    }
    /**
     * Get community information for a concept
     */
    getCommunity(conceptId) {
        return this.communities?.get(conceptId);
    }
    /**
     * Get concepts in the same community
     */
    getCommunityConcepts(communityId, limit = 20) {
        if (!this.communities)
            return [];
        const concepts = [];
        this.graph.forEachNode((nodeId, attrs) => {
            if (this.communities.get(nodeId) === communityId) {
                concepts.push(attrs);
            }
        });
        return concepts.slice(0, limit);
    }
    /**
     * Generate path summary for hypothesis context
     */
    summarizePath(path) {
        const conceptLabels = path.nodes.map(n => n.label);
        const communities = path.nodes.map(n => this.getCommunity(n.id));
        let summary = `Path through ${path.length} concepts:\n`;
        for (let i = 0; i < path.nodes.length; i++) {
            summary += `  ${i + 1}. ${conceptLabels[i]} [community ${communities[i]}]`;
            if (i < path.edges.length) {
                summary += ` --[${path.edges[i].type}, weight: ${path.edges[i].weight.toFixed(3)}]--> `;
            }
            summary += '\n';
        }
        summary += `\nNovelty score: ${path.novelty.toFixed(3)}`;
        summary += `\nAverage edge weight: ${(path.totalWeight / path.edges.length).toFixed(3)}`;
        return summary;
    }
}
//# sourceMappingURL=reasoner.js.map