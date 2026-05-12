/* ====================================================
   AGUA SHIELD OPS — MAIN APP JAVASCRIPT (API VERSION)
   ==================================================== */

// ---- Auth Guard ----
const asUser = JSON.parse(sessionStorage.getItem('as_user') || 'null');
const asToken = sessionStorage.getItem('as_token');

if (!asUser || !asToken) {
  window.location.href = 'index.html';
} else {
  document.getElementById('userName').textContent = asUser.name || 'Usuario';
  document.getElementById('userRole').textContent = asUser.role === 'admin' ? 'Administrador' : asUser.role === 'operator' ? 'Operador' : 'Diseñador';
  document.getElementById('userAvatar').textContent = (asUser.name || 'U')[0].toUpperCase();
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}

// ---- API Helper ----
async function apiFetch(url, options = {}) {
  const headers = {
    'Authorization': `Bearer ${asToken}`,
    ...options.headers
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) logout();
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error en la petición');
    return data;
  } catch (error) {
    toast(error.message, 'error');
    throw error;
  }
}

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

  if (page === 'dashboard') renderDashboard();
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

// ---- DASHBOARD RENDER ----
async function renderDashboard() {
  try {
    // KPIs
    const stats = await apiFetch('/api/history/stats');
    document.querySelector('[data-count="247"]').textContent = stats.total_files;
    document.querySelector('[data-count="8"]').textContent = stats.queue_count;
    document.querySelector('[data-count="34"]').textContent = stats.total_clients;
    document.querySelector('[data-count="1203"]').textContent = stats.total_jobs;

    // Queue preview
    const queue = await apiFetch('/api/queue');
    document.getElementById('dashQueueList').innerHTML = queue.slice(0, 5).map(q => `
      <div class="queue-item">
        <span class="qi-order">${q.position}</span>
        <div style="flex:1"><div class="qi-name">${q.filename}</div><div class="qi-client">${q.client_company || 'S/C'}</div></div>
        <span class="qi-status ${q.status}">${q.status === 'printing' ? 'Imprimiendo' : 'En cola'}</span>
      </div>`).join('');

    // Recent files
    const files = await apiFetch('/api/files?limit=5');
    document.getElementById('recentFilesList').innerHTML = files.slice(0, 5).map(f => {
      const ext = f.filetype.replace('.', '');
      return `<div class="rf-item"><div class="rf-icon ${ext}">${ext.toUpperCase()}</div><div><div class="rf-name">${f.original}</div><div class="rf-meta">${f.client_company || 'S/C'} · ${new Date(f.created_at).toLocaleDateString()}</div></div></div>`;
    }).join('');

    // Logs (as activity)
    const logs = await apiFetch('/api/logs?limit=5');
    document.getElementById('activityFeed').innerHTML = logs.map(l => `
      <div class="act-item"><div class="act-dot" style="background:${l.level === 'err' ? 'var(--error)' : l.level === 'warn' ? 'var(--warn)' : 'var(--accent)'}"></div><div class="act-body"><div class="act-text">${l.message}</div><div class="act-time">${new Date(l.created_at).toLocaleTimeString()}</div></div></div>`).join('');

  } catch (e) { console.error('Dashboard load error', e); }
}

// ---- FILES ----
async function renderFiles(q = '', type = '') {
  try {
    const files = await apiFetch(`/api/files?q=${q}&type=${type}`);
    document.getElementById('filesTableBody').innerHTML = files.map(f => `
      <tr>
        <td class="td-bold">${f.original}</td>
        <td>${f.client_company || 'S/C'}</td>
        <td><span class="pill">${f.filetype}</span></td>
        <td>${(f.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
        <td>${new Date(f.created_at).toLocaleDateString()}</td>
        <td><span class="pill ${f.status}">${f.status}</span></td>
        <td class="tbl-actions">
          <button class="tbl-btn" onclick="addToQueueFromFiles(${f.id})">Plotear</button>
          <button class="tbl-btn" onclick="deleteFile(${f.id})">✕</button>
        </td>
      </tr>`).join('');
  } catch (e) {}
}

async function addToQueueFromFiles(file_id) {
  await apiFetch('/api/queue', { method: 'POST', body: JSON.stringify({ file_id }) });
  toast('Agregado a la cola', 'success');
}

async function deleteFile(id) {
  if (confirm('¿Eliminar archivo?')) {
    await apiFetch(`/api/files/${id}`, { method: 'DELETE' });
    renderFiles();
  }
}

function filterFiles(val) {
  const type = document.getElementById('fileTypeFilter').value;
  renderFiles(val, type);
}

// ---- QUEUE ----
async function renderQueueFull() {
  try {
    const queue = await apiFetch('/api/queue');
    document.getElementById('queueFullList').innerHTML = queue.map(q => `
      <div class="queue-item">
        <span class="qi-order">${q.position}</span>
        <div style="flex:1"><div class="qi-name">${q.filename}</div><div class="qi-client">${q.client_company}</div></div>
        <span class="qi-status ${q.status}">${q.status}</span>
        <div class="tbl-actions">
          <button class="tbl-btn" onclick="updateQueueStatus(${q.id}, 'printing')">Play</button>
          <button class="tbl-btn" onclick="updateQueueStatus(${q.id}, 'done')">OK</button>
          <button class="tbl-btn" onclick="deleteFromQueue(${q.id})">✕</button>
        </div>
      </div>`).join('');
  } catch (e) {}
}

