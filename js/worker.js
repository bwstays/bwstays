const DEFAULT_ORIGINS = ['https://www.bwstays.com', 'https://bwstays.com'];
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const MAX_TOKENS_LIMIT = 1000;
const MAX_MESSAGES = 30;
const MAX_BODY_CHARS = 60000;

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    try {
      return await handleRequest(request, env, headers);
    } catch (err) {
      return json({ error: 'Internal server error' }, 500, headers);
    }
  },
};

async function handleRequest(request, env, headers) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'POST' || url.pathname !== '/chat') {
    return json({ error: 'Not Found' }, 404, headers);
  }
  if (!headers['Access-Control-Allow-Origin']) {
    return json({ error: 'Origin not allowed' }, 403, headers);
  }
  if (!env.LLMTOKEN) {
    return json({ error: 'API token not configured' }, 500, headers);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return json({ error: 'Request too large' }, 413, headers);
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, 400, headers);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    return json({ error: 'Invalid request: messages array required' }, 400, headers);
  }
  const messages = body.messages.map((m) => ({
    role: ['system', 'user', 'assistant'].includes(m?.role) ? m.role : 'user',
    content: typeof m?.content === 'string' ? m.content : '',
  }));

  // The client only chooses sampling knobs; the model and ceiling are ours so
  // the endpoint cannot be used as a general-purpose proxy to the LLM account.
  const temperature = Number.isFinite(body.temperature) ? Math.min(Math.max(body.temperature, 0), 1.5) : 0.7;
  const maxTokens = Number.isFinite(body.max_tokens)
    ? Math.min(Math.max(Math.trunc(body.max_tokens), 1), MAX_TOKENS_LIMIT)
    : MAX_TOKENS_LIMIT;

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LLMTOKEN}`,
    },
    body: JSON.stringify({
      model: env.LLM_MODEL || DEFAULT_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!upstream.ok) {
    // Upstream error bodies can echo request content; do not forward them.
    return json({ error: `LLM API error: ${upstream.status}` }, upstream.status === 429 ? 429 : 502, headers);
  }
  return json(await upstream.json(), 200, headers);
}

function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const origins = allowed.length ? allowed : DEFAULT_ORIGINS;
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && origins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
