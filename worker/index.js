/**
 * VantagePM License & Feedback Worker
 *
 * Routes:
 *   POST /validate  — license key validation
 *   POST /feedback  — GitHub Issues proxy (keeps token server-side)
 *
 * KV namespace: LICENSES
 *   Keys are license keys (e.g. "VANTAGE-XXXX-XXXX-XXXX")
 *   Values are JSON: {"tier":"pro","email":"user@example.com","active":true}
 *
 * Secrets (set via `wrangler secret put`):
 *   GITHUB_FEEDBACK_TOKEN — fine-grained PAT with Issues: write on the repo
 *
 * CORS: only allows requests from the GitHub Pages origin.
 */

const ALLOWED_ORIGINS = [
  'https://blindgeek1989.github.io',
  'http://localhost:8080',
  'http://localhost:3000',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin);
    }

    // POST /validate
    if (url.pathname === '/validate') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON' }, 400, origin);
      }

      const key = (body.key || '').trim().toUpperCase();
      if (!key) {
        return json({ valid: false, error: 'No key provided' }, 400, origin);
      }

      // Look up the key in KV
      let record;
      try {
        const raw = await env.LICENSES.get(key);
        record = raw ? JSON.parse(raw) : null;
      } catch {
        return json({ error: 'Storage error' }, 500, origin);
      }

      if (!record || !record.active) {
        return json({ valid: false }, 200, origin);
      }

      return json({ valid: true, tier: record.tier || 'pro' }, 200, origin);
    }

    // POST /feedback  — proxy to GitHub Issues
    if (url.pathname === '/feedback') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON' }, 400, origin);
      }

      const { title, bodyText, labels } = body;
      if (!title || !bodyText) {
        return json({ error: 'title and bodyText required' }, 400, origin);
      }

      const githubRes = await fetch(
        'https://api.github.com/repos/blindgeek1989/Vantage-PM/issues',
        {
          method: 'POST',
          headers: {
            Authorization: `token ${env.GITHUB_FEEDBACK_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'VantagePM-Worker/1.0',
          },
          body: JSON.stringify({
            title,
            body: bodyText,
            labels: labels || ['user-feedback'],
          }),
        }
      );

      if (!githubRes.ok) {
        return json({ error: 'GitHub API error', status: githubRes.status }, 502, origin);
      }

      const issue = await githubRes.json();
      return json({ ok: true, url: issue.html_url }, 200, origin);
    }

    return json({ error: 'Not found' }, 404, origin);
  },
};
