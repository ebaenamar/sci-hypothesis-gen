#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import SciHypothesisAgent from '../index.js';
const program = new Command();
program
    .name('sci-hypothesis-generate')
    .description('Generate scientific hypotheses using AI agents')
    .version('1.0.0');
program
    .command('single')
    .description('Generate a single hypothesis')
    .requiredOption('-d, --dataset <path>', 'Path to CSV dataset')
    .requiredOption('-k, --keywords <keywords...>', 'Keywords for hypothesis generation')
    .option('-o, --output <dir>', 'Output directory', './output')
    .action(async (options) => {
    const spinner = ora('Initializing system...').start();
    try {
        const agent = new SciHypothesisAgent();
        spinner.text = 'Loading dataset and building knowledge graph...';
        await agent.initialize(options.dataset);
        spinner.text = 'Generating hypothesis...';
        const hypothesis = await agent.generateHypothesis(options.keywords);
        spinner.succeed('Hypothesis generated successfully!');
        console.log('\n' + chalk.bold.cyan('='.repeat(80)));
        console.log(chalk.bold.yellow(`📊 ${hypothesis.title}`));
        console.log(chalk.bold.cyan('='.repeat(80)) + '\n');
        console.log(chalk.bold('Summary:'));
        console.log(hypothesis.summary + '\n');
        console.log(chalk.bold('Scores:'));
        console.log(`  Novelty:     ${chalk.green((hypothesis.noveltyScore * 100).toFixed(1) + '%')}`);
        console.log(`  Feasibility: ${chalk.green((hypothesis.feasibilityScore * 100).toFixed(1) + '%')}`);
        console.log(`  Impact:      ${chalk.green((hypothesis.impactScore * 100).toFixed(1) + '%')}\n`);
        spinner.start('Exporting hypothesis...');
        await agent.exportHypothesis(hypothesis, options.output);
        spinner.succeed('Export complete!');
    }
    catch (error) {
        spinner.fail('Error generating hypothesis');
        console.error(chalk.red('\n' + error.message));
        process.exit(1);
    }
});
program
    .command('multiple')
    .description('Generate multiple hypotheses')
    .requiredOption('-d, --dataset <path>', 'Path to CSV dataset')
    .requiredOption('-k, --keywords <keywords...>', 'Keywords for hypothesis generation')
    .option('-n, --count <number>', 'Number of hypotheses to generate', '3')
    .option('-o, --output <dir>', 'Output directory', './output')
    .action(async (options) => {
    const spinner = ora('Initializing system...').start();
    try {
        const agent = new SciHypothesisAgent();
        const count = parseInt(options.count);
        spinner.text = 'Loading dataset and building knowledge graph...';
        await agent.initialize(options.dataset);
        spinner.text = `Generating ${count} hypotheses...`;
        const hypotheses = await agent.generateMultipleHypotheses(options.keywords, count);
        spinner.succeed(`Generated ${hypotheses.length} hypotheses!`);
        for (let i = 0; i < hypotheses.length; i++) {
            const hypothesis = hypotheses[i];
            console.log('\n' + chalk.bold.cyan('='.repeat(80)));
            console.log(chalk.bold.yellow(`📊 Hypothesis ${i + 1}: ${hypothesis.title}`));
            console.log(chalk.bold.cyan('='.repeat(80)) + '\n');
            console.log(chalk.bold('Summary:'));
            console.log(hypothesis.summary + '\n');
            console.log(chalk.bold('Scores:'));
            console.log(`  Novelty:     ${chalk.green((hypothesis.noveltyScore * 100).toFixed(1) + '%')}`);
            console.log(`  Feasibility: ${chalk.green((hypothesis.feasibilityScore * 100).toFixed(1) + '%')}`);
            console.log(`  Impact:      ${chalk.green((hypothesis.impactScore * 100).toFixed(1) + '%')}\n`);
            await agent.exportHypothesis(hypothesis, options.output);
        }
        console.log(chalk.green(`\n✅ All hypotheses exported to ${options.output}/`));
    }
    catch (error) {
        spinner.fail('Error generating hypotheses');
        console.error(chalk.red('\n' + error.message));
        process.exit(1);
    }
});
program
    .command('explore')
    .description('Explore concepts in the knowledge graph')
    .requiredOption('-d, --dataset <path>', 'Path to CSV dataset')
    .requiredOption('-k, --keywords <keywords...>', 'Keywords to search for')
    .action(async (options) => {
    const spinner = ora('Initializing system...').start();
    try {
        const agent = new SciHypothesisAgent();
        spinner.text = 'Loading dataset and building knowledge graph...';
        await agent.initialize(options.dataset);
        spinner.succeed('System ready!');
        agent.exploreConcepts(options.keywords);
    }
    catch (error) {
        spinner.fail('Error exploring concepts');
        console.error(chalk.red('\n' + error.message));
        process.exit(1);
    }
});
program
    .command('bridges')
    .description('Find bridge concepts (high centrality)')
    .requiredOption('-d, --dataset <path>', 'Path to CSV dataset')
    .option('-n, --count <number>', 'Number of bridge concepts to show', '10')
    .action(async (options) => {
    const spinner = ora('Initializing system...').start();
    try {
        const agent = new SciHypothesisAgent();
        spinner.text = 'Loading dataset and building knowledge graph...';
        await agent.initialize(options.dataset);
        spinner.succeed('System ready!');
        agent.findBridgeConcepts(parseInt(options.count));
    }
    catch (error) {
        spinner.fail('Error finding bridge concepts');
        console.error(chalk.red('\n' + error.message));
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=generate.js.map