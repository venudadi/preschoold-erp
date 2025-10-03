#!/usr/bin/env node
/**
 * CLI Tool to show cache statistics
 * Usage: node cli/showStats.js [days]
 */

import 'dotenv/config';
import claudeApiWrapper from '../services/claudeApiWrapper.js';

async function main() {
    const days = parseInt(process.argv[2]) || 7;

    console.log(`📊 Cache Statistics (Last ${days} days)\n`);

    try {
        const stats = await claudeApiWrapper.getCacheStats(days);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📈 OVERALL TOTALS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Total Queries: ${stats.totals.total_queries || 0}`);
        console.log(`Cache Hits: ${stats.totals.total_cache_hits || 0}`);
        console.log(`Cache Hit Rate: ${stats.cache_hit_rate}%`);
        console.log(`Total Cost: $${(stats.totals.total_cost || 0).toFixed(6)}`);
        console.log(`Total Saved: $${(stats.totals.total_saved || 0).toFixed(6)}`);

        if (stats.totals.total_cost > 0) {
            const totalWithoutCache = (stats.totals.total_cost || 0) + (stats.totals.total_saved || 0);
            const savingsPercent = ((stats.totals.total_saved || 0) / totalWithoutCache * 100).toFixed(1);
            console.log(`Savings: ${savingsPercent}% 💰`);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📅 DAILY BREAKDOWN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (stats.daily_stats.length === 0) {
            console.log('No data available for this period.');
        } else {
            stats.daily_stats.forEach(day => {
                console.log(`${day.date}: ${day.total_queries} queries, ${day.cache_hit_rate_percent}% hit rate, $${parseFloat(day.total_saved_usd || 0).toFixed(6)} saved`);
            });
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Show context usage
        const usage = await claudeApiWrapper.getContextUsage();
        console.log('📦 CONTEXT USAGE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        usage.forEach(ctx => {
            console.log(`${ctx.context_type}: ${ctx.query_count || 0} queries, ${ctx.token_count} tokens`);
        });

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Failed to retrieve stats:', error.message);
        process.exit(1);
    }
}

main();
