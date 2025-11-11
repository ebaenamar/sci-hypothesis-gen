// Test Healthcare MCP Client directly
import { HealthcareMCPClient } from './dist/data/healthcare-mcp-client.js';

async function test() {
  console.log('🧪 Testing Healthcare MCP Client...\n');
  
  const client = new HealthcareMCPClient('http://localhost:3000');
  
  // Test health check
  console.log('1️⃣ Testing health check...');
  const isHealthy = await client.healthCheck();
  console.log(`   Result: ${isHealthy ? '✅ Server is healthy' : '❌ Server not responding'}\n`);
  
  if (!isHealthy) {
    console.log('❌ MCP Server not available');
    process.exit(1);
  }
  
  // Test PubMed search
  console.log('2️⃣ Testing PubMed search...');
  console.log('   Query: "congenital heart disease"');
  try {
    const results = await client.searchPubMed('congenital heart disease', 5, '5');
    console.log(`   Result: ✅ Found ${results.length} papers`);
    
    if (results.length > 0) {
      console.log(`   First paper: "${results[0].title.substring(0, 60)}..."`);
    }
  } catch (error) {
    console.log(`   Result: ❌ Error: ${error.message}`);
  }
  
  console.log('\n3️⃣ Testing comprehensive search...');
  console.log('   Query: "pediatric cardiac therapy"');
  try {
    const allResults = await client.searchAll('pediatric cardiac therapy', 5);
    console.log(`   Result: ✅ Found ${allResults.totalResults} papers total`);
    console.log(`   - PubMed: ${allResults.pubmed.length}`);
    console.log(`   - medRxiv: ${allResults.medrxiv.length}`);
    console.log(`   - NCBI: ${allResults.ncbi.length}`);
  } catch (error) {
    console.log(`   Result: ❌ Error: ${error.message}`);
  }
  
  console.log('\n✅ Test complete!');
}

test().catch(console.error);
