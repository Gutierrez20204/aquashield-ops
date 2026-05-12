/* ====================================================
   AGUA SHIELD OPS — MAIN APP JAVASCRIPT
   ==================================================== */

// ---- Auth Guard ----
const asUser = JSON.parse(sessionStorage.getItem('as_user') || 'null');
if (!asUser) window.location.href = 'index.html';
else {
  document.getElementById('userName').textContent = asUser.name || 'Usuario';
  document.getElementById('userRole').textContent = asUser.role === 'admin' ? 'Administrador' : asUser.role === 'operator' ? 'Operador' : 'Diseñador';
  document.getElementById('userAvatar').textContent = (asUser.name || 'U')[0].toUpperCase();
}
function logout() { sessionStorage.clear(); window.location.href = 'index.html'; }

// ---- Clock ----
function updateClock() {
  const now = new Date();
  document.getElementById('pageTime').textContent = now.toLocaleString('es-CO', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
setInterval(updateClock, 1000); updateClock();

// ---- Sidebar toggle (mobile) ----
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// ---- Navigation ----
const PAGES = ['dashboard','files','queue','remote','clients','history','users','logs'];
const PAGE_TITLES = { dashboard:'Dashboard Principal', files:'Gestión de Archivos', queue:'Cola de Impresión', remote:'Acceso Remoto', clients:'Clientes', history:'Historial de Trabajos', users:'Usuarios del Sistema', logs:'Logs del Sistema' };

function navigateTo(page) {
  PAGES.forEach(p => {
    document.getElementById('page-' + p)?.classList.toggle('hidden', p !== page);
    document.getElementById('nav-' + p)?.classList.toggle('active', p === page);
  });
  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-' + page)?.classList.add('active');
  if (page === 'files') renderFiles();
  if (page === 'queue') renderQueueFull();
  if (page === 'history') renderHistory();
  if (page === 'clients') renderClients();
  if (page === 'users') renderUsers();
  if (page === 'logs') renderLogs();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const href = item.getAttribute('href');
    const page = href?.replace('.html', '');
    if (page && PAGES.includes(page)) navigateTo(page);
  });
});

