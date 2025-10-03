/**
 * Claude API Controller
 * Handles Claude API requests with context caching
 */

import claudeApiWrapper from '../services/claudeApiWrapper.js';
import contextBuilder from '../services/claudeContextBuilder.js';

class ClaudeController {
    /**
     * Query Claude with cached context
     * POST /api/claude/query
     * Body: { query, model?, maxTokens? }
     */
    async query(req, res) {
        try {
            const { query, model, maxTokens } = req.body;

            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    error: 'Query is required and must be a string'
                });
            }

            const userId = req.user?.id || null;

            const result = await claudeApiWrapper.query(query, {
                model,
                maxTokens,
                userId
            });

            res.json({
                success: true,
                ...result,
                message: result.cacheHit
                    ? `Cache hit! Saved $${result.costSaved.toFixed(6)}`
                    : 'Cache miss - context cached for next 5 minutes'
            });

        } catch (error) {
            console.error('❌ Claude query error:', error);
            res.status(500).json({
                error: 'Failed to process Claude query',
                details: error.message
            });
        }
    }

    /**
     * Rebuild project context manually
     * POST /api/claude/rebuild-context
     */
    async rebuildContext(req, res) {
        try {
            await contextBuilder.buildProjectContext();

            res.json({
                success: true,
                message: 'Project context rebuilt successfully'
            });

        } catch (error) {
            console.error('❌ Context rebuild error:', error);
            res.status(500).json({
                error: 'Failed to rebuild context',
                details: error.message
            });
        }
    }

    /**
     * Get cache performance statistics
     * GET /api/claude/stats?days=7
     */
    async getStats(req, res) {
        try {
            const days = parseInt(req.query.days) || 7;

            const stats = await claudeApiWrapper.getCacheStats(days);

            res.json({
                success: true,
                stats,
                period_days: days
            });

        } catch (error) {
            console.error('❌ Stats retrieval error:', error);
            res.status(500).json({
                error: 'Failed to retrieve statistics',
                details: error.message
            });
        }
    }

    /**
     * Get context usage details
     * GET /api/claude/context-usage
     */
    async getContextUsage(req, res) {
        try {
            const usage = await claudeApiWrapper.getContextUsage();

            res.json({
                success: true,
                contexts: usage
            });

        } catch (error) {
            console.error('❌ Context usage retrieval error:', error);
            res.status(500).json({
                error: 'Failed to retrieve context usage',
                details: error.message
            });
        }
    }

    /**
     * Check for changes and rebuild if needed
     * POST /api/claude/check-and-rebuild
     */
    async checkAndRebuild(req, res) {
        try {
            const rebuilt = await contextBuilder.checkAndRebuildIfNeeded();

            res.json({
                success: true,
                rebuilt,
                message: rebuilt
                    ? 'Changes detected, context rebuilt'
                    : 'No changes detected, context up to date'
            });

        } catch (error) {
            console.error('❌ Check and rebuild error:', error);
            res.status(500).json({
                error: 'Failed to check and rebuild',
                details: error.message
            });
        }
    }

    /**
     * Get active contexts
     * GET /api/claude/contexts
     */
    async getActiveContexts(req, res) {
        try {
            const contexts = await contextBuilder.getActiveContexts();

            // Don't send full content (too large), just metadata
            const metadata = contexts.map(ctx => ({
                id: ctx.id,
                type: ctx.context_type,
                tokenCount: ctx.token_count,
                contentPreview: ctx.content.substring(0, 200) + '...'
            }));

            res.json({
                success: true,
                contexts: metadata,
                totalTokens: contexts.reduce((sum, ctx) => sum + ctx.token_count, 0)
            });

        } catch (error) {
            console.error('❌ Get contexts error:', error);
            res.status(500).json({
                error: 'Failed to retrieve contexts',
                details: error.message
            });
        }
    }
}

export default new ClaudeController();
