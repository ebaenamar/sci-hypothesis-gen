#!/bin/bash

# Test complete integration with Healthcare MCP

echo "🧪 Testing Full Integration with Healthcare MCP"
echo "================================================"
echo ""

# Enable MCP status
export SHOW_MCP_STATUS=true

# Check MCP server
echo "1️⃣ Checking MCP Server..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✅ Healthcare MCP Server is running"
else
    echo "   ❌ MCP Server not running. Start it with:"
    echo "      cd /tmp/healthcare-mcp-public && npm run server:http"
    exit 1
fi

echo ""
echo "2️⃣ Testing direct MCP client..."
node test-mcp-direct.js | head -10

echo ""
echo "3️⃣ Generating hypothesis with MCP integration..."
echo "   Dataset: Boston Children's Hospital (2000 papers)"
echo "   Keywords: congenital heart disease therapy"
echo ""

npm run generate single -- \
  --dataset /Users/e.baena/CascadeProjects/research-semantic-poc/data/aiscientist/data/pubmed_data_2000.csv \
  --keywords congenital heart disease therapy \
  --output ./output 2>&1 | tee /tmp/hypothesis-mcp-output.log | grep -E "Healthcare MCP|Initializing|System initialized|Found.*concepts|novelty|Hypothesis generated|📊"

echo ""
echo "4️⃣ Result summary:"
echo ""

# Check if hypothesis was generated
if [ -f "./output/hypothesis_"*.json ]; then
    LATEST_HYPO=$(ls -t ./output/hypothesis_*.json | head -1)
    echo "   ✅ Hypothesis generated: $(basename $LATEST_HYPO)"
    
    # Extract title
    TITLE=$(cat "$LATEST_HYPO" | grep -o '"title": "[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   📄 Title: $TITLE"
    
    # Check novelty score
    NOVELTY=$(cat "$LATEST_HYPO" | grep -o '"novelty": [0-9.]*' | head -1 | awk '{print $2}')
    echo "   🎯 Novelty: ${NOVELTY}%"
else
    echo "   ❌ No hypothesis generated"
fi

echo ""
echo "Full logs saved to: /tmp/hypothesis-mcp-output.log"
echo ""
