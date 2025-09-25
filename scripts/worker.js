	// Cloudflare Worker for BWStays Chat API
// This worker securely handles LLM requests and keeps the API token on the server side

export default {
  /**
   * Handles incoming requests to the worker
   * @param {Request} request - The incoming request
   * @param {any} env - Environment variables (contains LLMTOKEN)
   * @returns {Promise<Response>} - The response from the LLM API
   */
  async fetch(request, env) {
    return await handleRequest(request, env).catch(
      (err) => new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  },
};

/**
 * Main request handler
 * @param {Request} request - The incoming request
 * @param {any} env - Environment variables
 * @returns {Promise<Response>} - The API response
 */
async function handleRequest(request, env) {
  const url = new URL(request.url);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }

  // Only handle POST requests to /chat endpoint
  if (request.method !== 'POST' || url.pathname !== '/chat') {
    return new Response('Not Found', { status: 404 });
  }

  // Validate API token exists
  if (!env.LLMTOKEN) {
    return new Response(JSON.stringify({ error: 'API token not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse the request body to get chat messages
    const requestData = await request.json();

    // Validate required fields
    if (!requestData.messages || !Array.isArray(requestData.messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare the request to Groq API
    const groqRequest = {
      model: requestData.model || 'openai/gpt-oss-120b',
      messages: requestData.messages,
      temperature: requestData.temperature || 0.7,
      max_tokens: requestData.max_tokens || 1000,
      stream: false // Ensure we get a complete response
    };

    // Make request to Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.LLMTOKEN}`
      },
      body: JSON.stringify(groqRequest)
    });

    // Handle API errors
    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
    //  console.error('Groq API Error:', groqResponse.status, errorText);

      return new Response(JSON.stringify({
        error: `LLM API error: ${groqResponse.status}`,
        details: errorText
      }), {
        status: groqResponse.status,
        headers: {
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        }
      });
    }

    // Parse and return the successful response
    const responseData = await groqResponse.json();

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });

  } catch (error) {
    //console.error('Worker Error:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
  }
}

/**
 * Handle CORS preflight requests
 * @returns {Response} - CORS response
 */
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: getCORSHeaders()
  });
}

/**
 * Get CORS headers for cross-origin requests
 * @returns {Object} - CORS headers object
 */
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // In production, replace with your domain
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Log request details for debugging (optional)
 * @param {Request} request - The request to log
 */
function logRequest(request) {
  console.log({
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  });
}