#!/bin/bash

# Test script for Healthcare MCP integration
# This script tests hypothesis generation with Healthcare MCP retrieval

echo "🧪 Testing Sci-Hypothesis-Gen with Healthcare MCP Integration"
echo "=============================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Enable MCP status logging for this test
export SHOW_MCP_STATUS=true

# Check if Healthcare MCP server is running
echo -e "${YELLOW}Checking Healthcare MCP Server...${NC}"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthcare MCP Server is running!${NC}"
    echo "   System will use enhanced retrieval automatically"
    echo ""
else
    echo -e "${YELLOW}ℹ️  Healthcare MCP Server not detected at localhost:3000${NC}"
    echo "   System will use standard API retrieval (this is normal)"
    echo ""
    echo "   To enable enhanced retrieval (optional):"
    echo "   1. Clone: git clone https://github.com/Cicatriiz/healthcare-mcp-public.git"
    echo "   2. Install: cd healthcare-mcp-public && npm install"
    echo "   3. Start: npm run dev"
    echo ""
fi

# Test with small dataset
echo -e "${YELLOW}Test 1: Small dataset (15 papers)${NC}"
echo "Dataset: ./data/sample_papers.csv"
echo "Keywords: machine learning drug discovery"
echo ""

npm run generate single -- \
  --dataset ./data/sample_papers.csv \
  --keywords machine learning drug discovery \
  --output ./output/mcp-test

echo ""
echo "---"
echo ""

# Test with Boston Children's Hospital dataset (if available)
DATASET_2K="/Users/e.baena/CascadeProjects/research-semantic-poc/data/aiscientist/data/pubmed_data_2000.csv"

if [ -f "$DATASET_2K" ]; then
    echo -e "${YELLOW}Test 2: Boston Children's Hospital dataset (2000 papers)${NC}"
    echo "Dataset: pubmed_data_2000.csv"
    echo "Keywords: congenital heart disease therapy"
    echo ""
    
    npm run generate single -- \
      --dataset "$DATASET_2K" \
      --keywords congenital heart disease therapy \
      --output ./output/mcp-test
    
    echo ""
    echo "---"
    echo ""
else
    echo -e "${YELLOW}Test 2: Skipped (dataset not found)${NC}"
    echo "Boston Children's Hospital dataset not available at:"
    echo "$DATASET_2K"
    echo ""
fi

# Summary
echo ""
echo -e "${GREEN}✅ Testing complete!${NC}"
echo ""
echo "Check the logs above to see:"
echo "  - ✅ = Healthcare MCP was used (faster, no rate limits)"
echo "  - ⚠️  = Fallback APIs were used (may encounter rate limits)"
echo ""
echo "Generated hypotheses are in: ./output/mcp-test/"
echo ""
