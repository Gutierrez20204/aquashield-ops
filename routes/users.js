// routes/users.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const { run, get, all } = require('../db/database');
const { requireAuth }   = require('./auth');
const router = express.Router();

const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error:'Solo administradores' });

router.get('/', requireAuth, adminOnly, (req, res) => {
  res.json(all('SELECT id,username,name,role,status,last_login,created_at FROM users ORDER BY created_at DESC'));
});

router.get('/:id', requireAuth, adminOnly, (req, res) => {
  const user = get('SELECT id,username,name,role,status,last_login,created_at FROM users WHERE id=?', [req.params.id]);
  if (!user) return res.status(404).json({ error:'Usuario no encontrado' });
  res.json(user);
});

router.post('/', requireAuth, adminOnly, (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username||!password||!name||!role) return res.status(400).json({ error:'Todos los campos requeridos' });
  if (get('SELECT id FROM users WHERE username=?', [username])) return res.status(409).json({ error:'Usuario ya existe' });
  run('INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)', [username, bcrypt.hashSync(password,10), name, role]);
  run('INSERT INTO logs (level,message,user_id) VALUES (?,?,?)', ['info',`Usuario creado: ${username}`, req.user.id]);
  res.status(201).json({ message:'Usuario creado' });
});

router.put('/:id', requireAuth, adminOnly, (req, res) => {
  const { name, role, status, password } = req.body;
  if (password) run('UPDATE users SET name=?,role=?,status=?,password=? WHERE id=?', [name, role, status, bcrypt.hashSync(password,10), req.params.id]);
  else          run('UPDATE users SET name=?,role=?,status=? WHERE id=?', [name, role, status, req.params.id]);
  res.json({ message:'Usuario actualizado' });
});

router.delete('/:id', requireAuth, adminOnly, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error:'No puedes eliminarte a ti mismo' });
  run('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ message:'Usuario eliminado' });
});

module.exports = router;
