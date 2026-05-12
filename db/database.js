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
  const count = get('SELECT COUNT(*) as c FROM users')?.c || 0;
  if (parseInt(count) > 0) return;

  const h = p => bcrypt.hashSync(p, 10);
  const now = new Date().toISOString().replace('T',' ').slice(0,19);

  run(`INSERT INTO users (username,password,name,role,status,last_login) VALUES (?,?,?,?,?,?)`, ['sam',          h('admin123'),  'Samuel Santiago', 'admin',    'active', now]);
  run(`INSERT INTO users (username,password,name,role,status,last_login) VALUES (?,?,?,?,?,?)`, ['operador_baq', h('baq2024'),    'Estación BAQ',    'operator', 'active', now]);
  run(`INSERT INTO users (username,password,name,role,status,last_login) VALUES (?,?,?,?,?,?)`, ['design_01',    h('design123'), 'Diseño Senior',   'designer', 'active', now]);

  const clients = [
    ['Carlos Mendoza','AutoGlass Baq','cmendoza@autoglass.co','3001234567','active'],
    ['Sandra Ríos','VehiculosTotal','srios@vtotal.co','3109876543','active'],
    ['Jorge Herrera','JK Autos','jherrera@jkautos.co','3205551234','active'],
    ['Paola Suárez','Multimarca','psuarez@multimarca.co','3154443322','active'],
    ['Andrés Palomino','Flota Caribe','apalomino@flotacaribe.co','3006665544','pending'],
    ['Luisa Ospino','CarsDesign','lospino@carsdesign.co','3119998877','active'],
    ['Roberto Díaz','Barranquilla Motors','rdiaz@bqmotors.co','3177776655','active'],
  ];
  clients.forEach(c => run(`INSERT INTO clients (name,company,email,phone,status) VALUES (?,?,?,?,?)`, c));

  const brands = [
    ['BMW','🚗'], ['Toyota','🛻'], ['Ford','🚜'], ['Mercedes','🏎️'], ['Audi','🚘']
  ];
  brands.forEach(b => run(`INSERT INTO brands (name,icon) VALUES (?,?)`, b));

  const files = [
    ['bmw_x5_wrap.ai','BMW_X5_wrap.ai','.ai',25500000,1,1,'BMW X5 Wrap Completo','pending',1],
    ['fordRanger_fullkit.eps','FordRanger_fullkit.eps','.eps',19600000,3,2,'Ford Ranger Kit Lateral','printing',2],
    ['toyota_hilux_logo.svg','Toyota_Hilux_logo.svg','.svg',1200000,2,5,'Toyota Hilux Logo','pending',3],
  ];
  files.forEach(f => run(`INSERT INTO files (filename,original,filetype,size_bytes,brand_id,client_id,project,status,uploaded_by) VALUES (?,?,?,?,?,?,?,?,?)`, f));

  [[2,1,'high','printing'],[1,2,'normal','queued'],[5,3,'urgent','queued'],[4,4,'normal','queued']].forEach(q =>
    run(`INSERT INTO queue (file_id,position,priority,status) VALUES (?,?,?,?)`, q));

  [
    ['BMW X5 Wrap Completo',1,1,1,2700,'done'],
    ['Ford Ranger Kit Lateral',2,2,2,2280,'done'],
    ['Mazda3 Diseño',3,3,3,1800,'done'],
    ['Kia Sportage Vinilo',4,4,2,1320,'done'],
    ['Error comunicación plotter',5,5,2,0,'error'],
  ].forEach(h2 => run(`INSERT INTO history (job_name,file_id,client_id,sent_by,duration_s,status) VALUES (?,?,?,?,?,?)`, h2));

  run(`INSERT INTO logs (level,message,ip) VALUES (?,?,?)`, ['ok','Sistema iniciado — Aqua Shield OPS v2.1','127.0.0.1']);
  run(`INSERT INTO logs (level,message,ip) VALUES (?,?,?)`, ['ok','Seed inicial completado','127.0.0.1']);
  console.log('✅ Base de datos sembrada.');
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
