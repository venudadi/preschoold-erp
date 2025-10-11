import pool from '../db.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Claude Context Caching Utility
 * Implements prompt caching to reduce API costs by ~90%
 * Based on Claude API's prompt caching feature
 */

class ClaudeContextCache {
  constructor() {
    this.minCacheTokens = 1024; // Claude API requirement
    this.cacheTTL = 300; // 5 minutes in seconds
  }

  /**
   * Initialize cache configuration from database
   */
  async loadConfig() {
    try {
      const [configs] = await pool.query(
        'SELECT config_key, config_value FROM claude_api_config WHERE config_key IN (?, ?, ?, ?)',
        ['min_cache_tokens', 'cache_ttl_minutes', 'max_context_size', 'enable_caching']
      );

      configs.forEach(({ config_key, config_value }) => {
        if (config_key === 'min_cache_tokens') this.minCacheTokens = parseInt(config_value);
        if (config_key === 'cache_ttl_minutes') this.cacheTTL = parseInt(config_value) * 60;
        if (config_key === 'max_context_size') this.maxContextSize = parseInt(config_value);
        if (config_key === 'enable_caching') this.enabled = config_value === 'true';
      });
    } catch (err) {
      console.error('Failed to load cache config:', err.message);
    }
  }

  /**
   * Calculate SHA256 hash of content
   */
  hash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Store or update project context
   * @param {string} projectName - Name of the project
   * @param {string} contextType - Type: 'codebase', 'documentation', 'dependencies', 'structure'
   * @param {string} content - The actual context content
   * @param {number} tokenCount - Estimated token count
   * @param {string} version - Version identifier
   * @returns {string} Context ID
   */
  async storeContext(projectName, contextType, content, tokenCount, version) {
    const contextId = uuidv4();
    const fileHash = this.hash(content);

    await pool.query(
      `INSERT INTO claude_project_contexts
       (id, project_name, context_type, content, token_count, version, file_hash, is_active, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE
         content = VALUES(content),
         token_count = VALUES(token_count),
         version = VALUES(version),
         file_hash = VALUES(file_hash),
         last_used_at = NOW(),
         updated_at = NOW()`,
      [contextId, projectName, contextType, content, tokenCount, version, fileHash]
    );

    console.log(`✅ Stored context: ${projectName} (${contextType}) - ${tokenCount} tokens`);
    return contextId;
  }

  /**
   * Get active context by project and type
   * @param {string} projectName
   * @param {string} contextType
   * @returns {Object|null} Context object or null
   */
  async getContext(projectName, contextType) {
    const [contexts] = await pool.query(
      `SELECT id, content, token_count, version, file_hash, created_at, last_used_at
       FROM claude_project_contexts
       WHERE project_name = ? AND context_type = ? AND is_active = TRUE
       ORDER BY updated_at DESC LIMIT 1`,
      [projectName, contextType]
    );

    if (contexts.length === 0) return null;

    // Update last_used_at
    await pool.query(
      'UPDATE claude_project_contexts SET last_used_at = NOW() WHERE id = ?',
      [contexts[0].id]
    );

    return contexts[0];
  }

  /**
   * Check if context needs updating based on file changes
   * @param {string} contextId
   * @param {Array<{path: string, hash: string, size: number, modified: Date}>} files
   * @returns {boolean} True if context needs update
   */
  async needsUpdate(contextId, files) {
    const [checksums] = await pool.query(
      'SELECT file_path, file_hash FROM claude_file_checksums WHERE context_id = ?',
      [contextId]
    );

    const oldChecksums = new Map(checksums.map(c => [c.file_path, c.file_hash]));

    // Check if any file has changed
    for (const file of files) {
      const oldHash = oldChecksums.get(file.path);
      if (!oldHash || oldHash !== file.hash) {
        return true;
      }
    }

    // Check if files were deleted
    if (oldChecksums.size !== files.length) {
      return true;
    }

    return false;
  }

  /**
   * Update file checksums for a context
   * @param {string} contextId
   * @param {Array<{path: string, hash: string, size: number, modified: Date}>} files
   */
  async updateChecksums(contextId, files) {
    // Delete old checksums
    await pool.query('DELETE FROM claude_file_checksums WHERE context_id = ?', [contextId]);

    // Insert new checksums
    const values = files.map(file => [
      uuidv4(),
      contextId,
      file.path,
      file.hash,
      file.size,
      file.modified
    ]);

    if (values.length > 0) {
      await pool.query(
        `INSERT INTO claude_file_checksums
         (id, context_id, file_path, file_hash, file_size, last_modified)
         VALUES ?`,
        [values]
      );
    }
  }

