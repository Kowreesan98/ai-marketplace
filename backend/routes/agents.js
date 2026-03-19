const express = require('express');
const db = require('../database');

const router = express.Router();

// GET /agents — return all agents (no auth required for browsing)
router.get('/', (req, res) => {
  try {
    const agents = db.prepare(
      'SELECT id, name, description, long_description, rate, category, icon FROM agents'
    ).all();
    res.json(agents);
  } catch (err) {
    console.error('Get agents error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /agents/:id — single agent detail
router.get('/:id', (req, res) => {
  try {
    const agent = db.prepare(
      'SELECT id, name, description, long_description, rate, category, icon FROM agents WHERE id = ?'
    ).get(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (err) {
    console.error('Get agent error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
