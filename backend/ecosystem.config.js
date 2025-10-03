module.exports = {
  apps: [{
    name: 'preschool-erp-api',
    script: './index.js',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',

    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 5001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },

    // Logging configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Performance and reliability settings
    max_restarts: 5,
    min_uptime: '10s',
    max_memory_restart: '1G',

    // Advanced settings
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Auto restart settings
    autorestart: true,
    watch: false, // Set to true for development if needed
    ignore_watch: ['node_modules', 'logs', 'uploads'],

    // Source map support
    source_map_support: true,

    // Instance settings for cluster mode
    instance_var: 'INSTANCE_ID',

    // Health check
    health_check_grace_period: 10000,

    // Performance monitoring
    pmx: false // Disable PMX monitoring by default
  }],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/preschool-erp.git',
      path: '/var/www/preschool-erp',
      'post-deploy': 'npm ci --production && npm run migrate && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};