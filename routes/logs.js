// routes/logs.js
const express = require('express');
const { run, all } = require('../db/database');
const { requireAuth } = require('./auth');
const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { level, limit=100, offset=0 } = req.query;
  let sql = `SELECT l.*, u.username FROM logs l LEFT JOIN users u ON l.user_id=u.id WHERE 1=1`;
  const params = [];
  if (level) { sql += ' AND l.level=?'; params.push(level); }
  sql += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  res.json(all(sql, params));
});

router.post('/', requireAuth, (req, res) => {
  const { level, message } = req.body;
  if (!level||!message) return res.status(400).json({ error:'level y message requeridos' });
  run('INSERT INTO logs (level,message,user_id,ip) VALUES (?,?,?,?)', [level, message, req.user.id, req.ip]);
  res.status(201).json({ message:'Log registrado' });
});

module.exports = router;
