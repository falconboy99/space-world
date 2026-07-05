import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function dbError(e) {
  if (e.code === 'DB_NOT_CONFIGURED') {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
  }
  console.error('worlds api error:', e);
  return NextResponse.json({ error: 'database_error' }, { status: 500 });
}

async function parseId(params) {
  const { id } = await params;
  const n = Number.parseInt(id, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Fetch one world including its full config.
export async function GET(request, { params }) {
  const id = await parseId(params);
  if (!id) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  try {
    const { rows } = await query(
      'SELECT id, name, config, updated_at FROM worlds WHERE id = $1',
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ world: rows[0] });
  } catch (e) {
    return dbError(e);
  }
}

export async function DELETE(request, { params }) {
  const id = await parseId(params);
  if (!id) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  try {
    const { rowCount } = await query('DELETE FROM worlds WHERE id = $1', [id]);
    if (!rowCount) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