  /**
   * Log analytics for a query
   * @param {string} contextId
   * @param {Object} data - {queryText, cacheHit, inputTokens, outputTokens, cachedTokens, responseTime, userId, sessionId}
   */
  async logAnalytics(contextId, data) {
    const {
      queryText,
      cacheHit = false,
      inputTokens,
      outputTokens,
      cachedTokens = 0,
      responseTime,
      userId = null,
      sessionId = null
    } = data;

    // Calculate costs
    const [config] = await pool.query(
      `SELECT config_key, config_value FROM claude_api_config
       WHERE config_key IN ('cost_per_input_token', 'cost_per_output_token', 'cost_per_cached_token')`
    );

    const costs = {};
    config.forEach(({ config_key, config_value }) => {
      costs[config_key] = parseFloat(config_value);
    });

    const normalInputTokens = inputTokens - cachedTokens;
    const costUsd =
      (normalInputTokens * costs.cost_per_input_token) +
      (cachedTokens * costs.cost_per_cached_token) +
      (outputTokens * costs.cost_per_output_token);

    // Calculate cost saved (what it would have been without caching)
    const costWithoutCache =
      (inputTokens * costs.cost_per_input_token) +
      (outputTokens * costs.cost_per_output_token);
    const costSavedUsd = costWithoutCache - costUsd;

    await pool.query(
      `INSERT INTO claude_cache_analytics
       (id, context_id, query_text, cache_hit, input_tokens, output_tokens,
        cached_tokens, cost_usd, cost_saved_usd, response_time_ms, user_id, session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        contextId,
        queryText,
        cacheHit,
        inputTokens,
        outputTokens,
        cachedTokens,
        costUsd,
        costSavedUsd,
        responseTime,
        userId,
        sessionId
      ]
    );

    return { costUsd, costSavedUsd };
  }

  /**
   * Get cache performance statistics
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Object} Performance stats
   */
  async getPerformanceStats(startDate = null, endDate = null) {
    let query = 'SELECT * FROM claude_cache_performance';
    const params = [];

    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const [stats] = await pool.query(query, params);
    return stats;
  }

  /**
   * Get context usage statistics
   * @param {string} projectName - Optional project filter
   * @returns {Array} Usage stats
   */
  async getContextUsage(projectName = null) {
    let query = 'SELECT * FROM claude_context_usage';
    const params = [];

    if (projectName) {
      query += ' WHERE project_name = ?';
      params.push(projectName);
    }

    const [usage] = await pool.query(query, params);
    return usage;
  }

  /**
   * Invalidate (deactivate) contexts matching file patterns
   * @param {Array<string>} changedFiles - List of changed file paths
   */
  async invalidateContexts(changedFiles) {
    // Get active cache rules
    const [rules] = await pool.query(
      'SELECT file_pattern FROM claude_cache_rules WHERE is_active = TRUE AND invalidate_on_change = TRUE'
    );

    // For each changed file, check if it matches any rule pattern
    for (const file of changedFiles) {
      for (const rule of rules) {
        // Simple glob matching (you might want to use a library like minimatch for production)
        const pattern = rule.file_pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
        const regex = new RegExp(`^${pattern}$`);

        if (regex.test(file)) {
          // Find contexts affected by this file
          const [contexts] = await pool.query(
            `SELECT DISTINCT context_id FROM claude_file_checksums WHERE file_path = ?`,
            [file]
          );

          // Deactivate affected contexts
          for (const { context_id } of contexts) {
            await pool.query(
              'UPDATE claude_project_contexts SET is_active = FALSE WHERE id = ?',
              [context_id]
            );
            console.log(`🔄 Invalidated context ${context_id} due to file change: ${file}`);
          }
        }
      }
    }
  }

  /**
   * Build a cacheable context for Claude API
   * This returns the context in the format expected by Claude's prompt caching
   * @param {string} projectName
   * @param {string} contextType
   * @returns {Object|null} Formatted context for Claude API
   */
  async buildCacheableContext(projectName, contextType) {
    const context = await this.getContext(projectName, contextType);

    if (!context) return null;

    // Only cache if content is large enough
    if (context.token_count < this.minCacheTokens) {
      console.log(`⚠️  Context too small for caching (${context.token_count} < ${this.minCacheTokens} tokens)`);
      return null;
    }

    // Return in Claude API format with cache_control
    return {
      type: 'text',
      text: context.content,
      cache_control: { type: 'ephemeral' } // Claude prompt caching marker
    };
  }
}

// Export singleton instance
const claudeCache = new ClaudeContextCache();

export default claudeCache;
