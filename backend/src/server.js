const express = require('express');
const cors = require('cors');
const http = require('http');
const cron = require('node-cron');

const { initWebSocket, broadcast } = require('./websocket');
const { runAllChecks } = require('./checker');
const { initDb } = require('./db');
const endpointsRouter = require('./routes/endpoints');

const app = express();
const PORT = process.env.PORT || 3001;

(async () => {
  await initDb();
  console.log('Database initialized');

app.use(cors());
app.use(express.json());

app.use('/api/endpoints', endpointsRouter);

const server = http.createServer(app);

initWebSocket(server);

cron.schedule('*/10 * * * * *', async () => {
  try {
    const results = await runAllChecks(broadcast);
    if (results.length > 0) {
      console.log(`[Cron] Checked ${results.length} endpoints`);
    }
  } catch (err) {
    console.error('[Cron] Error:', err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
})();
