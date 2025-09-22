import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from backend/.env first (ESM-safe), then fallback to root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

// Create a connection pool for MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Max connections in pool
  queueLimit: 0, // Unlimited queued requests
  connectTimeout: 10000, // 10 seconds
  acquireTimeout: 20000, // 20 seconds
  // Optional: enable namedPlaceholders if needed
  // namedPlaceholders: true
});

// Leak detection: warn if a connection is held too long
pool.on && pool.on('acquire', (connection) => {
  connection._acquireTimestamp = Date.now();
});
pool.on && pool.on('release', (connection) => {
  if (connection._acquireTimestamp) {
    const heldMs = Date.now() - connection._acquireTimestamp;
    if (heldMs > 30000) { // 30 seconds
      console.warn(`⚠️  MySQL connection held for ${heldMs}ms. Possible leak.`);
    }
    delete connection._acquireTimestamp;
  }
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ DATABASE CONNECTION FAILED:', err);
  });

// Use 'export default' for ES Modules
export default pool;
