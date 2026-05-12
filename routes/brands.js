const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// Get all brands
router.get('/', (req, res) => {
  try {
    const brands = db.all('SELECT * FROM brands ORDER BY name ASC');
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new brand
router.post('/', (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre es requerido' });
  
  try {
    db.run('INSERT INTO brands (name, icon) VALUES (?, ?)', [name, icon || '🚗']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
