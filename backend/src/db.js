const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'health.db');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let db = null;

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  initSchema();
  return db;
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS endpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      interval INTEGER NOT NULL DEFAULT 60,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint_id INTEGER NOT NULL,
      status_code INTEGER,
      response_time_ms REAL,
      is_up INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      checked_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (endpoint_id) REFERENCES endpoints(id) ON DELETE CASCADE
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_checks_endpoint_id ON checks(endpoint_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_checks_checked_at ON checks(checked_at)');
  saveDb();
}

async function initDb() {
  await getDb();
}

function rowsToObjects(stmt) {
  const columns = stmt.getColumnNames();
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}

function getAllEndpoints() {
  const stmt = db.prepare('SELECT * FROM endpoints ORDER BY created_at DESC');
  return rowsToObjects(stmt);
}

function getEndpoint(id) {
  const stmt = db.prepare('SELECT * FROM endpoints WHERE id = ?');
  stmt.bind([id]);
  const rows = rowsToObjects(stmt);
  return rows.length > 0 ? rows[0] : null;
}

function addEndpoint(url, name, interval = 60) {
  const stmt = db.prepare('INSERT INTO endpoints (url, name, interval) VALUES (?, ?, ?)');
  stmt.bind([url, name, interval]);
  stmt.step();
  stmt.free();
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  saveDb();
  return getEndpoint(id);
}

function removeEndpoint(id) {
  db.run('DELETE FROM endpoints WHERE id = ?', [id]);
  db.run('DELETE FROM checks WHERE endpoint_id = ?', [id]);
  saveDb();
}

function recordCheck(endpointId, statusCode, responseTimeMs, isUp, error = null) {
  const stmt = db.prepare(
    'INSERT INTO checks (endpoint_id, status_code, response_time_ms, is_up, error) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.bind([endpointId, statusCode, responseTimeMs, isUp ? 1 : 0, error]);
  stmt.step();
  stmt.free();
  saveDb();
}

function getLatestCheck(endpointId) {
  const stmt = db.prepare(
    'SELECT * FROM checks WHERE endpoint_id = ? ORDER BY checked_at DESC LIMIT 1'
  );
  stmt.bind([endpointId]);
  const rows = rowsToObjects(stmt);
  return rows.length > 0 ? rows[0] : null;
}

function getCheckHistory(endpointId, limit = 100) {
  const stmt = db.prepare(
    'SELECT * FROM checks WHERE endpoint_id = ? ORDER BY checked_at DESC LIMIT ?'
  );
  stmt.bind([endpointId, limit]);
  const rows = rowsToObjects(stmt);
  return rows.reverse();
}

module.exports = {
  initDb,
  getDb,
  getAllEndpoints,
  getEndpoint,
  addEndpoint,
  removeEndpoint,
  recordCheck,
  getLatestCheck,
  getCheckHistory,
};
