// routes/files.js
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuid } = require('uuid');
const { run, get, all } = require('../db/database');
const { requireAuth }   = require('./auth');
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, String(req.body.client_id || 'general'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname).toLowerCase()}`)
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 500) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ['.ai','.eps','.pdf','.svg'].includes(ext) ? cb(null, true) : cb(new Error('Tipo no permitido'));
  }
});

router.get('/', requireAuth, (req, res) => {
  const { type, status, client_id, q } = req.query;
  let sql = `SELECT f.*, c.name as client_name, u.name as uploader
    FROM files f LEFT JOIN clients c ON f.client_id=c.id LEFT JOIN users u ON f.uploaded_by=u.id WHERE 1=1`;
  const params = [];
  if (type)      { sql += ' AND f.filetype=?';   params.push(type); }
  if (status)    { sql += ' AND f.status=?';     params.push(status); }
  if (client_id) { sql += ' AND f.client_id=?';  params.push(client_id); }
  if (q)         { sql += ' AND f.original LIKE ?'; params.push(`%${q}%`); }
  sql += ' ORDER BY f.created_at DESC';
  res.json(all(sql, params));
});

router.get('/:id', requireAuth, (req, res) => {
  const file = get('SELECT f.*,c.name as client_name FROM files f LEFT JOIN clients c ON f.client_id=c.id WHERE f.id=?', [req.params.id]);
  if (!file) return res.status(404).json({ error:'Archivo no encontrado' });
  res.json(file);
});

router.post('/upload', requireAuth, upload.array('files', 20), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error:'Sin archivos' });
  const { client_id, project, notes } = req.body;
  const results = req.files.map(f => {
    const ext = path.extname(f.originalname).toLowerCase();
    run('INSERT INTO files (filename,original,filetype,size_bytes,client_id,project,notes,uploaded_by) VALUES (?,?,?,?,?,?,?,?)',
      [f.filename, f.originalname, ext, f.size, client_id||null, project||null, notes||null, req.user.id]);
    run('INSERT INTO logs (level,message,user_id) VALUES (?,?,?)', ['info',`Archivo subido: ${f.originalname}`, req.user.id]);
    return { filename: f.filename, original: f.originalname, size: f.size };
  });
  res.status(201).json({ uploaded: results.length, files: results });
});

router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['pending','printing','done','error'].includes(status)) return res.status(400).json({ error:'Estado inválido' });
  run('UPDATE files SET status=? WHERE id=?', [status, req.params.id]);
  res.json({ message:'Estado actualizado' });
});

router.delete('/:id', requireAuth, (req, res) => {
  const file = get('SELECT * FROM files WHERE id=?', [req.params.id]);
  if (!file) return res.status(404).json({ error:'No encontrado' });
  const fullPath = path.join(UPLOAD_DIR, String(file.client_id||'general'), file.filename);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  run('DELETE FROM files WHERE id=?', [req.params.id]);
  run('INSERT INTO logs (level,message,user_id) VALUES (?,?,?)', ['warn',`Archivo eliminado: ${file.original}`, req.user.id]);
  res.json({ message:'Archivo eliminado' });
});

module.exports = router;
