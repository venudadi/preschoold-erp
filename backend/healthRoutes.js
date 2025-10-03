import express from 'express';
import pool from './db.js';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'preschool-erp-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Database health check
router.get('/db', async (req, res) => {
  try {
    const startTime = Date.now();
    const [rows] = await pool.execute('SELECT 1 as health_check');
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      status: 'OK',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed system health check
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'preschool-erp-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpuUsage: process.cpuUsage()
    },
    checks: {
      database: { status: 'UNKNOWN', responseTime: null },
      websocket: { status: global.io ? 'OK' : 'ERROR' }
    }
  };

  // Database health check
  try {
    const dbStartTime = Date.now();
    await pool.execute('SELECT 1');
    health.checks.database = {
      status: 'OK',
      responseTime: Date.now() - dbStartTime
    };
  } catch (error) {
    health.status = 'DEGRADED';
    health.checks.database = {
      status: 'ERROR',
      error: error.message
    };
  }

  const totalResponseTime = Date.now() - startTime;
  health.responseTime = totalResponseTime;

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Performance metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      database: {
        // Add database pool stats if available
        connectionLimit: pool.config?.connectionLimit || 'N/A',
        connections: {
          // These would need to be tracked if pool supports it
          active: 'N/A',
          idle: 'N/A'
        }
      }
    };

    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;