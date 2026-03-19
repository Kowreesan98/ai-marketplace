const express = require('express');
const axios = require('axios');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /chat — send a message in a session
router.post('/', auth, async (req, res) => {
  const { session_id, message } = req.body;

  if (!session_id || !message || !message.trim()) {
    return res.status(400).json({ error: 'session_id and message are required' });
  }

  try {
    // Fetch session with agent
    const session = db.prepare(`
      SELECT s.*, a.system_prompt, a.name as agent_name
      FROM sessions s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.id = ?
    `).get(session_id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify ownership
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // ── SESSION ENFORCEMENT ──────────────────────────────────
    const startMs = new Date(session.start_time).getTime();
    const endMs = startMs + session.duration_hours * 3600 * 1000;

    if (Date.now() > endMs) {
      return res.status(403).json({
        error: 'Session expired',
        message: 'Your session time has ended. Please hire the agent again to continue.'
      });
    }
    // ────────────────────────────────────────────────────────

    // Save user message to DB
    db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(
      session_id, 'user', message.trim()
    );

    // Get conversation history (last 20 messages to avoid token limits)
    const history = db.prepare(`
      SELECT role, content FROM messages
      WHERE session_id = ?
      ORDER BY id ASC
      LIMIT 20
    `).all(session_id);

    // Call MiniMax API
    const minimaxMessages = [
      { role: 'system', content: session.system_prompt },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ];

    let reply;

    try {
      const response = await axios.post(
        'https://api.minimax.chat/v1/text/chatcompletion_v2',
        {
          model: 'abab6.5s-chat',
          messages: minimaxMessages,
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      reply = response.data.choices[0].message.content;
    } catch (apiErr) {
      console.error('MiniMax API error:', apiErr.response?.data || apiErr.message);

      // Fallback: informative error instead of crashing
      return res.status(502).json({
        error: 'AI service unavailable',
        message: 'Could not reach the AI provider. Please check your API key or try again.'
      });
    }

    // Save assistant reply to DB
    db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(
      session_id, 'assistant', reply
    );

    // Calculate remaining time for response
    const remainingMs = Math.max(0, endMs - Date.now());

    res.json({
      reply,
      remaining_ms: remainingMs,
      session_id
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /chat/:session_id — get message history for a session
router.get('/:session_id', auth, (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.session_id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = db.prepare(`
      SELECT id, role, content, created_at
      FROM messages
      WHERE session_id = ?
      ORDER BY id ASC
    `).all(req.params.session_id);

    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
