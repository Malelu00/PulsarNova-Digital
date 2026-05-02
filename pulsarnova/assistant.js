/* ═══════════════════════════════════════
   NOVA ASSISTANT — assistant.js
   Save as assistant.js and link in index.html
   AFTER script.js:
     <script src="./assistant.js"></script>
════════════════════════════════════════ */

(function () {
  'use strict';

  // ── State ──────────────────────────────
  let isOpen        = false;
  let isLoading     = false;
  let leadShown     = false;
  let leadSubmitted = false;
  const history     = [];

  // ── System prompt ──────────────────────
  const SYSTEM_PROMPT = `You are Nova, the professional AI assistant for PulsarNova Digital — a creative digital agency based in Lesotho that offers Web Development, Graphic Design, Video Editing, and Office Services.

Your role:
1. Answer questions about PulsarNova's services clearly and professionally.
2. Help visitors identify which specific service or sub-service fits their needs and guide them toward booking.
3. Collect lead information (name, email, service interest) naturally — do this after at least 1–2 exchanges, or when they express intent to get started.
4. Maintain a professional, formal tone at all times. No slang or excessive enthusiasm.

SERVICE CATALOGUE:

1. WEB DEVELOPMENT
   - Web Design (Figma): UI/UX design and prototyping using Figma before development begins.
   - Portfolio & Blog Websites: Personal or professional sites to showcase work or publish content.
   - Landing Pages: Single-page sites focused on conversions, promotions, or campaigns.
   - Business Websites: Multi-page professional websites for companies and organisations.
   - Basic E-Commerce Setup: Online stores with product listings, cart, and payment integration.

2. GRAPHIC DESIGN
   - Motion Graphics: Animated visuals for social media, presentations, and video intros/outros.
   - Video Ads: Short-form promotional video advertisements for social platforms.
   - Illustrations: Custom digital artwork and illustrated content.
   - Logo & Poster Design: Brand logos, event posters, and promotional graphics.
   - Books & Flyers: Designed layouts for booklets, catalogues, brochures, and flyers.
   - Signage & Branding: Physical signage design, brand identity systems, and brand guidelines.
   - Corporate Printing: Business cards, letterheads, certificates, and other print collateral.

3. VIDEO EDITING
   - Clients describe their vision (style, mood, length, purpose) and the team brings it to life.
   - Covers promotional videos, social content, event coverage, reels, short films, and more.
   - When a visitor asks about video editing, ask them to describe what they have in mind — style, purpose, target platform, and approximate length.

4. OFFICE SERVICES
   - Data Entry: Accurate and efficient input of data into spreadsheets, databases, or systems.
   - Typing: Transcription and typing of documents, notes, or audio content.
   - Document Formatting: Professional formatting of reports, proposals, and other documents.
   - Resume & CV: Professionally written and designed CVs and resumes tailored to the client's goals. There is also a dedicated CV service — clients can fill in a Google Form and the team handles the rest.
   - Digital Marketing: Social media management, content creation, and basic online marketing support.

Contact: WhatsApp +266 63169903 | YouTube: @pulsarnovadigital | Instagram: @pulsarnova_digital | Facebook: PulsarNova Digital

When a user wants to book or get a quote, let them know the team will follow up and ask for their name, email, and service interest — gather these naturally, not all at once.

If a visitor is unsure which service they need, ask a couple of guiding questions to help them narrow it down, then make a clear recommendation.

Keep responses concise (2–4 sentences unless explaining a service in depth). Be precise and professional. Never fabricate pricing — the team provides tailored quotes.`;

  // ── Helpers ────────────────────────────
  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function scrollBottom() {
    const el = document.getElementById('chatMessages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ── Toggle open/close ──────────────────
  window.toggleChat = function () {
    isOpen = !isOpen;
    const win = document.getElementById('chat-window');
    if (!win) return;
    win.classList.toggle('open', isOpen);
    if (isOpen && history.length === 0) initChat();
  };

  // ── Textarea auto-resize ───────────────
  window.autoResize = function (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
  };

  // ── Enter to send ──────────────────────
  window.handleKey = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      window.sendMessage();
    }
  };

  // ── Render: message bubble ─────────────
  function addMessage(role, text) {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;

    // Remove quick replies when user sends
    if (role === 'user') {
      const qr = document.getElementById('quickReplies');
      if (qr) qr.remove();
    }

    const wrap = document.createElement('div');
    wrap.className = `msg ${role}`;

    const iconHTML = role === 'bot'
      ? `<div class="msg-icon">
           <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
             <circle cx="12" cy="8" r="4" fill="white"/>
             <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
           </svg>
         </div>`
      : '';

    const safeText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    wrap.innerHTML = `
      ${iconHTML}
      <div>
        <div class="msg-bubble">${safeText}</div>
        <div class="msg-time">${nowTime()}</div>
      </div>`;

    msgs.appendChild(wrap);
    scrollBottom();
  }

  // ── Render: typing indicator ───────────
  function showTyping() {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    wrap.id = 'typingIndicator';
    wrap.innerHTML = `
      <div class="msg-icon">
        <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
          <circle cx="12" cy="8" r="4" fill="white"/>
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        </svg>
      </div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    msgs.appendChild(wrap);
    scrollBottom();
  }

  function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  // ── Render: quick reply chips ──────────
  function showQuickReplies(chips) {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;
    const old = document.getElementById('quickReplies');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = 'quick-replies';
    el.id = 'quickReplies';

    chips.forEach(function (label) {
      const btn = document.createElement('button');
      btn.className = 'qr-chip';
      btn.textContent = label;
      btn.onclick = function () { el.remove(); submitMessage(label); };
      el.appendChild(btn);
    });

    msgs.appendChild(el);
    scrollBottom();
  }

  // ── Render: lead capture form ──────────
  function showLeadForm() {
    if (leadShown) return;
    leadShown = true;

    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;

    const form = document.createElement('div');
    form.className = 'lead-form';
    form.id = 'leadForm';
    form.innerHTML = `
      <div class="lead-form-title">YOUR DETAILS</div>
      <input type="text"  id="leadName"    placeholder="Full Name" />
      <input type="email" id="leadEmail"   placeholder="Email Address" />
      <select id="leadService">
        <option value="">Service of interest…</option>
        <option>Web Development</option>
        <option>Graphic Design</option>
        <option>Video Editing</option>
        <option>Office Services</option>
        <option>Not sure yet</option>
      </select>
      <button class="lead-form-submit" id="leadSubmitBtn">SEND TO TEAM →</button>`;

    msgs.appendChild(form);
    document.getElementById('leadSubmitBtn').addEventListener('click', submitLead);
    scrollBottom();
  }

  // ── Submit lead ────────────────────────
  function submitLead() {
    const name    = (document.getElementById('leadName').value || '').trim();
    const email   = (document.getElementById('leadEmail').value || '').trim();
    const service = (document.getElementById('leadService').value || '');

    if (!name || !email) {
      alert('Please enter your name and email address.');
      return;
    }

    // ▶ Wire to your backend/CRM here:
    console.log('PulsarNova lead:', { name, email, service });

    const form = document.getElementById('leadForm');
    if (form) form.remove();
    leadSubmitted = true;

    addMessage('bot',
      `Thank you, ${name}. Your details have been received. A member of the PulsarNova team will contact you at ${email} shortly regarding ${service || 'your requirements'}.`
    );
    showQuickReplies(['Ask another question', 'View our services']);
  }

  // ── Claude API call ────────────────────
  async function callClaude(userText) {
    history.push({ role: 'user', content: userText });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: history
      })
    });

    const data  = await response.json();
    const reply = (data.content && data.content[0] && data.content[0].text)
      || 'I apologise — something went wrong. Please try again.';

    history.push({ role: 'assistant', content: reply });
    return reply;
  }

  // ── Send: triggered by button / Enter ──
  window.sendMessage = async function () {
    const input = document.getElementById('chatInput');
    const text  = (input.value || '').trim();
    if (!text || isLoading) return;
    input.value = '';
    input.style.height = 'auto';
    await submitMessage(text);
  };

  // ── Core submit pipeline ───────────────
  async function submitMessage(text) {
    if (isLoading) return;
    isLoading = true;

    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.disabled = true;

    addMessage('user', text);
    showTyping();

    try {
      const reply = await callClaude(text);
      removeTyping();
      addMessage('bot', reply);

      // Show lead form after 2 bot replies
      const botCount = history.filter(function (m) { return m.role === 'assistant'; }).length;
      if (botCount >= 2 && !leadShown && !leadSubmitted) showLeadForm();

      // Context-aware quick replies
      const lower = text.toLowerCase();
      if (!leadSubmitted && (lower.includes('book') || lower.includes('start') || lower.includes('get started') || lower.includes('quote'))) {
        if (!leadShown) showLeadForm();
      } else if (lower.includes('web') || lower.includes('website') || lower.includes('landing')) {
        showQuickReplies(['Portfolio & Blog', 'Landing Page', 'Business Website', 'E-Commerce']);
      } else if (lower.includes('graphic') || lower.includes('logo') || lower.includes('design') || lower.includes('brand')) {
        showQuickReplies(['Logo & Poster', 'Motion Graphics', 'Signage & Branding', 'Corporate Printing']);
      } else if (lower.includes('video') || lower.includes('edit') || lower.includes('reel')) {
        showQuickReplies(['Describe my video vision', 'Video Ads', 'Talk to the team']);
      } else if (lower.includes('office') || lower.includes('cv') || lower.includes('resume') || lower.includes('data') || lower.includes('typing')) {
        showQuickReplies(['Resume & CV', 'Data Entry', 'Document Formatting', 'Digital Marketing']);
      } else if (lower.includes('service') || lower.includes('what') || lower.includes('help') || lower.includes('do you')) {
        showQuickReplies(['Web Development', 'Graphic Design', 'Video Editing', 'Office Services']);
      } else if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
        showQuickReplies(['Request a quote', 'Contact the team', 'Learn more']);
      }

    } catch (err) {
      removeTyping();
      addMessage('bot', 'I apologise — unable to connect. Please reach us directly via WhatsApp: +266 63169903.');
    }

    isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
  }

  // ── Initial greeting ───────────────────
  function initChat() {
    setTimeout(function () {
      addMessage('bot',
        'Good day. I am Nova, the PulsarNova Digital assistant. I am here to help you learn about our services, answer your questions, or connect you with our team.'
      );
      setTimeout(function () {
        showQuickReplies([
          'What services do you offer?',
          'I need a website',
          'I need a logo or design',
          'I need a CV done'
        ]);
      }, 400);
    }, 300);
  }

  // ── Auto-open after 5s (first visit) ───
  setTimeout(function () {
    if (!isOpen) window.toggleChat();
  }, 5000);

})();