// ---- Notifications ----
const NOTIFICATIONS = [
  { text: 'Plotter en línea — listo para imprimir', time: 'Hace 2 min', color: 'var(--success)', type: 'ok' },
  { text: 'Archivo "BMW_X5_wrap.ai" recibido de ClienteA', time: 'Hace 15 min', color: 'var(--accent)', type: 'info' },
  { text: 'Cola #4: "Vinilo Ford Ranger" en espera', time: 'Hace 38 min', color: 'var(--warn)', type: 'warn' },
];
function renderNotifications() {
  const list = document.getElementById('notifList');
  list.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-item">
      <div class="notif-dot" style="background:${n.color}"></div>
      <div><div class="notif-text">${n.text}</div><div class="notif-time">${n.time}</div></div>
    </div>`).join('');
}
function toggleNotifications() {
  document.getElementById('notifDropdown').classList.toggle('open');
  renderNotifications();
}
document.addEventListener('click', e => {
  if (!e.target.closest('#notifBtn') && !e.target.closest('#notifDropdown'))
    document.getElementById('notifDropdown').classList.remove('open');
});

// ---- MOCK DATA ----
const FILES = [
  { name:'BMW_X5_wrap.ai', client:'AutoGlass Baq', type:'.ai', size:'24.3 MB', date:'12/05/2026', status:'pending' },
  { name:'FordRanger_fullkit.eps', client:'VehiculosTotal', type:'.eps', size:'18.7 MB', date:'12/05/2026', status:'printing' },
  { name:'Mazda3_diseño.ai', client:'JK Autos', type:'.ai', size:'12.1 MB', date:'11/05/2026', status:'done' },
  { name:'Kia_Sportage_vinilo.pdf', client:'Multimarca', type:'.pdf', size:'9.8 MB', date:'11/05/2026', status:'done' },
  { name:'Toyota_Hilux_logo.svg', client:'Flota Caribe', type:'.svg', size:'1.2 MB', date:'10/05/2026', status:'pending' },
  { name:'Renault_Duster_wrap.ai', client:'CarsDesign', type:'.ai', size:'31.5 MB', date:'10/05/2026', status:'done' },
  { name:'Hyundai_Tucson_cut.eps', client:'Barranquilla Motors', type:'.eps', size:'8.4 MB', date:'09/05/2026', status:'done' },
];

const QUEUE = [
  { order:1, name:'FordRanger_fullkit.eps', client:'VehiculosTotal', status:'printing', time:'En proceso' },
  { order:2, name:'BMW_X5_wrap.ai', client:'AutoGlass Baq', status:'queued', time:'~20 min' },
  { order:3, name:'Toyota_Hilux_logo.svg', client:'Flota Caribe', status:'urgent', time:'URGENTE' },
  { order:4, name:'Kia_Stonic_vinilo.ai', client:'JK Autos', status:'queued', time:'~55 min' },
  { order:5, name:'Chevrolet_Captiva.pdf', client:'Multimarca', status:'queued', time:'~80 min' },
  { order:6, name:'VW_Golf_wrap.ai', client:'CarsDesign', status:'queued', time:'~100 min' },
  { order:7, name:'Nissan_Frontier.eps', client:'Flota Caribe', status:'queued', time:'~125 min' },
  { order:8, name:'Mazda_CX5_lateral.ai', client:'Barranquilla Motors', status:'queued', time:'~150 min' },
];

const CLIENTS = [
  { name:'Carlos Mendoza', company:'AutoGlass Baq', jobs:24, lastJob:'12/05/2026', status:'active' },
  { name:'Sandra Ríos', company:'VehiculosTotal', jobs:17, lastJob:'12/05/2026', status:'active' },
  { name:'Jorge Herrera', company:'JK Autos', jobs:9, lastJob:'11/05/2026', status:'active' },
  { name:'Paola Suárez', company:'Multimarca', jobs:32, lastJob:'09/05/2026', status:'active' },
  { name:'Andrés Palomino', company:'Flota Caribe', jobs:7, lastJob:'07/05/2026', status:'pending' },
  { name:'Luisa Ospino', company:'CarsDesign', jobs:15, lastJob:'06/05/2026', status:'active' },
  { name:'Roberto Díaz', company:'Barranquilla Motors', jobs:41, lastJob:'04/05/2026', status:'active' },
];

const HISTORY = [
  { id:'#1203', job:'BMW X5 Wrap Completo', client:'AutoGlass Baq', file:'BMW_X5_wrap.ai', sent:'12/05/26 08:30', duration:'45 min', status:'done' },
  { id:'#1202', job:'Ford Ranger Kit Lateral', client:'VehiculosTotal', file:'FordRanger_fullkit.eps', sent:'11/05/26 16:00', duration:'38 min', status:'done' },
  { id:'#1201', job:'Kia Sportage Vinilo', client:'Multimarca', file:'Kia_Sportage_vinilo.pdf', sent:'11/05/26 11:15', duration:'22 min', status:'done' },
  { id:'#1200', job:'Mazda3 Diseño', client:'JK Autos', file:'Mazda3_diseño.ai', sent:'11/05/26 09:00', duration:'30 min', status:'done' },
  { id:'#1199', job:'Renault Duster Wrap', client:'CarsDesign', file:'Renault_Duster_wrap.ai', sent:'10/05/26 14:30', duration:'52 min', status:'done' },
  { id:'#1198', job:'Hyundai Tucson Corte', client:'Barranquilla Motors', file:'Hyundai_Tucson_cut.eps', sent:'09/05/26 10:00', duration:'28 min', status:'error' },
];

const USERS = [
  { user:'admin', name:'Administrador', role:'admin', lastLogin:'12/05/2026 08:00', status:'active' },
  { user:'operador', name:'Carlos Ríos', role:'operator', lastLogin:'12/05/2026 07:50', status:'active' },
  { user:'diseno', name:'Lucia Martínez', role:'designer', lastLogin:'11/05/2026 17:30', status:'active' },
  { user:'jefe_planta', name:'Roberto Díaz', role:'operator', lastLogin:'10/05/2026 12:00', status:'pending' },
];

const LOGS = [
  { time:'2026-05-12 13:20:01', level:'ok', msg:'Archivo BMW_X5_wrap.ai enviado al plotter exitosamente' },
  { time:'2026-05-12 13:10:43', level:'info', msg:'Usuario "operador" inició sesión desde 190.167.x.x' },
  { time:'2026-05-12 12:58:17', level:'info', msg:'Archivo FordRanger_fullkit.eps recibido — 18.7MB' },
  { time:'2026-05-12 12:45:30', level:'warn', msg:'Cola de impresión llena — capacidad 8/8 trabajos' },
  { time:'2026-05-12 12:30:05', level:'ok', msg:'Conexión remota establecida con equipo Barranquilla' },
  { time:'2026-05-12 11:58:22', level:'err', msg:'Trabajo #1198 fallido — error de comunicación plotter' },
  { time:'2026-05-12 11:45:00', level:'ok', msg:'Plotter Roland BN-20 en línea — estado OK' },
  { time:'2026-05-12 10:30:12', level:'info', msg:'Usuario "admin" creó cliente "AutoGlass Baq"' },
  { time:'2026-05-12 09:15:44', level:'ok', msg:'Backup automático completado — 247 archivos' },
  { time:'2026-05-12 08:00:00', level:'info', msg:'Sistema iniciado — Agua Shield OPS v2.1' },
];

const ACTIVITY = [
  { text:'Archivo BMW_X5_wrap.ai enviado al plotter', time:'Hace 2 min', color:'var(--success)' },
  { text:'Carlos Mendoza subió nuevo diseño EPS', time:'Hace 18 min', color:'var(--accent)' },
  { text:'Cola de impresión actualizada — 8 trabajos', time:'Hace 32 min', color:'var(--warn)' },
  { text:'Sesión remota activa — equipo Barranquilla', time:'Hace 45 min', color:'var(--success)' },
  { text:'Error en trabajo #1198 — operador notificado', time:'Hace 1h', color:'var(--error)' },
];

// ---- DASHBOARD RENDER ----
function renderDashboard() {
  // Queue preview
  document.getElementById('dashQueueList').innerHTML = QUEUE.slice(0, 5).map(q => `
    <div class="queue-item">
      <span class="qi-order">${q.order}</span>
      <div style="flex:1"><div class="qi-name">${q.name}</div><div class="qi-client">${q.client}</div></div>
      <span>${q.time}</span>
      <span class="qi-status ${q.status}">${q.status === 'printing' ? 'Imprimiendo' : q.status === 'urgent' ? 'URGENTE' : q.status === 'done' ? 'Listo' : 'En cola'}</span>
    </div>`).join('');

  // Recent files
  document.getElementById('recentFilesList').innerHTML = FILES.slice(0, 5).map(f => {
    const ext = f.type.replace('.', '');
    return `<div class="rf-item"><div class="rf-icon ${ext}">${ext.toUpperCase()}</div><div><div class="rf-name">${f.name}</div><div class="rf-meta">${f.client} · ${f.date}</div></div></div>`;
  }).join('');

  // Activity
  document.getElementById('activityFeed').innerHTML = ACTIVITY.map(a => `
    <div class="act-item"><div class="act-dot" style="background:${a.color}"></div><div class="act-body"><div class="act-text">${a.text}</div><div class="act-time">${a.time}</div></div></div>`).join('');
}

// ---- FILES ----
function renderFiles(filter = '', typeFilter = '') {
  const filtered = FILES.filter(f =>
    f.name.toLowerCase().includes(filter.toLowerCase()) &&
    (!typeFilter || f.type === typeFilter)
  );
  document.getElementById('filesTableBody').innerHTML = filtered.map(f => `
    <tr>
      <td class="td-bold">${f.name}</td>
      <td>${f.client}</td>
      <td><span class="pill ${f.status}">${f.type}</span></td>
      <td>${f.size}</td>
      <td>${f.date}</td>
      <td><span class="pill ${f.status}">${f.status === 'done' ? 'Completado' : f.status === 'printing' ? 'Imprimiendo' : 'Pendiente'}</span></td>
      <td class="tbl-actions">
        <button class="tbl-btn" onclick="toast('Enviando al plotter...','info')">Plotear</button>
        <button class="tbl-btn" onclick="toast('Descargando ${f.name}','info')">↓</button>
        <button class="tbl-btn" onclick="toast('Eliminando...','error')" style="border-color:rgba(255,64,96,.3);color:var(--error)">✕</button>
      </td>
    </tr>`).join('');
}
function filterFiles(val) {
  const type = document.getElementById('fileTypeFilter').value;
  renderFiles(val, type);
}

// ---- QUEUE ----
function renderQueueFull() {
  document.getElementById('queueFullList').innerHTML = QUEUE.map(q => `
    <div class="queue-item">
      <span class="qi-order">${q.order}</span>
      <div style="flex:1"><div class="qi-name">${q.name}</div><div class="qi-client">${q.client}</div></div>
      <span style="font-size:12px;color:var(--text-3)">${q.time}</span>
      <span class="qi-status ${q.status}">${q.status === 'printing' ? 'Imprimiendo' : q.status === 'urgent' ? 'URGENTE' : 'En cola'}</span>
      <div class="tbl-actions">
        <button class="tbl-btn" onclick="toast('Trabajo movido arriba','info')">↑</button>
        <button class="tbl-btn" onclick="toast('Trabajo cancelado','error')">✕</button>
      </div>
    </div>`).join('');
}
function addToQueue() { toast('Archivo seleccionado agregado a la cola', 'success'); }

// ---- HISTORY ----
function renderHistory() {
  document.getElementById('historyTableBody').innerHTML = HISTORY.map(h => `
    <tr>
      <td style="color:var(--text-3)">${h.id}</td>
      <td class="td-bold">${h.job}</td>
      <td>${h.client}</td>
      <td style="font-size:12px;color:var(--text-3)">${h.file}</td>
      <td>${h.sent}</td>
      <td>${h.duration}</td>
      <td><span class="pill ${h.status}">${h.status === 'done' ? 'Completado' : 'Error'}</span></td>
    </tr>`).join('');
}

// ---- CLIENTS ----
function renderClients() {
  document.getElementById('clientsTableBody').innerHTML = CLIENTS.map(c => `
    <tr>
      <td class="td-bold">${c.name}</td>
      <td>${c.company}</td>
      <td>${c.jobs}</td>
      <td>${c.lastJob}</td>
      <td><span class="pill ${c.status}">${c.status === 'active' ? 'Activo' : 'Pendiente'}</span></td>
      <td class="tbl-actions">
        <button class="tbl-btn" onclick="toast('Abriendo perfil de ${c.name}','info')">Ver</button>
        <button class="tbl-btn" onclick="toast('Editando cliente','info')">Editar</button>
      </td>
    </tr>`).join('');
}
function filterClients(val) { renderClients(); }
function addClient() { toast('Formulario de nuevo cliente (próximamente)', 'info'); }

// ---- USERS ----
function renderUsers() {
  document.getElementById('usersTableBody').innerHTML = USERS.map(u => `
    <tr>
      <td style="font-family:monospace;color:var(--accent)">${u.user}</td>
      <td class="td-bold">${u.name}</td>
      <td><span class="pill ${u.role === 'admin' ? 'printing' : u.role === 'operator' ? 'active' : 'pending'}">${u.role === 'admin' ? 'Admin' : u.role === 'operator' ? 'Operador' : 'Diseñador'}</span></td>
      <td>${u.lastLogin}</td>
      <td><span class="pill ${u.status}">${u.status === 'active' ? 'Activo' : 'Pendiente'}</span></td>
      <td class="tbl-actions">
        <button class="tbl-btn" onclick="toast('Editando usuario ${u.user}','info')">Editar</button>
        <button class="tbl-btn" onclick="toast('Sesión revocada','error')" style="color:var(--error)">Revocar</button>
      </td>
    </tr>`).join('');
}
function addUser() { toast('Módulo de creación de usuarios (próximamente)', 'info'); }

// ---- LOGS ----
function renderLogs() {
  document.getElementById('logsFeed').innerHTML = LOGS.map(l => `
    <div class="log-line">
      <span class="log-time">${l.time}</span>
      <span class="log-level ${l.level}">[${l.level.toUpperCase()}]</span>
      <span class="log-msg">${l.msg}</span>
    </div>`).join('');
}

// ---- REMOTE ----
function renderRemote() {
  document.getElementById('remoteInfoGrid').innerHTML = [
    ['Hostname', 'AQUASHIELD-PC-01'], ['SO', 'Windows 11 Pro'], ['CPU', 'Intel i7-12700 2.1GHz'],
    ['RAM', '32 GB DDR4'], ['Almacenamiento', '2TB SSD (68% libre)'], ['IP Local', '192.168.1.100'],
    ['IP Pública', '181.55.x.x (Barranquilla)'], ['Uptime', '14h 32min'],
  ].map(([k, v]) => `<div class="info-row"><span class="info-key">${k}</span><span class="info-val">${v}</span></div>`).join('');

  document.getElementById('softwareList').innerHTML = [
    { name:'Adobe Illustrator', ver:'2024 v28.x', ok:true },
    { name:'FlexiSIGN-PRO', ver:'v12.2', ok:true },
    { name:'Roland VersaWorks', ver:'v6.4', ok:true },
    { name:'CorelDRAW', ver:'2023 v25.x', ok:false },
    { name:'AnyDesk', ver:'v8.0.8', ok:true },
  ].map(s => `<div class="sw-item"><div class="sw-dot" style="background:${s.ok ? 'var(--success)' : 'var(--text-3)'}"></div><span class="sw-name">${s.name}</span><span class="sw-ver">${s.ver}</span></div>`).join('');
}

function launchRemote(app) {
  const urls = { anydesk:'anydesk://', teamviewer:'teamviewer10://', rdp:'ms-rd:openLocalSubId' };
  toast(`Abriendo ${app.toUpperCase()}...`, 'info');
  try { window.open(urls[app]); } catch(e) {}
}

// ---- MODALS ----
function uploadFile() { document.getElementById('uploadModal').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function handleFileSelect(input) {
  const list = document.getElementById('uploadFileList');
  list.innerHTML = [...input.files].map(f => `<div class="ufl-item">📄 ${f.name} <span style="margin-left:auto;color:var(--text-3)">${(f.size/1024/1024).toFixed(1)} MB</span></div>`).join('');
}
function confirmUpload() {
  closeModal('uploadModal');
  toast('Archivos subidos exitosamente', 'success');
}

// ---- TOAST ----
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---- PLOTTER SIMULATION ----
function simulatePlotter() {
  let pct = 78;
  setInterval(() => {
    pct = Math.max(20, Math.min(99, pct + (Math.random() * 4 - 2)));
    document.getElementById('pmPercent').textContent = Math.round(pct) + '%';
    const temps = [40, 41, 42, 43, 44];
    document.getElementById('pmTemp').textContent = temps[Math.floor(Math.random() * temps.length)] + '°C';
  }, 3000);
}

// ---- DROP ZONE ----
const dz = document.getElementById('dropZone');
if (dz) {
  ['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files.length) handleFileSelect({ files });
  });
}

// ---- INIT ----
renderDashboard();
renderRemote();
simulatePlotter();
