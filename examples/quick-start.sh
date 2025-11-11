#!/bin/bash

# Quick Start Guide for Scientific Hypothesis Agent
# This script demonstrates the basic workflows

echo "🔬 Scientific Hypothesis Agent - Quick Start"
echo "============================================="
echo ""

# Check if dataset exists
if [ ! -f "./data/papers.csv" ]; then
    echo "⚠️  No dataset found. Please add a CSV dataset to ./data/"
    echo ""
    echo "Option 1: Clone AI Scientist dataset (Boston Children's Hospital research)"
    echo "  git clone https://github.com/sergeicu/aiscientist.git"
    echo "  cp aiscientist/data/pubmed_data.csv ./data/papers.csv"
    echo "  # Contains ~20,000 PubMed publications"
    echo ""
    echo "Option 2: Use your own dataset with columns:"
    echo "  title, abstract, authors, year, doi, pmid, keywords, journal"
    exit 1
fi

# Check environment
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp .env.example .env
    echo "✏️  Please edit .env and add your ANTHROPIC_API_KEY"
    exit 1
fi

echo "📊 Example 1: Explore Concepts"
echo "------------------------------"
echo "Finding concepts related to 'neural' and 'plasticity'"
npm run explore -- \
    --dataset ./data/papers.csv \
    --keywords neural plasticity

echo ""
echo ""
echo "🌉 Example 2: Find Bridge Concepts"
echo "-----------------------------------"
echo "Discovering high-centrality concepts that connect research domains"
npm run bridges -- \
    --dataset ./data/papers.csv \
    --count 10

echo ""
echo ""
echo "🎯 Example 3: Generate Single Hypothesis"
echo "----------------------------------------"
echo "Generating hypothesis for interdisciplinary research"
npm run generate single \
    --dataset ./data/papers.csv \
    --keywords biomimetic materials composites \
    --output ./output

echo ""
echo ""
echo "🚀 Example 4: Generate Multiple Hypotheses"
echo "-------------------------------------------"
echo "Batch generation with automatic novelty filtering"
npm run generate multiple \
    --dataset ./data/papers.csv \
    --keywords quantum computing cryptography \
    --count 3 \
    --output ./output

echo ""
echo ""
echo "✅ Quick start complete!"
echo ""
echo "📁 Check ./output/ for generated hypotheses"
echo "📖 See README.md for more advanced usage"
