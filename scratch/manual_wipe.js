// scratch/manual_wipe.js
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db', 'aquashield.db');

async function wipe() {
  console.log('--- INICIANDO LIMPIEZA MANUAL ---');
  if (!fs.existsSync(DB_PATH)) {
    console.error('Error: No se encontró la base de datos en ' + DB_PATH);
    return;
  }

  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(filebuffer);

  try {
    db.run('DELETE FROM clients');
    db.run('DELETE FROM brands');
    db.run('DELETE FROM files');
    db.run('DELETE FROM queue');
    db.run('DELETE FROM history');
    db.run('DELETE FROM logs');
    db.run("INSERT INTO logs (level,message) VALUES ('ok','SISTEMA FORMATEADO POR EL ASISTENTE')");
    
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    console.log('✅ ÉXITO: Base de datos local limpiada por completo.');
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  }
}

wipe();
