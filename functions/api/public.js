// GET /api/public – published jobs and candidates (no personal data).
import { json, ensureSchema } from '../../lib/core.js';

export async function onRequestGet({ env }) {
  await ensureSchema(env);
  const jobs = await env.DB.prepare(
    'SELECT id, title, country, sector, pay, description, created_at FROM jobs WHERE published = 1 ORDER BY created_at DESC'
  ).all();
  const candidates = await env.DB.prepare(
    'SELECT id, code, profession, experience, location, nationality, languages, status, photo FROM candidates WHERE published = 1 ORDER BY sort ASC, created_at ASC'
  ).all();
  const list = candidates.results.map(({ id, photo, ...c }) => ({
    ...c,
    photo: photo ? (photo.startsWith('r2:') ? `/api/candphoto/${id}` : photo) : null,
  }));
  return json({ jobs: jobs.results, candidates: list }, 200, { 'cache-control': 'public, max-age=60' });
}
