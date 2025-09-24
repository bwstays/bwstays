// Test script for BWStays Chat Worker
// Run with: node js/test-worker.js

const WORKER_URL = 'https://your-worker-url.your-subdomain.workers.dev/chat';

async function testWorker() {
//  console.log('Testing BWStays Chat Worker...');

  const testMessage = {
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: 'You are BWStays Assistant, a helpful travel guide for Wayanad, Kerala.'
      },
      {
        role: 'user',
        content: 'What are the best waterfalls to visit in Wayanad?'
      }
    ],
    temperature: 0.7,
    max_tokens: 1000
  };

  try {
    //console.log('Sending request to worker...');
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://bwstays.com'
      },
      body: JSON.stringify(testMessage)
    });

    //console.log('Response status:', response.status);
    //console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      //console.log('✅ Success! Response:', data);

      if (data.choices && data.choices[0] && data.choices[0].message) {
       // console.log('\n📝 AI Response:', data.choices[0].message.content);
      }
    } else {
      const errorText = await response.text();
      //console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    //console.log('❌ Network error:', error.message);
  }
}

// Instructions
//console.log('Before running this test:');
//console.log('1. Deploy your worker using: wrangler deploy');
//console.log('2. Update WORKER_URL above with your actual worker URL');
//console.log('3. Ensure GROQ_API_KEY and ALLOWED_ORIGINS secrets are set');
//console.log('\nStarting test in 3 seconds...');

setTimeout(testWorker, 3000);

// Alternative curl command for testing:
//console.log('\nAlternative: Test with curl:');
//console.log(`curl -X POST ${WORKER_URL} \\`);
//console.log('  -H "Content-Type: application/json" \\');
//console.log('  -H "Origin: https://bwstays.com" \\');
//console.log('  -d \'{');
//console.log('    "model": "openai/gpt-oss-120b",');
//console.log('    "messages": [');
//console.log('      {"role": "system", "content": "You are BWStays Assistant."},');
//console.log('      {"role": "user", "content": "Hello!"}');
//console.log('    ],');
//console.log('    "temperature": 0.7,');
//console.log('    "max_tokens": 100');
//console.log('  }\'');