async function updateQueueStatus(id, status) {
  await apiFetch(`/api/queue/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  renderQueueFull();
  renderDashboard();
}

async function deleteFromQueue(id) {
  await apiFetch(`/api/queue/${id}`, { method: 'DELETE' });
  renderQueueFull();
}

// ---- CLIENTS ----
async function renderClients(q = '') {
  try {
    const clients = await apiFetch(`/api/clients?q=${q}`);
    document.getElementById('clientsTableBody').innerHTML = clients.map(c => `
      <tr>
        <td class="td-bold">${c.name}</td>
        <td>${c.company}</td>
        <td>${c.total_jobs}</td>
        <td>${c.last_job ? new Date(c.last_job).toLocaleDateString() : 'N/A'}</td>
        <td><span class="pill ${c.status}">${c.status}</span></td>
        <td class="tbl-actions">
          <button class="tbl-btn">Ver</button>
        </td>
      </tr>`).join('');
  } catch (e) {}
}

// ---- HISTORY ----
async function renderHistory() {
  try {
    const history = await apiFetch('/api/history');
    document.getElementById('historyTableBody').innerHTML = history.map(h => `
      <tr>
        <td style="color:var(--text-3)">${h.id}</td>
        <td class="td-bold">${h.job_name}</td>
        <td>${h.client_company}</td>
        <td style="font-size:12px;color:var(--text-3)">${h.filename}</td>
        <td>${new Date(h.created_at).toLocaleString()}</td>
        <td>${h.duration_s ? Math.round(h.duration_s / 60) + ' min' : '-'}</td>
        <td><span class="pill ${h.status}">${h.status}</span></td>
      </tr>`).join('');
  } catch (e) {}
}

// ---- USERS ----
async function renderUsers() {
  try {
    const users = await apiFetch('/api/users');
    document.getElementById('usersTableBody').innerHTML = users.map(u => `
      <tr>
        <td style="font-family:monospace;color:var(--accent)">${u.username}</td>
        <td class="td-bold">${u.name}</td>
        <td><span class="pill">${u.role}</span></td>
        <td>${u.last_login ? new Date(u.last_login).toLocaleString() : 'Nunca'}</td>
        <td><span class="pill ${u.status}">${u.status}</span></td>
        <td class="tbl-actions">
          <button class="tbl-btn">Editar</button>
        </td>
      </tr>`).join('');
  } catch (e) {}
}

// ---- LOGS ----
async function renderLogs() {
  try {
    const logs = await apiFetch('/api/logs');
    document.getElementById('logsFeed').innerHTML = logs.map(l => `
      <div class="log-line">
        <span class="log-time">${new Date(l.created_at).toLocaleString()}</span>
        <span class="log-level ${l.level}">[${l.level.toUpperCase()}]</span>
        <span class="log-msg">${l.message}</span>
      </div>`).join('');
  } catch (e) {}
}

// ---- REMOTE (Static for now) ----
function renderRemote() {
  document.getElementById('remoteInfoGrid').innerHTML = [
    ['Hostname', 'AQUASHIELD-PC-01'], ['SO', 'Windows 11 Pro'], ['IP Local', '192.168.1.100'],
  ].map(([k, v]) => `<div class="info-row"><span class="info-key">${k}</span><span class="info-val">${v}</span></div>`).join('');

  document.getElementById('softwareList').innerHTML = [
    { name:'Adobe Illustrator', ver:'2024', ok:true },
    { name:'FlexiSIGN-PRO', ver:'v12.2', ok:true },
    { name:'Roland VersaWorks', ver:'v6.4', ok:true },
  ].map(s => `<div class="sw-item"><div class="sw-dot" style="background:${s.ok ? 'var(--success)' : 'var(--text-3)'}"></div><span class="sw-name">${s.name}</span><span class="sw-ver">${s.ver}</span></div>`).join('');
}

function launchRemote(app) {
  toast(`Iniciando conexión ${app.toUpperCase()}...`, 'info');
}

// ---- UPLOADS ----
async function confirmUpload() {
  const input = document.getElementById('fileInput');
  if (!input.files.length) return toast('Selecciona archivos', 'warn');

  const formData = new FormData();
  for (const file of input.files) {
    formData.append('files', file);
  }
  formData.append('project', document.getElementById('uploadProject').value);
  formData.append('notes', document.getElementById('uploadNotes').value);

  try {
    await apiFetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });
    toast('Archivos subidos', 'success');
    closeModal('uploadModal');
    renderFiles();
    renderDashboard();
  } catch (e) {}
}

function uploadFile() { document.getElementById('uploadModal').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function handleFileSelect(input) {
  const list = document.getElementById('uploadFileList');
  list.innerHTML = [...input.files].map(f => `<div class="ufl-item">📄 ${f.name}</div>`).join('');
}

// ---- TOAST ----
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---- INIT ----
renderDashboard();
renderRemote();
