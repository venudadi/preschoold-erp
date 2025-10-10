import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Load env from backend/.env first (ESM-safe), then fallback to root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

// Create a connection pool for PostgreSQL with production-ready settings
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Connection pool settings
  max: process.env.NODE_ENV === 'production' ? 25 : 10, // Max connections
  min: 2, // Minimum connections to keep alive
  idleTimeoutMillis: 900000, // 15 minutes
  connectionTimeoutMillis: 10000, // 10 seconds to establish connection
  // PostgreSQL specific settings
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false // Required for DigitalOcean managed databases
  } : false,
  // Performance
  statement_timeout: 60000, // 60 seconds max query time
  query_timeout: 60000,
});

// Leak detection: warn if a query takes too long
pool.on('acquire', (client) => {
  if (client) {
    client._acquireTimestamp = Date.now();
  }
});

pool.on('release', (client) => {
  if (client && client._acquireTimestamp) {
    const heldMs = Date.now() - client._acquireTimestamp;
    if (heldMs > 30000) { // 30 seconds
      console.warn(`⚠️  PostgreSQL client held for ${heldMs}ms. Possible leak.`);
    }
    delete client._acquireTimestamp;
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err);
});

// Test the connection
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connected successfully!');
  })
  .catch(err => {
    console.error('❌ DATABASE CONNECTION FAILED:', err);
  });

// Helper function to convert MySQL placeholders (?) to PostgreSQL ($1, $2, etc.)
export function convertQuery(sql, params) {
  let index = 0;
  const convertedSql = sql.replace(/\?/g, () => `$${++index}`);
  return { text: convertedSql, values: params };
}

// Wrapper to make PostgreSQL pool work like MySQL2 pool
const poolWrapper = {
  // Direct query method
  async query(sql, params = []) {
    try {
      if (typeof sql === 'string' && params.length > 0) {
        const { text, values } = convertQuery(sql, params);
        const result = await pool.query(text, values);
        // Return in MySQL2 format: [rows, fields]
        return [result.rows, result.fields];
      }
      const result = await pool.query(sql, params);
      return [result.rows, result.fields];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Execute method (alias for query)
  async execute(sql, params = []) {
    return this.query(sql, params);
  },

  // Get connection for transactions
  async getConnection() {
    const client = await pool.connect();

    // Wrap client to match MySQL2 API
    return {
      _client: client,
      _inTransaction: false,

      async query(sql, params = []) {
        try {
          if (typeof sql === 'string' && params.length > 0) {
            const { text, values } = convertQuery(sql, params);
            const result = await client.query(text, values);
            return [result.rows, result.fields];
          }
          const result = await client.query(sql, params);
          return [result.rows, result.fields];
        } catch (error) {
          console.error('Connection query error:', error);
          throw error;
        }
      },

      async execute(sql, params = []) {
        return this.query(sql, params);
      },

      async beginTransaction() {
        await client.query('BEGIN');
        this._inTransaction = true;
      },

      async commit() {
        await client.query('COMMIT');
        this._inTransaction = false;
      },

      async rollback() {
        await client.query('ROLLBACK');
        this._inTransaction = false;
      },

      release() {
        if (this._inTransaction) {
          console.warn('⚠️  Releasing connection while in transaction. Rolling back.');
          this.rollback().then(() => client.release()).catch(() => client.release());
        } else {
          client.release();
        }
      }
    };
  },

  // Original pool reference for direct access if needed
  _pool: pool
};

export default poolWrapper;
