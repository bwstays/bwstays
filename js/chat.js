// (function(){
//   const chatBtn = document.getElementById('btn-chat');
//   const chatModal = document.getElementById('chat-modal');
//   const chatClose = document.getElementById('chat-close');
//   const chatBody = document.getElementById('chat-body');
//   const chatInput = document.getElementById('chat-input');
//   const chatSend = document.getElementById('chat-send');
//   const typingEl = document.getElementById('chat-typing');

//   if(!chatBtn || !chatModal) return;

//   function toggleModal(forceOpen){
//     const shouldOpen = forceOpen !== undefined ? forceOpen : !chatModal.classList.contains('open');
//     if(shouldOpen){
//       chatModal.classList.add('open');
//       setTimeout(()=> chatInput?.focus(), 50);
//     } else {
//       chatModal.classList.remove('open');
//     }
//   }

//   chatBtn.addEventListener('click', ()=> toggleModal(true));
//   chatClose.addEventListener('click', ()=> toggleModal(false));

//   // Enable/disable send button based on input
//   chatInput.addEventListener('input', ()=>{
//     const hasText = chatInput.value.trim().length > 0;
//     chatSend.disabled = !hasText;
//   });

//   function appendMessage(role, text){
//     const msg = document.createElement('div');
//     msg.className = `chat-message ${role === 'user' ? 'user-message' : 'bot-message'}`;

//     const avatar = document.createElement('div');
//     avatar.className = 'message-avatar';
//     avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-headset"></i>';

//     const content = document.createElement('div');
//     content.className = 'message-content';
//     // Use textContent to avoid injecting any HTML/links and not interfere with page URLs
//     content.textContent = text;

//     msg.appendChild(avatar);
//     msg.appendChild(content);
//     chatBody.appendChild(msg);
//     chatBody.scrollTop = chatBody.scrollHeight;
//   }

//   function isOnTopic(text){
//     const t = (text || '').toLowerCase();
//     const keywords = [
//       'bwstays', 'bw stays', 'wayanad', 'kalpetta', 'vythiri', 'lakkidi', 'sultan bathery', 'mananthavady',
//       'villa', 'resort', 'homestay', 'stay', 'booking', 'reservation', 'check-in', 'check out', 'checkin', 'checkout',
//       'attraction', 'things to do', 'trek', 'waterfall', 'dam', 'lake', 'temple', 'wildlife', 'sanctuary',
//       'amenities', 'pool', 'wifi', 'breakfast', 'parking', 'pet friendly', 'ac', 'air conditioning',
//       'price', 'prices', 'rate', 'rates', 'cost', 'availability', 'rooms', 'room', 'night', 'per night',
//       'cancellation', 'refund', 'policy', 'policies', 'terms', 'check-in time', 'check-out time',
//       'contact', 'phone', 'whatsapp', 'email', 'support', 'customer care',
//       'location', 'address', 'map', 'directions', 'near', 'nearby', 'distance', 'airport', 'railway', 'bus',
//       'season', 'weather', 'monsoon', 'summer', 'winter'
//     ];
//     return keywords.some(k => t.includes(k));
//   }
  
//   async function sendToGroq(messages){
//     const apK = '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';
//     if(!apk){
//       throw new Error('Missing . Please set window. before using chat.');
//     }

//     const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${apk}`
//       },
//       body: JSON.stringify({
//         model: 'openai/gpt-oss-120b',
//         messages,
//         temperature: 0.7
//       })
//     });

//     if(!resp.ok){
//       const txt = await resp.text();
//       throw new Error(`Groq API error: ${resp.status} ${txt}`);
//     }

//     const data = await resp.json();
//     const choice = data.choices && data.choices[0];
//     const content = choice && choice.message && choice.message.content;
//     return content || 'Sorry, I could not generate a response.';
//   }

//   const systemPrompt = {
//     role: 'system',
//     content: 'You are a helpful travel assistant for BWStays.com - answer ONLY questions related to Wayanad accommodations, attractions, and travel experiences. Do not provide information about other websites, bookings on other platforms, or modify any URLs. Focus exclusively on BWStays services, Wayanad destinations, local attractions, and travel tips for the region. Be concise, friendly, and helpful.'
//   };
//   let chatHistory = [systemPrompt];

//   async function handleSend(){
//     const text = chatInput.value.trim();
//     if(!text) return;

//     appendMessage('user', text);
//     chatHistory.push({ role: 'user', content: text });
//     chatInput.value = '';
//     chatSend.disabled = true;

//     // Off-topic guard: refuse gracefully without calling the API
//     if(!isOnTopic(text)){
//       appendMessage('assistant', 'I can help with BWStays and Wayanad-related questions only (stays, attractions, travel info). Please ask something related to BWStays/Wayanad.');
//       chatSend.disabled = false;
//       return;
//     }

//     typingEl.style.display = 'flex';

//     try{
//       const reply = await sendToGroq(chatHistory);
//       appendMessage('assistant', reply);
//       chatHistory.push({ role: 'assistant', content: reply });
//     }catch(err){
//       console.error(err);
//       appendMessage('assistant', 'There was an error contacting the AI. Please try again later.');
//     }finally{
//       typingEl.style.display = 'none';
//     }
//   }

//   chatSend.addEventListener('click', handleSend);
//   chatInput.addEventListener('keydown', (e)=>{
//     if(e.key === 'Enter' && !e.shiftKey && !chatSend.disabled){
//       e.preventDefault();
//       handleSend();
//     }
//   });
// })();