import { NextResponse } from 'next/server';
import { query } from '../../../lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function dbError(e) {
  if (e.code === 'DB_NOT_CONFIGURED') {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
  }
  console.error('worlds api error:', e);
  return NextResponse.json({ error: 'database_error' }, { status: 500 });
}

// List saved worlds (metadata only).
export async function GET() {
  try {
    const { rows } = await query(
      'SELECT id, name, updated_at FROM worlds ORDER BY updated_at DESC'
    );
    return NextResponse.json({ worlds: rows });
  } catch (e) {
    return dbError(e);
  }
}

// Save (upsert by name) a world config.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const config = body?.config;
  if (!name || typeof config !== 'object' || config === null) {
    return NextResponse.json({ error: 'name_and_config_required' }, { status: 400 });
  }
  try {
    const { rows } = await query(
      `INSERT INTO worlds (name, config) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET config = EXCLUDED.config, updated_at = now()
       RETURNING id, name, updated_at`,
      [name, JSON.stringify(config)]
    );
    return NextResponse.json({ world: rows[0] });
  } catch (e) {
    return dbError(e);
  }
}
