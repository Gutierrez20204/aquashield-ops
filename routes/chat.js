// routes/chat.js
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuid } = require('uuid');
const { run, get, all } = require('../db/database');
const { requireAuth }   = require('./auth');
const router = express.Router();

const CHAT_DIR = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(CHAT_DIR)) fs.mkdirSync(CHAT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CHAT_DIR),
  filename:    (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// GET /api/chat/users — list all users (for admin to select conversation)
router.get('/users', requireAuth, (req, res) => {
  const users = all(
    `SELECT u.id, u.name, u.role, u.username,
      (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id AND m.receiver_id = ? AND m.is_read = 0) as unread
     FROM users u WHERE u.id != ? ORDER BY u.name`,
    [req.user.id, req.user.id]
  );
  res.json(users);
});

// GET /api/chat/history/:userId — full conversation with a user
router.get('/history/:userId', requireAuth, (req, res) => {
  const otherId = parseInt(req.params.userId);
  const me = req.user.id;
  const msgs = all(
    `SELECT m.*, 
       s.name as sender_name, s.role as sender_role,
       r.name as receiver_name
     FROM messages m
     JOIN users s ON m.sender_id = s.id
     LEFT JOIN users r ON m.receiver_id = r.id
     WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [me, otherId, otherId, me]
  );
  // Mark messages from the other user as read
  run('UPDATE messages SET is_read=1 WHERE sender_id=? AND receiver_id=? AND is_read=0', [otherId, me]);
  res.json(msgs);
});

// POST /api/chat/send
router.post('/send', requireAuth, upload.single('file'), (req, res) => {
  try {
    const { receiver_id, body } = req.body;
    if (!receiver_id) return res.status(400).json({ error: 'Destinatario requerido' });

    let file_path = null, file_name = null, file_type = null;
    if (req.file) {
      file_path = `/uploads/chat/${req.file.filename}`;
      file_name = req.file.originalname;
      file_type = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    }

    if (!body && !file_path) return res.status(400).json({ error: 'Mensaje o archivo requerido' });

    const senderId = req.user.id;
    const recvId   = parseInt(receiver_id);

    run(
      'INSERT INTO messages (sender_id, receiver_id, body, file_path, file_name, file_type) VALUES (?,?,?,?,?,?)',
      [senderId, recvId, body || null, file_path, file_name, file_type]
    );

    // Get the last inserted ID for this sender (most reliable in sql.js)
    const idRow = get('SELECT MAX(id) as lastId FROM messages WHERE sender_id = ?', [senderId]);
    const msg = idRow?.lastId
      ? get(
          `SELECT m.*, s.name as sender_name, s.role as sender_role
           FROM messages m JOIN users s ON m.sender_id = s.id
           WHERE m.id = ?`,
          [idRow.lastId]
        )
      : null;

    // Fallback: construct response from known data if SELECT fails
    if (!msg) {
      return res.status(201).json({
        id: null,
        sender_id: senderId,
        receiver_id: recvId,
        body: body || null,
        file_path, file_name, file_type,
        sender_name: req.user.name,
        sender_role: req.user.role,
        created_at: new Date().toISOString()
      });
    }

    res.status(201).json(msg);
  } catch(e) {
    console.error('[CHAT SEND ERROR]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/chat/unread — total unread count for the logged-in user
router.get('/unread', requireAuth, (req, res) => {
  const row = get('SELECT COUNT(*) as count FROM messages WHERE receiver_id=? AND is_read=0', [req.user.id]);
  res.json({ count: row?.count || 0 });
});

module.exports = router;
