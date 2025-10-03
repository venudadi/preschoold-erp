/**
 * Claude API Wrapper with Prompt Caching
 * Reduces API costs by ~90% through intelligent context caching
 */

import Anthropic from '@anthropic-ai/sdk';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import contextBuilder from './claudeContextBuilder.js';

class ClaudeApiWrapper {
    constructor() {
        this.client = null;
        this.config = {};
        this.init();
    }

    async init() {
        // Initialize Anthropic client
        const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            console.warn('⚠️ Claude API key not configured');
            return;
        }

        this.client = new Anthropic({
            apiKey: apiKey
        });

        // Load configuration from database
        await this.loadConfig();

        console.log('✅ Claude API wrapper initialized with caching support');
    }

    async loadConfig() {
        const [configs] = await pool.query(
            'SELECT config_key, config_value FROM claude_api_config'
        );

        this.config = {};
        for (const { config_key, config_value } of configs) {
            // Parse numeric values
            if (config_value === 'true' || config_value === 'false') {
                this.config[config_key] = config_value === 'true';
            } else if (!isNaN(config_value)) {
                this.config[config_key] = parseFloat(config_value);
            } else {
                this.config[config_key] = config_value;
            }
        }
    }

    /**
     * Query Claude with context caching
     * @param {string} userQuery - The user's question/request
     * @param {object} options - Additional options
     * @returns {Promise<object>} - Claude's response with cache analytics
     */
    async query(userQuery, options = {}) {
        const startTime = Date.now();

        try {
            if (!this.client) {
                throw new Error('Claude API not configured');
            }

            if (!this.config.enable_caching) {
                console.log('⚠️ Caching disabled, using standard API call');
                return await this.queryWithoutCache(userQuery, options);
            }

            // Check if context needs rebuilding
            await contextBuilder.checkAndRebuildIfNeeded();

            // Get active contexts
            const contexts = await contextBuilder.getActiveContexts();

            if (contexts.length === 0) {
                console.log('⚠️ No contexts found, building...');
                await contextBuilder.buildProjectContext();
                return await this.query(userQuery, options); // Retry with new context
            }

            // Calculate total tokens
            const totalContextTokens = contexts.reduce((sum, ctx) => sum + ctx.token_count, 0);

            if (totalContextTokens < this.config.min_cache_tokens) {
                console.log(`⚠️ Context too small (${totalContextTokens} tokens), min ${this.config.min_cache_tokens} required`);
                return await this.queryWithoutCache(userQuery, options);
            }

            // Build system message with cache control
            const systemMessages = this.buildCachedSystemMessages(contexts);

            // Make API call with caching
            const model = options.model || 'claude-sonnet-4-20250514';
            const maxTokens = options.maxTokens || 4096;

            const response = await this.client.messages.create({
                model: model,
                max_tokens: maxTokens,
                system: systemMessages,
                messages: [
                    {
                        role: 'user',
                        content: userQuery
                    }
                ]
            });

            const responseTime = Date.now() - startTime;

            // Track analytics
            const analytics = await this.trackAnalytics({
                contexts,
                userQuery,
                response,
                responseTime,
                userId: options.userId
            });

            // Convert USD cost to INR for API consumers; DB still records USD fields
            const usdToInr = parseFloat(process.env.USD_TO_INR || '83');
            const costInInr = Math.round((analytics.cost_usd || 0) * usdToInr * 100) / 100;
            const costSavedInInr = Math.round((analytics.cost_saved_usd || 0) * usdToInr * 100) / 100;

            return {
                success: true,
                response: response.content[0].text,
                usage: response.usage,
                cacheHit: (response.usage.cache_read_input_tokens || 0) > 0,
                cachedTokens: response.usage.cache_read_input_tokens || 0,
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                // cost/costSaved are provided in INR for frontend display (configurable via USD_TO_INR)
                cost: costInInr,
                costSaved: costSavedInInr,
                // Original USD values still available in analytics.* and DB columns
                responseTime: responseTime
            };

        } catch (error) {
            console.error('❌ Claude API error:', error);
            throw error;
        }
    }

    /**
     * Build system messages with cache control points
     */
    buildCachedSystemMessages(contexts) {
        const messages = [];

        // Add contexts in order with cache breakpoints
        for (let i = 0; i < contexts.length; i++) {
            const isLast = i === contexts.length - 1;

            messages.push({
                type: 'text',
                text: contexts[i].content,
                // Enable caching on the last context block
                ...(isLast && {
                    cache_control: { type: 'ephemeral' }
                })
            });
        }

        // Add instruction after cached context
        messages.push({
            type: 'text',
            text: `You are an expert developer working on the Preschool ERP system. Use the above codebase context to answer questions accurately. Focus on the actual implementation in the code.`
        });

        return messages;
    }

    /**
     * Query without caching (fallback)
     */
    async queryWithoutCache(userQuery, options = {}) {
        const startTime = Date.now();

        const response = await this.client.messages.create({
            model: options.model || 'claude-sonnet-4-20250514',
            max_tokens: options.maxTokens || 4096,
            messages: [
                {
                    role: 'user',
                    content: userQuery
                }
            ]
        });

        const responseTime = Date.now() - startTime;

        return {
            success: true,
            response: response.content[0].text,
            usage: response.usage,
            cacheHit: false,
            cachedTokens: 0,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            responseTime: responseTime
        };
    }

    /**
     * Track analytics and calculate cost savings
     */
    async trackAnalytics({ contexts, userQuery, response, responseTime, userId }) {
        const usage = response.usage;

        const inputTokens = usage.input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;
        const cachedTokens = usage.cache_read_input_tokens || 0;
        const cacheCreationTokens = usage.cache_creation_input_tokens || 0;

        // Calculate costs
        const costPerInputToken = this.config.cost_per_input_token || 0.000003;
        const costPerOutputToken = this.config.cost_per_output_token || 0.000015;
        const costPerCachedToken = this.config.cost_per_cached_token || 0.0000003;

        // Actual cost with caching
        const actualCost = (
            (inputTokens * costPerInputToken) +
            (outputTokens * costPerOutputToken) +
            (cachedTokens * costPerCachedToken) +
            (cacheCreationTokens * costPerInputToken * 1.25) // Cache writes cost 25% more
        );

        // Cost without caching (what it would have been)
        const totalInputTokens = inputTokens + cachedTokens;
        const costWithoutCache = (
            (totalInputTokens * costPerInputToken) +
            (outputTokens * costPerOutputToken)
        );

        const costSaved = costWithoutCache - actualCost;
        const cacheHit = cachedTokens > 0;

        // Store analytics for each context used
        for (const context of contexts) {
            await pool.query(
                `INSERT INTO claude_cache_analytics
                 (id, context_id, query_text, cache_hit, input_tokens, output_tokens,
                  cached_tokens, cost_usd, cost_saved_usd, response_time_ms, user_id, session_id)
                 VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UUID())`,
                [
                    context.id,
                    userQuery.substring(0, 1000), // Limit query text length
                    cacheHit,
                    inputTokens,
                    outputTokens,
                    cachedTokens,
                    actualCost,
                    costSaved,
                    responseTime,
                    userId || null
                ]
            );

            // Update last used timestamp
            await pool.query(
                'UPDATE claude_project_contexts SET last_used_at = NOW() WHERE id = ?',
                [context.id]
            );
        }

        return {
            cache_hit: cacheHit,
            cost_usd: actualCost,
            cost_saved_usd: costSaved,
            savings_percent: costWithoutCache > 0 ? (costSaved / costWithoutCache * 100).toFixed(2) : 0
        };
    }

    /**
     * Get cache performance statistics
     */
    async getCacheStats(days = 7) {
        const [stats] = await pool.query(
            `SELECT * FROM claude_cache_performance
             WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             ORDER BY date DESC`,
            [days]
        );

        const [totals] = await pool.query(
            `SELECT
                COUNT(*) as total_queries,
                SUM(CASE WHEN cache_hit = TRUE THEN 1 ELSE 0 END) as total_cache_hits,
                SUM(cost_usd) as total_cost,
                SUM(cost_saved_usd) as total_saved
             FROM claude_cache_analytics
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [days]
        );

        return {
            daily_stats: stats,
            totals: totals[0],
            cache_hit_rate: totals[0].total_queries > 0
                ? (totals[0].total_cache_hits / totals[0].total_queries * 100).toFixed(2)
                : 0
        };
    }

    /**
     * Get context usage details
     */
    async getContextUsage() {
        const [usage] = await pool.query(
            'SELECT * FROM claude_context_usage ORDER BY query_count DESC'
        );

        return usage;
    }

    /**
     * Rebuild project context manually
     */
    async rebuildContext() {
        console.log('🔨 Manually rebuilding project context...');
        await contextBuilder.buildProjectContext();
        console.log('✅ Context rebuild complete');
    }
}

export default new ClaudeApiWrapper();
