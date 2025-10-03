#!/usr/bin/env node
/**
 * CLI Tool to build Claude context cache
 * Usage: node cli/buildContext.js
 */

import 'dotenv/config';
import contextBuilder from '../services/claudeContextBuilder.js';

async function main() {
    console.log('🚀 Starting context build...\n');

    try {
        await contextBuilder.buildProjectContext();
        console.log('\n✅ Context build completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Context build failed:', error);
        process.exit(1);
    }
}

main();
