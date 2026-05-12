// routes/clients.js
const express = require('express');
const { run, get, all } = require('../db/database');
const { requireAuth }   = require('./auth');
const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { q } = req.query;
  let sql = `SELECT c.*,
    (SELECT COUNT(*) FROM history h WHERE h.client_id=c.id) as total_jobs,
    (SELECT MAX(h2.created_at) FROM history h2 WHERE h2.client_id=c.id) as last_job
    FROM clients c WHERE 1=1`;
  const params = [];
  if (q) { sql += ' AND (c.name LIKE ? OR c.company LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY c.created_at DESC';
  res.json(all(sql, params));
});

router.get('/:id', requireAuth, (req, res) => {
  const client = get('SELECT * FROM clients WHERE id=?', [req.params.id]);
  if (!client) return res.status(404).json({ error:'Cliente no encontrado' });
  const files   = all('SELECT * FROM files   WHERE client_id=? ORDER BY created_at DESC LIMIT 10', [req.params.id]);
  const history = all('SELECT * FROM history WHERE client_id=? ORDER BY created_at DESC LIMIT 10', [req.params.id]);
  res.json({ ...client, files, history });
});

router.post('/', requireAuth, (req, res) => {
  const { name, company, email, phone } = req.body;
  if (!name || !company) return res.status(400).json({ error:'Nombre y empresa requeridos' });
  run('INSERT INTO clients (name,company,email,phone) VALUES (?,?,?,?)', [name, company, email||null, phone||null]);
  run('INSERT INTO logs (level,message,user_id) VALUES (?,?,?)', ['info',`Cliente creado: ${company}`, req.user.id]);
  res.status(201).json({ message:'Cliente creado' });
});

router.put('/:id', requireAuth, (req, res) => {
  const { name, company, email, phone, status } = req.body;
  run('UPDATE clients SET name=?,company=?,email=?,phone=?,status=? WHERE id=?', [name, company, email||null, phone||null, status||'active', req.params.id]);
  res.json({ message:'Cliente actualizado' });
});

router.delete('/:id', requireAuth, (req, res) => {
  run('DELETE FROM clients WHERE id=?', [req.params.id]);
  res.json({ message:'Cliente eliminado' });
});

module.exports = router;
