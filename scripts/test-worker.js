const WORKER_URL = 'https://your-worker-url.your-subdomain.workers.dev/chat';
async function testWorker() {
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
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.bwstays.com'
      },
      body: JSON.stringify(testMessage)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
      }
    } else {
      const errorText = await response.text();
    }
  } catch (error) {
  }
}
setTimeout(testWorker, 3000);
