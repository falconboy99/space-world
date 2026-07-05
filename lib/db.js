import { Pool } from 'pg';

// Lazy singleton Pool + one-time schema bootstrap. All API routes go
// through query(); a missing DATABASE_URL surfaces as DB_NOT_CONFIGURED
// so the UI can degrade gracefully instead of crashing.
let pool = null;
let schemaReady = null;

export function isDbConfigured() {
  return !!process.env.DATABASE_URL;
}

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
    pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

export async function query(text, params) {
  if (!isDbConfigured()) {
    const err = new Error('DATABASE_URL is not set');
    err.code = 'DB_NOT_CONFIGURED';
    throw err;
  }
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS worlds (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        config JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }
  await schemaReady;
  return getPool().query(text, params);
}
