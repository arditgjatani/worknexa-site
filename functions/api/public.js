// GET /api/public – published jobs and candidates (no personal data).
import { json, ensureSchema } from '../../lib/core.js';

export async function onRequestGet({ env }) {
  await ensureSchema(env);
  const jobs = await env.DB.prepare(
    'SELECT id, title, country, sector, pay, description, created_at FROM jobs WHERE published = 1 ORDER BY created_at DESC'
  ).all();
  const candidates = await env.DB.prepare(
    'SELECT code, profession, experience, location, nationality, languages, status FROM candidates WHERE published = 1 ORDER BY sort ASC, created_at ASC'
  ).all();
  return json({ jobs: jobs.results, candidates: candidates.results }, 200, { 'cache-control': 'public, max-age=60' });
}
