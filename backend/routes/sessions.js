const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /sessions — create a new session (hire an agent)
router.post('/', auth, (req, res) => {
  const { agent_id, duration_hours } = req.body;

  if (!agent_id || !duration_hours) {
    return res.status(400).json({ error: 'agent_id and duration_hours are required' });
  }

  if (duration_hours < 0.5 || duration_hours > 24) {
    return res.status(400).json({ error: 'duration_hours must be between 0.5 and 24' });
  }

  try {
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agent_id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const total_cost = agent.rate * duration_hours;

    const stmt = db.prepare(
      'INSERT INTO sessions (user_id, agent_id, duration_hours, total_cost) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(req.user.id, agent_id, duration_hours, total_cost);

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      session_id: result.lastInsertRowid,
      agent_name: agent.name,
      duration_hours,
      total_cost,
      start_time: session.start_time
    });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /sessions — get all sessions for logged-in user
router.get('/', auth, (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT
        s.id, s.start_time, s.duration_hours, s.total_cost,
        a.id as agent_id, a.name as agent_name, a.icon as agent_icon, a.rate as agent_rate
      FROM sessions s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.user_id = ?
      ORDER BY s.start_time DESC
    `).all(req.user.id);

    // Add computed fields
    const enriched = sessions.map(s => {
      const startMs = new Date(s.start_time).getTime();
      const endMs = startMs + s.duration_hours * 3600 * 1000;
      const remainingMs = Math.max(0, endMs - Date.now());
      return {
        ...s,
        end_time: new Date(endMs).toISOString(),
        remaining_ms: remainingMs,
        expired: remainingMs === 0
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /sessions/:id — single session with time remaining
router.get('/:id', auth, (req, res) => {
  try {
    const session = db.prepare(`
      SELECT
        s.id, s.start_time, s.duration_hours, s.total_cost, s.user_id,
        a.id as agent_id, a.name as agent_name, a.icon as agent_icon,
        a.description as agent_description, a.rate as agent_rate
      FROM sessions s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only session owner can view
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const startMs = new Date(session.start_time).getTime();
    const endMs = startMs + session.duration_hours * 3600 * 1000;
    const remainingMs = Math.max(0, endMs - Date.now());

    res.json({
      ...session,
      end_time: new Date(endMs).toISOString(),
      remaining_ms: remainingMs,
      expired: remainingMs === 0
    });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
