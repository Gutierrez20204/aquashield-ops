// routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { run, get } = require('../db/database');
const router  = express.Router();
const SECRET  = process.env.JWT_SECRET || 'aguashield_secret';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Credenciales requeridas' });
  const user = get('SELECT * FROM users WHERE username=? AND status="active"', [username]);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  run('UPDATE users SET last_login=? WHERE id=?', [new Date().toISOString(), user.id]);
  run('INSERT INTO logs (level,message,ip,user_id) VALUES (?,?,?,?)', ['info',`Login: ${username}`, req.ip, user.id]);
  const token = jwt.sign({ id:user.id, username:user.username, role:user.role, name:user.name }, SECRET, { expiresIn:'24h' });
  res.json({ token, user:{ id:user.id, username:user.username, name:user.name, role:user.role } });
});

router.post('/logout', requireAuth, (req, res) => {
  run('INSERT INTO logs (level,message,user_id) VALUES (?,?,?)', ['info',`Logout: ${req.user.username}`, req.user.id]);
  res.json({ message:'Sesión cerrada' });
});

router.get('/me', requireAuth, (req, res) => {
  const user = get('SELECT id,username,name,role,status,last_login,created_at FROM users WHERE id=?', [req.user.id]);
  res.json(user);
});

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error:'No autorizado' });
  try { req.user = jwt.verify(h.slice(7), SECRET); next(); }
  catch { res.status(401).json({ error:'Token inválido' }); }
}

module.exports = router;
module.exports.requireAuth = requireAuth;
