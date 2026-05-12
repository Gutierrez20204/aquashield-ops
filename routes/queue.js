// routes/queue.js
const express = require('express');
const { run, get, all } = require('../db/database');
const { requireAuth }   = require('./auth');
const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json(all(`SELECT q.*, f.original as filename, f.filetype, f.size_bytes,
    c.name as client_name, c.company as client_company
    FROM queue q JOIN files f ON q.file_id=f.id LEFT JOIN clients c ON f.client_id=c.id
    WHERE q.status IN ('queued','printing') ORDER BY q.priority DESC, q.position ASC`));
});

router.post('/', requireAuth, (req, res) => {
  const { file_id, priority='normal' } = req.body;
  if (!file_id) return res.status(400).json({ error:'file_id requerido' });
  const already = get('SELECT id FROM queue WHERE file_id=? AND status IN ("queued","printing")', [file_id]);
  if (already) return res.status(409).json({ error:'Archivo ya en cola' });
  const maxPos = get('SELECT MAX(position) as m FROM queue WHERE status="queued"')?.m || 0;
  run('INSERT INTO queue (file_id,position,priority,status) VALUES (?,?,?,?)', [file_id, maxPos+1, priority, 'queued']);
  run('INSERT INTO logs (level,message,user_id) VALUES (?,?,?)', ['info',`Trabajo añadido cola file_id=${file_id}`, req.user.id]);
  res.status(201).json({ message:'Agregado a cola' });
});

router.patch('/:id/move', requireAuth, (req, res) => {
  const { direction } = req.body;
  const item = get('SELECT * FROM queue WHERE id=?', [req.params.id]);
  if (!item) return res.status(404).json({ error:'No encontrado' });
  const op   = direction==='up' ? '<' : '>';
  const ord  = direction==='up' ? 'DESC' : 'ASC';
  const swap = get(`SELECT * FROM queue WHERE status="queued" AND position ${op} ? ORDER BY position ${ord} LIMIT 1`, [item.position]);
  if (swap) {
    run('UPDATE queue SET position=? WHERE id=?', [swap.position, item.id]);
    run('UPDATE queue SET position=? WHERE id=?', [item.position, swap.id]);
  }
  res.json({ message:'Posición actualizada' });
});

router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['queued','printing','done','cancelled'].includes(status)) return res.status(400).json({ error:'Estado inválido' });
  const item = get('SELECT * FROM queue WHERE id=?', [req.params.id]);
  if (!item) return res.status(404).json({ error:'No encontrado' });
  const now = new Date().toISOString();
  if (status==='printing') run('UPDATE queue SET status=?,started_at=? WHERE id=?', [status, now, item.id]);
  else if (status==='done'||status==='cancelled') {
    run('UPDATE queue SET status=?,finished_at=? WHERE id=?', [status, now, item.id]);
    run('UPDATE files SET status=? WHERE id=?', [status==='done'?'done':'pending', item.file_id]);
    if (status==='done') {
      const file = get('SELECT * FROM files WHERE id=?', [item.file_id]);
      const dur  = item.started_at ? Math.round((Date.now()-new Date(item.started_at).getTime())/1000) : null;
      run('INSERT INTO history (job_name,file_id,client_id,sent_by,duration_s,status) VALUES (?,?,?,?,?,?)',
        [file?.original||'Trabajo', item.file_id, file?.client_id||null, req.user.id, dur, 'done']);
    }
    run('INSERT INTO logs (level,message,user_id) VALUES (?,?,?)', ['ok',`Cola #${item.id} ${status}`, req.user.id]);
  } else run('UPDATE queue SET status=? WHERE id=?', [status, item.id]);
  res.json({ message:'Estado actualizado' });
});

router.delete('/:id', requireAuth, (req, res) => {
  run('DELETE FROM queue WHERE id=?', [req.params.id]);
  res.json({ message:'Eliminado de cola' });
});

module.exports = router;
