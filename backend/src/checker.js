const http = require('http');
const https = require('https');
const db = require('./db');

const lastChecked = new Map();

function isDue(endpoint) {
  const intervalMs = (endpoint.interval || 60) * 1000;
  const last = lastChecked.get(endpoint.id);
  if (!last) return true;
  return Date.now() - last >= intervalMs;
}

function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const parsed = new URL(endpoint.url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const start = Date.now();

    const req = lib.get(endpoint.url, { timeout: 30000 }, (res) => {
      const bodyChunks = [];
      res.on('data', (chunk) => bodyChunks.push(chunk));
      res.on('end', () => {
        const responseTime = Date.now() - start;
        const isUp = res.statusCode >= 200 && res.statusCode < 400;
        const result = {
          endpointId: endpoint.id,
          statusCode: res.statusCode,
          responseTimeMs: responseTime,
          isUp,
          error: null,
        };
        db.recordCheck(result.endpointId, result.statusCode, result.responseTimeMs, result.isUp);
        resolve(result);
      });
    });

    req.on('error', (err) => {
      const responseTime = Date.now() - start;
      const result = {
        endpointId: endpoint.id,
        statusCode: null,
        responseTimeMs: responseTime,
        isUp: false,
        error: err.message,
      };
      db.recordCheck(result.endpointId, result.statusCode, result.responseTimeMs, result.isUp, result.error);
      resolve(result);
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - start;
      const result = {
        endpointId: endpoint.id,
        statusCode: null,
        responseTimeMs: responseTime,
        isUp: false,
        error: 'Request timed out',
      };
      db.recordCheck(result.endpointId, result.statusCode, result.responseTimeMs, result.isUp, result.error);
      resolve(result);
    });
  });
}

async function runAllChecks(broadcastFn) {
  const endpoints = db.getAllEndpoints();
  const due = endpoints.filter(isDue);
  if (due.length === 0) return [];

  const results = [];
  for (const ep of due) {
    try {
      const result = await checkEndpoint(ep);
      lastChecked.set(ep.id, Date.now());
      results.push({ ...result, url: ep.url, name: ep.name });
    } catch (err) {
      results.push({
        endpointId: ep.id,
        url: ep.url,
        name: ep.name,
        statusCode: null,
        responseTimeMs: 0,
        isUp: false,
        error: err.message,
      });
    }
  }
  if (broadcastFn && results.length > 0) {
    broadcastFn(JSON.stringify({ type: 'check_results', data: results }));
  }
  return results;
}

function resetTimer(endpointId) {
  lastChecked.set(endpointId, Date.now());
}

module.exports = { checkEndpoint, runAllChecks, resetTimer };
