// db/database.js — SQLite via sql.js (pure JS, no native compilation needed)
const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');
const bcrypt    = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'aquashield.db');

// sql.js works synchronously via a wrapper
// We load/save to disk manually for persistence
let _db = null;

function getDb() { return _db; }

function saveDb() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Synchronous wrapper helpers
function run(sql, params = []) {
  _db.run(sql, params);
  saveDb();
}
function get(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}
function all(sql, params = []) {
  const stmt   = _db.prepare(sql);
  const rows   = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}
function exec(sql) { _db.run(sql); saveDb(); }

// Schema
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    name       TEXT NOT NULL,
    role       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'active',
    last_login TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS clients (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    company    TEXT NOT NULL,
    email      TEXT,
    phone      TEXT,
    status     TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS brands (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    icon       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS files (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    filename    TEXT NOT NULL,
    original    TEXT NOT NULL,
    filetype    TEXT NOT NULL,
    size_bytes  INTEGER NOT NULL,
    brand_id    INTEGER,
    client_id   INTEGER,
    project     TEXT,
    notes       TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    uploaded_by INTEGER,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS queue (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id     INTEGER NOT NULL,
    position    INTEGER NOT NULL DEFAULT 999,
    priority    TEXT NOT NULL DEFAULT 'normal',
    status      TEXT NOT NULL DEFAULT 'queued',
    started_at  TEXT,
    finished_at TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    job_name    TEXT NOT NULL,
    file_id     INTEGER,
    client_id   INTEGER,
    sent_by     INTEGER,
    duration_s  INTEGER,
    status      TEXT NOT NULL DEFAULT 'done',
    error_msg   TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    level      TEXT NOT NULL,
    message    TEXT NOT NULL,
    user_id    INTEGER,
    ip         TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

function seed() {
  // Ejecutar limpieza solo si no se ha activado el modo producción antes
  const isProd = get('SELECT COUNT(*) as c FROM logs WHERE message LIKE "%PRODUCCIÓN%"')?.c || 0;
  if (parseInt(isProd) > 0) return;

  const h = p => bcrypt.hashSync(p, 10);
  const now = new Date().toISOString().replace('T',' ').slice(0,19);

  // Limpieza agresiva de datos de prueba
  exec('DELETE FROM users');
  exec('DELETE FROM clients');
  exec('DELETE FROM brands');
  exec('DELETE FROM files');
  exec('DELETE FROM queue');
  exec('DELETE FROM history');
  exec('DELETE FROM logs');

  // Insertar solo accesos autorizados
  run(`INSERT INTO users (username,password,name,role,status,last_login) VALUES (?,?,?,?,?,?)`, ['sam',          h('admin123'),  'Samuel Santiago', 'admin',    'active', now]);
  run(`INSERT INTO users (username,password,name,role,status,last_login) VALUES (?,?,?,?,?,?)`, ['operador_baq', h('baq2024'),    'Estación BAQ',    'operator', 'active', now]);

  run(`INSERT INTO logs (level,message,ip) VALUES (?,?,?)`, ['ok','Sistema Aqua Shield OPS v2.2.8 — MODO PRODUCCIÓN ACTIVO','127.0.0.1']);
  console.log('✅ PRODUCCIÓN: Base de datos reseteada y limpia.');
}

// ── Init (async because sql.js loads WASM) ─────────────
async function init() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }
  _db.run(SCHEMA);
  saveDb();
  seed();
  console.log('🗄  SQLite listo →', DB_PATH);
}

module.exports = { init, getDb, run, get, all, exec, saveDb };
