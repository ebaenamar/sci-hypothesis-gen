/**
 * Programmatic API Example
 *
 * This demonstrates how to use the Scientific Hypothesis Agent
 * as a library in your own TypeScript/JavaScript applications.
 */

import SciHypothesisAgent from '../src/index.js';
import type { Hypothesis } from '../src/types/index.js';

async function main() {
  console.log('🔬 Scientific Hypothesis Agent - Programmatic Example\n');

  // Initialize the agent
  const agent = new SciHypothesisAgent();

  try {
    // Step 1: Load dataset and build knowledge graph
    console.log('📚 Loading dataset...');
    await agent.initialize('./data/papers.csv');
    console.log('✅ Knowledge graph built successfully\n');

    // Step 2: Explore the knowledge graph
    console.log('🔍 Exploring concepts...');
    agent.exploreConcepts(['machine', 'learning', 'biology']);
    console.log('');

    // Step 3: Find bridge concepts for interdisciplinary research
    console.log('🌉 Finding bridge concepts...');
    agent.findBridgeConcepts(5);
    console.log('');

    // Step 4: Generate a single hypothesis (sequential workflow)
    console.log('🎯 Generating hypothesis using sequential workflow...');
    const hypothesis: Hypothesis = await agent.generateHypothesis([
      'neural',
      'plasticity',
      'computation',
    ]);

    console.log('\n📊 Generated Hypothesis:');
    console.log(`Title: ${hypothesis.title}`);
    console.log(`Novelty: ${(hypothesis.noveltyScore * 100).toFixed(1)}%`);
    console.log(`Feasibility: ${(hypothesis.feasibilityScore * 100).toFixed(1)}%`);
    console.log(`Impact: ${(hypothesis.impactScore * 100).toFixed(1)}%\n`);

    // Step 5: Export the hypothesis
    console.log('💾 Exporting hypothesis...');
    await agent.exportHypothesis(hypothesis, './output');
    console.log('');

    // Step 6: Generate multiple hypotheses (flexible workflow)
    console.log('🚀 Generating multiple hypotheses using flexible workflow...');
    const hypotheses: Hypothesis[] = await agent.generateMultipleHypotheses(
      ['quantum', 'materials', 'energy'],
      3
    );

    console.log(`\n📊 Generated ${hypotheses.length} hypotheses:\n`);
    hypotheses.forEach((h, i) => {
      console.log(`${i + 1}. ${h.title}`);
      console.log(`   Novelty: ${(h.noveltyScore * 100).toFixed(1)}%`);
      console.log(`   Feasibility: ${(h.feasibilityScore * 100).toFixed(1)}%`);
      console.log(`   Impact: ${(h.impactScore * 100).toFixed(1)}%\n`);

      // Export each hypothesis
      agent.exportHypothesis(h, './output');
    });

    console.log('✅ All hypotheses generated and exported successfully!');

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

// Advanced usage examples

/**
 * Example: Custom workflow with fine-grained control
 */
async function advancedWorkflow() {
  const agent = new SciHypothesisAgent();
  await agent.initialize('./data/papers.csv');

  // Generate multiple batches with different keyword sets
  const keywordSets = [
    ['neuroscience', 'ai', 'cognition'],
    ['materials', 'sustainability', 'energy'],
    ['quantum', 'computing', 'cryptography'],
  ];

  const allHypotheses: Hypothesis[] = [];

  for (const keywords of keywordSets) {
    console.log(`\nGenerating hypotheses for: ${keywords.join(', ')}`);
    const hypotheses = await agent.generateMultipleHypotheses(keywords, 2);
    allHypotheses.push(...hypotheses);
  }

  // Filter by quality thresholds
  const highQuality = allHypotheses.filter(h =>
    h.noveltyScore > 0.7 &&
    h.feasibilityScore > 0.6 &&
    h.impactScore > 0.7
  );

  console.log(`\n🏆 High-quality hypotheses: ${highQuality.length}/${allHypotheses.length}`);

  // Export high-quality ones
  for (const hypothesis of highQuality) {
    await agent.exportHypothesis(hypothesis, './output/high-quality');
  }
}

/**
 * Example: Batch processing with error handling
 */
async function batchProcessing() {
  const agent = new SciHypothesisAgent();
  await agent.initialize('./data/papers.csv');

  const tasks = [
    ['protein', 'folding', 'prediction'],
    ['climate', 'modeling', 'machine-learning'],
    ['drug', 'discovery', 'ai'],
    ['renewable', 'energy', 'storage'],
  ];

  const results = await Promise.allSettled(
    tasks.map(keywords =>
      agent.generateHypothesis(keywords)
        .then(h => ({ keywords, hypothesis: h }))
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`\n✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  // Export successful ones
  for (const result of successful) {
    if (result.status === 'fulfilled') {
      const { keywords, hypothesis } = result.value;
      console.log(`\n${keywords.join(', ')}: ${hypothesis.title}`);
      await agent.exportHypothesis(
        hypothesis,
        `./output/batch/${keywords[0]}`
      );
    }
  }
}

/**
 * Example: Integration with existing research pipeline
 */
async function researchPipeline() {
  const agent = new SciHypothesisAgent();
  await agent.initialize('./data/papers.csv');

  // Stage 1: Exploration
  console.log('Stage 1: Exploration');
  agent.exploreConcepts(['synthetic', 'biology']);
  const bridges = agent.findBridgeConcepts(10);

  // Stage 2: Hypothesis generation
  console.log('\nStage 2: Hypothesis Generation');
  const hypothesis = await agent.generateHypothesis([
    'synthetic',
    'biology',
    'materials',
  ]);

  // Stage 3: Quality check
  console.log('\nStage 3: Quality Assessment');
  const meetsThreshold =
    hypothesis.noveltyScore > 0.5 &&
    hypothesis.feasibilityScore > 0.6 &&
    hypothesis.impactScore > 0.5;

  if (meetsThreshold) {
    console.log('✅ Hypothesis meets quality thresholds');

    // Stage 4: Export for review
    await agent.exportHypothesis(hypothesis, './output/review-queue');

    // Stage 5: Integration with other systems
    // e.g., Send to lab management system, grant proposal generator, etc.
    console.log('📧 Hypothesis ready for human review');
  } else {
    console.log('❌ Hypothesis below quality threshold, regenerating...');
    // Retry with adjusted parameters
  }
}

// Run the main example
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export examples for use in other modules
export {
  advancedWorkflow,
  batchProcessing,
  researchPipeline,
};
