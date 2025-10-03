/**
 * Claude Context Builder Service
 * Scans project files and builds cacheable context for Claude API
 * Reduces API costs by ~90% through prompt caching
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../..');

class ClaudeContextBuilder {
    constructor() {
        this.projectName = 'preschool-erp';
        this.minCacheTokens = 1024;
    }

    /**
     * Build complete project context for caching
     */
    async buildProjectContext() {
        try {
            console.log('🔨 Building project context for Claude caching...');

            const contexts = [];

            // 1. Build codebase structure context
            const structureContext = await this.buildStructureContext();
            contexts.push(structureContext);

            // 2. Build dependencies context
            const dependenciesContext = await this.buildDependenciesContext();
            contexts.push(dependenciesContext);

            // 3. Build codebase content context (most important)
            const codebaseContext = await this.buildCodebaseContext();
            contexts.push(codebaseContext);

            // 4. Build documentation context
            const docsContext = await this.buildDocumentationContext();
            contexts.push(docsContext);

            // Store all contexts in database
            for (const context of contexts) {
                await this.storeContext(context);
            }

            console.log(`✅ Built and stored ${contexts.length} context types`);
            return contexts;

        } catch (error) {
            console.error('❌ Failed to build project context:', error);
            throw error;
        }
    }

    /**
     * Build project structure context (files and folders)
     */
    async buildStructureContext() {
        const structure = {
            backend: await this.scanDirectory('backend', ['node_modules', 'dist', 'build']),
            frontend: await this.scanDirectory('frontend', ['node_modules', 'dist', 'build']),
        };

        const content = `# Project Structure

## Backend Structure
\`\`\`
${this.formatDirectoryTree(structure.backend, 'backend')}
\`\`\`

## Frontend Structure
\`\`\`
${this.formatDirectoryTree(structure.frontend, 'frontend')}
\`\`\`
`;

        return {
            type: 'structure',
            content,
            files: [...structure.backend.files, ...structure.frontend.files]
        };
    }

    /**
     * Build dependencies context
     */
    async buildDependenciesContext() {
        const backendPackage = await this.readJSON(path.join(PROJECT_ROOT, 'backend/package.json'));
        const frontendPackage = await this.readJSON(path.join(PROJECT_ROOT, 'frontend/package.json'));

        const content = `# Project Dependencies

## Backend Dependencies (Node.js)
### Production
${JSON.stringify(backendPackage.dependencies || {}, null, 2)}

### Development
${JSON.stringify(backendPackage.devDependencies || {}, null, 2)}

## Frontend Dependencies (React)
### Production
${JSON.stringify(frontendPackage.dependencies || {}, null, 2)}

### Development
${JSON.stringify(frontendPackage.devDependencies || {}, null, 2)}

## Key Technologies
- Backend: Express.js, MySQL, JWT, Socket.IO
- Frontend: React, Material-UI, Vite
- Authentication: JWT with 2FA support
- Real-time: WebSocket (Socket.IO)
`;

        return {
            type: 'dependencies',
            content,
            files: ['backend/package.json', 'frontend/package.json']
        };
    }

    /**
     * Build main codebase context (the most important for caching)
     */
    async buildCodebaseContext() {
        const patterns = [
            'backend/**/*Routes.js',
            'backend/controllers/**/*.js',
            'backend/services/**/*.js',
            'backend/middleware/**/*.js',
            'backend/utils/**/*.js',
            'backend/migrations/**/*.sql',
            'frontend/src/components/**/*.{jsx,js}',
            'frontend/src/pages/**/*.{jsx,js}',
            'frontend/src/services/**/*.{js,jsx}',
            'frontend/src/utils/**/*.{js,jsx}',
            'frontend/src/config/**/*.{js,jsx}'
        ];

        const files = [];
        for (const pattern of patterns) {
            const matches = await glob(pattern, {
                cwd: PROJECT_ROOT,
                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
            });
            files.push(...matches);
        }

        let content = '# Codebase Content\n\n';
        const fileContents = [];

        for (const file of files.slice(0, 50)) { // Limit to first 50 files to avoid huge context
            try {
                const fullPath = path.join(PROJECT_ROOT, file);
                const fileContent = await fs.readFile(fullPath, 'utf8');
                const lines = fileContent.split('\n').length;

                content += `## ${file} (${lines} lines)\n\`\`\`${this.getFileExtension(file)}\n${fileContent.slice(0, 5000)}\n\`\`\`\n\n`;

                fileContents.push({
                    path: file,
                    hash: this.hashContent(fileContent),
                    size: fileContent.length,
                    lines
                });
            } catch (error) {
                // Skip files that can't be read
            }
        }

        return {
            type: 'codebase',
            content,
            files: fileContents
        };
    }

    /**
     * Build documentation context
     */
    async buildDocumentationContext() {
        const docFiles = await glob('**/*.md', {
            cwd: PROJECT_ROOT,
            ignore: ['**/node_modules/**', '**/dist/**']
        });

        let content = '# Project Documentation\n\n';

        for (const file of docFiles.slice(0, 10)) { // Limit to 10 doc files
            try {
                const fullPath = path.join(PROJECT_ROOT, file);
                const docContent = await fs.readFile(fullPath, 'utf8');
                content += `## ${file}\n${docContent.slice(0, 3000)}\n\n`;
            } catch (error) {
                // Skip files that can't be read
            }
        }

        return {
            type: 'documentation',
            content,
            files: docFiles
        };
    }

    /**
     * Store context in database with versioning
     */
    async storeContext(contextData) {
        const { type, content, files } = contextData;
        const contextId = uuidv4();
        const contentHash = this.hashContent(content);
        const tokenCount = this.estimateTokens(content);
        const version = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if identical context already exists
        const [existing] = await pool.query(
            `SELECT id FROM claude_project_contexts
             WHERE project_name = ? AND context_type = ? AND file_hash = ? AND is_active = TRUE`,
            [this.projectName, type, contentHash]
        );

        if (existing.length > 0) {
            console.log(`  ℹ️ Context '${type}' unchanged, skipping...`);
            return existing[0].id;
        }

        // Deactivate old contexts of same type
        await pool.query(
            `UPDATE claude_project_contexts
             SET is_active = FALSE
             WHERE project_name = ? AND context_type = ? AND is_active = TRUE`,
            [this.projectName, type]
        );

        // Insert new context
        await pool.query(
            `INSERT INTO claude_project_contexts
             (id, project_name, context_type, content, token_count, version, file_hash, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [contextId, this.projectName, type, content, tokenCount, version, contentHash]
        );

        // Store file checksums
        if (Array.isArray(files)) {
            for (const file of files) {
                const filePath = typeof file === 'string' ? file : file.path;
                const fileHash = typeof file === 'string' ? '' : file.hash;
                const fileSize = typeof file === 'string' ? 0 : file.size;

                await pool.query(
                    `INSERT INTO claude_file_checksums
                     (id, context_id, file_path, file_hash, file_size, last_modified)
                     VALUES (UUID(), ?, ?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE file_hash = VALUES(file_hash), file_size = VALUES(file_size)`,
                    [contextId, filePath, fileHash, fileSize]
                );
            }
        }

        console.log(`  ✅ Stored ${type} context: ${tokenCount} tokens`);
        return contextId;
    }

    /**
     * Get active contexts for API calls
     */
    async getActiveContexts() {
        const [contexts] = await pool.query(
            `SELECT id, context_type, content, token_count
             FROM claude_project_contexts
             WHERE project_name = ? AND is_active = TRUE
             ORDER BY
                 CASE context_type
                     WHEN 'structure' THEN 1
                     WHEN 'dependencies' THEN 2
                     WHEN 'codebase' THEN 3
                     WHEN 'documentation' THEN 4
                 END`,
            [this.projectName]
        );

        return contexts;
    }

    /**
     * Check if project has changed and rebuild if needed
     */
    async checkAndRebuildIfNeeded() {
        const changedFiles = await this.detectChangedFiles();

        if (changedFiles.length > 0) {
            console.log(`🔄 Detected ${changedFiles.length} changed files, rebuilding context...`);
            await this.buildProjectContext();
            return true;
        }

        console.log('✅ Project context is up to date');
        return false;
    }

    /**
     * Detect changed files since last build
     */
    async detectChangedFiles() {
        // Get active cache rules
        const [rules] = await pool.query(
            `SELECT file_pattern FROM claude_cache_rules
             WHERE is_active = TRUE AND invalidate_on_change = TRUE
             ORDER BY priority DESC`
        );

        const changedFiles = [];

        for (const rule of rules) {
            const pattern = rule.file_pattern;
            const files = await glob(pattern, {
                cwd: PROJECT_ROOT,
                ignore: ['**/node_modules/**', '**/dist/**']
            });

            for (const file of files) {
                const fullPath = path.join(PROJECT_ROOT, file);
                try {
                    const content = await fs.readFile(fullPath, 'utf8');
                    const currentHash = this.hashContent(content);

                    // Check if hash changed
                    const [stored] = await pool.query(
                        `SELECT file_hash FROM claude_file_checksums
                         WHERE file_path = ?
                         ORDER BY created_at DESC LIMIT 1`,
                        [file]
                    );

                    if (stored.length === 0 || stored[0].file_hash !== currentHash) {
                        changedFiles.push(file);
                    }
                } catch (error) {
                    // Skip files that can't be read
                }
            }
        }

        return changedFiles;
    }

    // Utility methods

    async scanDirectory(dir, exclude = []) {
        const files = [];
        const fullPath = path.join(PROJECT_ROOT, dir);

        try {
            const entries = await fs.readdir(fullPath, { withFileTypes: true });

            for (const entry of entries) {
                if (exclude.includes(entry.name)) continue;

                const entryPath = path.join(dir, entry.name);
                files.push(entryPath);

                if (entry.isDirectory()) {
                    const subFiles = await this.scanDirectory(entryPath, exclude);
                    files.push(...subFiles.files);
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }

        return { files };
    }

    formatDirectoryTree(structure, prefix = '') {
        return structure.files.slice(0, 100).map(f => `  ${f}`).join('\n');
    }

    async readJSON(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            return {};
        }
    }

    hashContent(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    estimateTokens(text) {
        // Rough estimate: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    getFileExtension(filePath) {
        const ext = path.extname(filePath).slice(1);
        const extMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'sql': 'sql',
            'json': 'json',
            'md': 'markdown'
        };
        return extMap[ext] || ext;
    }
}

export default new ClaudeContextBuilder();
