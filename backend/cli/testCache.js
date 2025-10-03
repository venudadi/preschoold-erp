#!/usr/bin/env node
/**
 * CLI Tool to test Claude caching
 * Usage: node cli/testCache.js "What is the authentication flow?"
 */

import 'dotenv/config';
import claudeApiWrapper from '../services/claudeApiWrapper.js';

async function main() {
    const query = process.argv[2];

    if (!query) {
        console.error('❌ Please provide a query');
        console.log('Usage: node cli/testCache.js "Your question here"');
        process.exit(1);
    }

    console.log('🔍 Query:', query);
    console.log('⏳ Querying Claude with cached context...\n');

    try {
        const result = await claudeApiWrapper.query(query);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESULT');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(result.response);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📈 METRICS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Cache Hit: ${result.cacheHit ? '✅ YES' : '❌ NO'}`);
        console.log(`Input Tokens: ${result.inputTokens}`);
        console.log(`Output Tokens: ${result.outputTokens}`);
        console.log(`Cached Tokens: ${result.cachedTokens}`);
        console.log(`Cost: $${result.cost.toFixed(6)}`);
        console.log(`Saved: $${result.costSaved.toFixed(6)}`);
        console.log(`Response Time: ${result.responseTime}ms`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (result.cacheHit) {
            const savingsPercent = (result.costSaved / (result.cost + result.costSaved) * 100).toFixed(1);
            console.log(`💰 You saved ${savingsPercent}% on this query!`);
        } else {
            console.log('ℹ️  Context is now cached. Next query within 5 minutes will hit cache.');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Query failed:', error.message);
        process.exit(1);
    }
}

main();
