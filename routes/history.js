// routes/history.js
const express = require('express');
const { get, all } = require('../db/database');
const { requireAuth } = require('./auth');
const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { status, client_id, limit=50, offset=0 } = req.query;
  let sql = `SELECT h.*, f.original as filename, f.filetype,
    c.name as client_name, u.name as sent_by_name
    FROM history h LEFT JOIN files f ON h.file_id=f.id
    LEFT JOIN clients c ON h.client_id=c.id LEFT JOIN users u ON h.sent_by=u.id WHERE 1=1`;
  const params = [];
  if (status)    { sql += ' AND h.status=?';    params.push(status); }
  if (client_id) { sql += ' AND h.client_id=?'; params.push(client_id); }
  sql += ' ORDER BY h.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  res.json(all(sql, params));
});

router.get('/stats', requireAuth, (req, res) => {
  res.json({
    total_files:   get('SELECT COUNT(*) as c FROM files').c,
    total_clients: get('SELECT COUNT(*) as c FROM clients WHERE status="active"').c,
    total_jobs:    get('SELECT COUNT(*) as c FROM history WHERE status="done"').c,
    queue_count:   get('SELECT COUNT(*) as c FROM queue WHERE status IN ("queued","printing")').c,
    urgent_count:  get('SELECT COUNT(*) as c FROM queue WHERE priority="urgent" AND status="queued"').c,
    today_jobs:    get(`SELECT COUNT(*) as c FROM history WHERE date(created_at)=date('now') AND status='done'`).c,
  });
});

module.exports = router;
