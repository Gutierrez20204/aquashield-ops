// server.js — Agua Shield OPS · Node.js + Express + sql.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health
app.get('/api/health', (req, res) => res.json({ status:'ok', version:'2.1.0', uptime: Math.round(process.uptime())+'s' }));

// Routes (loaded after DB init)
function loadRoutes() {
  app.use('/api/auth',    require('./routes/auth'));
  app.use('/api/files',   require('./routes/files'));
  app.use('/api/queue',   require('./routes/queue'));
  app.use('/api/clients', require('./routes/clients'));
  app.use('/api/history', require('./routes/history'));
  app.use('/api/users',   require('./routes/users'));
  app.use('/api/logs',    require('./routes/logs'));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
  app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Archivo demasiado grande' });
    res.status(500).json({ error: err.message || 'Error interno' });
  });
}

// Boot
db.init().then(() => {
  loadRoutes();
  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════╗
  ║  🛡  AGUA SHIELD OPS  v2.1.0         ║
  ║  📡  http://localhost:${PORT}           ║
  ║  🗄  SQLite · /db/aquashield.db       ║
  ╚══════════════════════════════════════╝
    `);
  });
}).catch(err => { console.error('Error iniciando DB:', err); process.exit(1); });

module.exports = app;
