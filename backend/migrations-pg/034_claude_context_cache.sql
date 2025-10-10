-- Migration 034: Claude Context Caching System
-- Stores project context for Claude API prompt caching to reduce costs by ~90%

-- Table to store project contexts (codebase snapshots)
CREATE TABLE claude_project_contexts (
    id VARCHAR(36) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    context_type VARCHAR(50) CHECK (role IN ('codebase', 'documentation', 'dependencies', 'structure')) NOT NULL,
    content LONGTEXT NOT NULL,
    token_count INT NOT NULL,
    version VARCHAR(50) NOT NULL,
    file_hash VARCHAR(64) NOT NULL COMMENT 'SHA256 hash of content for change detection',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    last_used_at TIMESTAMP NULL,
    INDEX idx_project_name (project_name),
    INDEX idx_context_type (context_type),
    INDEX idx_is_active (is_active),
    INDEX idx_version (version),
    INDEX idx_file_hash (file_hash)
)   ;

-- Table to track context usage and cache performance
CREATE TABLE claude_cache_analytics (
    id VARCHAR(36) PRIMARY KEY,
    context_id VARCHAR(36) NOT NULL,
    query_text TEXT NOT NULL,
    cache_hit BOOLEAN DEFAULT FALSE,
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    cached_tokens INT DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    cost_saved_usd DECIMAL(10, 6) DEFAULT 0,
    response_time_ms INT,
    user_id VARCHAR(36) NULL,
    session_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (context_id) REFERENCES claude_project_contexts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_context_id (context_id),
    INDEX idx_cache_hit (cache_hit),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id)
)   ;

-- Table to store file checksums for change detection
CREATE TABLE claude_file_checksums (
    id VARCHAR(36) PRIMARY KEY,
    context_id VARCHAR(36) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    file_size INT NOT NULL,
    last_modified TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (context_id) REFERENCES claude_project_contexts(id) ON DELETE CASCADE,
    INDEX idx_context_id (context_id),
    INDEX idx_file_path (file_path),
    UNIQUE KEY unique_context_file (context_id, file_path)
)   ;

-- Table to store cache invalidation rules
CREATE TABLE claude_cache_rules (
    id VARCHAR(36) PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    file_pattern VARCHAR(512) NOT NULL COMMENT 'Glob pattern like src/**/*.jsx',
    invalidate_on_change BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    INDEX idx_is_active (is_active),
    INDEX idx_priority (priority)
)   ;

-- Table to store API configuration and usage limits
CREATE TABLE claude_api_config (
    id VARCHAR(36) PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    INDEX idx_config_key (config_key)
)   ;

-- Insert default cache rules
INSERT INTO claude_cache_rules (id, rule_name, file_pattern, invalidate_on_change, priority) VALUES
(UUID(), 'React Components', 'src/components/**/*.{jsx,js,tsx,ts}', TRUE, 10),
(UUID(), 'React Pages', 'src/pages/**/*.{jsx,js,tsx,ts}', TRUE, 9),
(UUID(), 'Utilities', 'src/utils/**/*.{js,ts}', TRUE, 8),
(UUID(), 'Services/API', 'src/services/**/*.{js,ts}', TRUE, 8),
(UUID(), 'Backend Routes', 'backend/**/*Routes.js', TRUE, 10),
(UUID(), 'Backend Controllers', 'backend/controllers/**/*.js', TRUE, 10),
(UUID(), 'Database Migrations', 'backend/migrations/**/*.sql', TRUE, 7),
(UUID(), 'Package Dependencies', 'package.json', TRUE, 5),
(UUID(), 'Backend Dependencies', 'backend/package.json', TRUE, 5),
(UUID(), 'Documentation', '**/*.md', TRUE, 3);

-- Insert default API configuration
INSERT INTO claude_api_config (id, config_key, config_value, description) VALUES
(UUID(), 'min_cache_tokens', '1024', 'Minimum tokens required for prompt caching (Claude API requirement)'),
(UUID(), 'cache_ttl_minutes', '300', 'Cache time-to-live in minutes (5 minutes = 300)'),
(UUID(), 'max_context_size', '100000', 'Maximum tokens for a single context'),
(UUID(), 'enable_caching', 'true', 'Global flag to enable/disable caching'),
(UUID(), 'cost_per_input_token', '0.000003', 'Cost per input token (Claude Sonnet)'),
(UUID(), 'cost_per_output_token', '0.000015', 'Cost per output token (Claude Sonnet)'),
(UUID(), 'cost_per_cached_token', '0.0000003', 'Cost per cached input token (90% reduction)');

-- Create view for cache performance summary
CREATE VIEW claude_cache_performance AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_queries,
    SUM(CASE WHEN cache_hit = TRUE THEN 1 ELSE 0 END) as cache_hits,
    SUM(CASE WHEN cache_hit = FALSE THEN 1 ELSE 0 END) as cache_misses,
    ROUND(SUM(CASE WHEN cache_hit = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as cache_hit_rate_percent,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(cached_tokens) as total_cached_tokens,
    SUM(cost_usd) as total_cost_usd,
    SUM(cost_saved_usd) as total_saved_usd,
    AVG(response_time_ms) as avg_response_time_ms
FROM claude_cache_analytics
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create view for context usage stats
CREATE VIEW claude_context_usage AS
SELECT
    cpc.id,
    cpc.project_name,
    cpc.context_type,
    cpc.version,
    cpc.token_count,
    cpc.is_active,
    COUNT(cca.id) as query_count,
    SUM(CASE WHEN cca.cache_hit = TRUE THEN 1 ELSE 0 END) as cache_hit_count,
    ROUND(AVG(cca.response_time_ms), 2) as avg_response_time_ms,
    SUM(cca.cost_saved_usd) as total_saved_usd,
    cpc.last_used_at,
    cpc.created_at
FROM claude_project_contexts cpc
LEFT JOIN claude_cache_analytics cca ON cpc.id = cca.context_id
GROUP BY cpc.id
ORDER BY query_count DESC;
