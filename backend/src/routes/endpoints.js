const express = require('express');
const db = require('../db');
const { runAllChecks, resetTimer } = require('../checker');
const { broadcast } = require('../websocket');

const router = express.Router();

router.get('/', (req, res) => {
  const endpoints = db.getAllEndpoints();
  const enriched = endpoints.map((ep) => {
    const latest = db.getLatestCheck(ep.id);
    return { ...ep, latestCheck: latest || null };
  });
  res.json(enriched);
});

router.post('/', (req, res) => {
  const { url, name, interval } = req.body;
  if (!url || !name) {
    return res.status(400).json({ error: 'url and name are required' });
  }
  try {
    const endpoint = db.addEndpoint(url, name, interval || 60);
    broadcast(JSON.stringify({ type: 'endpoint_added', data: endpoint }));
    res.status(201).json(endpoint);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Endpoint URL already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const endpoint = db.getEndpoint(Number(req.params.id));
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  db.removeEndpoint(endpoint.id);
  broadcast(JSON.stringify({ type: 'endpoint_removed', data: { id: endpoint.id } }));
  res.json({ message: 'Endpoint removed' });
});

router.get('/:id/history', (req, res) => {
  const endpoint = db.getEndpoint(Number(req.params.id));
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 1000);
  const history = db.getCheckHistory(endpoint.id, limit);
  res.json(history);
});

router.post('/check-all', async (req, res) => {
  try {
    const results = await runAllChecks(broadcast);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
