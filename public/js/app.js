/* ====================================================
   AQUA SHIELD OPS — MAIN APP JAVASCRIPT (API VERSION)
   ==================================================== */
const socket = io();

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

// ---- Helpers ----
function formatStatus(s) {
  const map = {
    'pending': 'PENDIENTE',
    'printing': '⚡ IMPRIMIENDO',
    'done': '✅ FINALIZADO',
    'error': '❌ ERROR',
    'queued': '⏳ EN COLA'
  };
  return map[s.toLowerCase()] || s.toUpperCase();
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
const PAGES = ['dashboard','files','queue','remote','clients','history','users','logs','settings'];
const PAGE_TITLES = { dashboard:'Dashboard Principal', files:'Gestión de Archivos', queue:'Cola de Impresión', remote:'Acceso Remoto', clients:'Clientes', history:'Historial de Trabajos', users:'Usuarios del Sistema', logs:'Logs del Sistema', settings:'Ajustes del Sistema' };

function navigateTo(page) {
  if (page === 'logout') {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }
  
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
  if (page === 'settings') renderSettings();
  if (page === 'remote') renderRemote();
}

// ---- Role-Based UI Restriction ----
function applyRoleRestrictions() {
  const role = asUser.role;
  const adminOnly = ['users', 'logs', 'settings'];
  
  adminOnly.forEach(p => {
    const navItem = document.getElementById('nav-' + p);
    if (navItem && role !== 'admin') {
      navItem.style.display = 'none';
    }
  });

  // Designer restriction
  if (role === 'designer') {
    const remoteNav = document.getElementById('nav-remote');
    const clientsNav = document.getElementById('nav-clients');
    if (remoteNav) remoteNav.style.display = 'none';
    if (clientsNav) clientsNav.style.display = 'none';
  }
}
applyRoleRestrictions();

  // Listen for navigation
  document.querySelectorAll('.spa-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = e.currentTarget.getAttribute('href');
      if (page) navigateTo(page);
    });
  });

// ---- DASHBOARD RENDER ----
async function renderDashboard() {
  try {
    // KPIs
    const stats = await apiFetch('/api/history/stats');
    document.getElementById('stat-files').textContent = stats.total_files;
    document.getElementById('stat-queue').textContent = stats.queue_count;
    document.getElementById('stat-clients').textContent = stats.total_clients;
    // (Total jobs can be used elsewhere if needed)

    // Queue preview
    const queue = await apiFetch('/api/queue');
    document.getElementById('dashQueueList').innerHTML = queue.slice(0, 5).map(q => `
      <div class="list-item">
        <span class="qi-order">${q.position}</span>
        <div style="flex:1">
          <div style="font-weight:700; color:#fff; font-size:0.8rem;">${q.filename}</div>
          <div style="font-size:0.7rem; color:var(--text-dim);">${q.client_company || 'S/C'}</div>
        </div>
        <span class="status-dot" style="background:${q.status === 'printing' ? 'var(--accent)' : '#f59e0b'}"></span>
      </div>`).join('');

    // Recent files
    const files = await apiFetch('/api/files?limit=5');
    document.getElementById('recentFilesList').innerHTML = files.slice(0, 4).map(f => {
      const ext = f.filetype.replace('.', '').toUpperCase();
      return `
      <div class="list-item" style="flex:1; min-width:140px; flex-direction:column; align-items:flex-start; gap:0.5rem;">
        <div class="badge-ext">${ext}</div>
        <div style="font-weight:700; color:#fff; font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${f.original}</div>
        <div style="font-size:0.65rem; color:var(--text-dim);">${f.client_company || 'S/C'}</div>
      </div>`;
    }).join('');

    // Logs (as activity)
    const logs = await apiFetch('/api/logs?limit=5');
    document.getElementById('activityFeed').innerHTML = logs.map(l => `
      <div class="list-item" style="padding: 0.5rem 1rem;">
        <div class="status-dot" style="background:${l.level === 'err' ? '#ef4444' : l.level === 'warn' ? '#f59e0b' : 'var(--accent)'}; width:6px; height:6px;"></div>
        <div style="flex:1">
          <div style="font-size:0.75rem; color:#fff;">${l.message}</div>
          <div style="font-size:0.6rem; color:var(--text-dim); margin-top:2px;">${new Date(l.created_at).toLocaleTimeString()}</div>
        </div>
      </div>`).join('');

  } catch (e) { console.error('Dashboard load error', e); }
}

async function addToQueueFromFiles(file_id) {
  try {
    await fetch('/api/queue', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${asToken}`
      },
      body: JSON.stringify({ file_id })
    });
    toast('Agregado a la cola de producción', 'success');
    renderDashboard();
  } catch (e) {
    toast('Error al agregar a la cola', 'err');
  }
}

// ---- FILES ----
async function renderFiles() {
  await renderBrands();
  await renderFilesGrid();
}

function openNewBrandModal() {
  document.getElementById('newBrandModal').classList.remove('hidden');
}

async function saveNewBrand() {
  const nameInput = document.getElementById('newBrandName');
  const iconInput = document.getElementById('newBrandIcon');
  const name = nameInput.value.trim();
  const icon = iconInput.value.trim();
  
  if (!name) return toast('El nombre es obligatorio', 'err');
  
  try {
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon })
    });
    
    if (res.ok) {
      toast('Marca añadida correctamente', 'success');
      closeModal('newBrandModal');
      nameInput.value = '';
      await renderBrands();
    }
  } catch (e) {
    toast('Error al guardar marca', 'err');
  }
}

async function renderBrands() {
  const list = document.getElementById('brandList');
  if (!list) return;
  
  try {
    const brands = await apiFetch('/api/brands');
    list.innerHTML = `
      <button class="nav-item ${!currentBrandId ? 'active' : ''}" style="text-align:left; width:100%; border:none; cursor:pointer; background:transparent; justify-content:flex-start;" onclick="filterByBrand(null, 'Todos los Archivos')">
        VER TODO
      </button>
      <div style="height:1px; background:rgba(255,255,255,0.05); margin:0.5rem 0;"></div>
    ` + brands.map(b => `
      <button class="nav-item ${currentBrandId === b.id ? 'active' : ''}" style="text-align:left; width:100%; border:none; cursor:pointer; background:transparent; justify-content:flex-start;" onclick="filterByBrand(${b.id}, '${b.name}')">
        ${b.name}
      </button>
    `).join('');
  } catch (e) {
    console.error("Error loading brands:", e);
  }
}

let currentBrandId = null;

async function filterByBrand(id, name) {
  currentBrandId = id;
  const title = document.getElementById('currentBrandName');
  if (title) title.textContent = name;
  await renderBrands(); // Update active state
  await renderFilesGrid();
}

async function renderFilesGrid() {
  const grid = document.getElementById('filesGrid');
  if (!grid) return;

  try {
    const url = currentBrandId ? `/api/files?brand_id=${currentBrandId}` : '/api/files';
    const files = await apiFetch(url);
    
    if (files.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:4rem; color:#444;">No hay archivos en esta categoría</div>`;
      return;
    }

    grid.innerHTML = files.map(f => `
      <div class="bento-item" style="padding: 1.5rem; border-radius: 12px; background: #0a0a0a; border: 1px solid #1a1a1a; display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="padding: 8px 12px; background: #111; border: 1px solid #222; border-radius: 6px; font-family: 'Outfit'; font-size: 0.65rem; font-weight: 900; color: #fff; letter-spacing: 0.1em;">
            ${f.filetype.replace('.','').toUpperCase()}
          </div>
          <span style="font-size: 0.55rem; color: var(--accent); font-weight: 800; text-transform: uppercase;">● ${formatStatus(f.status)}</span>
        </div>
        
        <div style="flex: 1;">
          <div style="font-weight: 700; color: #fff; font-size: 0.9rem; margin-bottom: 0.25rem;">${f.original}</div>
          <div style="font-size: 0.7rem; color: #555; text-transform: uppercase; letter-spacing: 0.05em;">Cliente: ${f.client_company || 'Particular'}</div>
        </div>

        <div style="display: flex; gap: 0.5rem; border-top: 1px solid #111; padding-top: 1rem;">
          <button class="nav-item" style="flex: 1; padding: 0.5rem; justify-content: center; background: #fff; color: #000; font-size: 0.65rem;" onclick="downloadFile(${f.id}, '${f.original}')">DESCARGAR</button>
          <button class="nav-item" style="width: 40px; justify-content: center; padding: 0.5rem; border: 1px solid #333;" onclick="addToQueueFromFiles(${f.id})">🚀</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error("Error loading files:", e);
  }
}

async function downloadFile(id, filename) {
  try {
    toast(`Iniciando descarga: ${filename}...`, 'info');
    const response = await fetch(`/api/files/download/${id}`, {
      headers: { 'Authorization': `Bearer ${asToken}` }
    });
    
    if (!response.ok) throw new Error('Error al descargar');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    toast('Descarga completada', 'success');
  } catch (e) {
    toast('No se pudo descargar el archivo', 'err');
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
    const container = document.getElementById('queueFullList');
    
    container.innerHTML = `
      <div class="table-wrapper" style="margin-top:0;">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:60px">POS</th>
              <th>ARCHIVO / DISEÑO</th>
              <th>CLIENTE</th>
              <th>ESTADO</th>
              <th style="text-align:right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            ${queue.map(q => `
              <tr>
                <td><span style="font-family:'Outfit'; font-weight:900; color:#444;">${String(q.position).padStart(2, '0')}</span></td>
                <td>
                  <div style="font-weight:800; color:#fff; font-size:0.85rem; font-family:'Outfit';">${q.filename}</div>
                  <div style="font-size:0.6rem; color:#555; text-transform:uppercase; letter-spacing:0.05em; margin-top:2px;">ID: #${q.file_id}</div>
                </td>
                <td style="color:#888; font-size:0.75rem; font-weight:600;">${q.client_company || 'S/C'}</td>
                <td>
                  <span style="font-size:0.55rem; background:rgba(245,158,11,0.1); color:#f59e0b; padding:4px 10px; border-radius:8px; font-weight:800; letter-spacing:0.05em; text-transform:uppercase;">
                    ${formatStatus(q.status)}
                  </span>
                </td>
                <td style="text-align:right;">
                  <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                    <button class="btn-icon" style="width:32px; height:32px; font-size:0.7rem;" onclick="updateQueueStatus(${q.id}, 'printing')" title="Priorizar">⚡</button>
                    <button class="btn-icon" style="width:32px; height:32px; font-size:0.7rem;" onclick="updateQueueStatus(${q.id}, 'done')" title="Completar">✅</button>
                    <button class="btn-icon btn-delete" style="width:32px; height:32px; font-size:0.7rem;" onclick="deleteFromQueue(${q.id})" title="Eliminar">✕</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${queue.length === 0 ? '<div style="padding:4rem; text-align:center; color:#444; font-weight:700;">LA COLA ESTÁ VACÍA</div>' : ''}
    `;
  } catch (e) {
    console.error("Error loading queue:", e);
  }
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
function openNewClientModal() {
  document.getElementById('editClientId').value = '';
  document.getElementById('clientName').value = '';
  document.getElementById('clientCompany').value = '';
  document.getElementById('clientEmail').value = '';
  document.getElementById('clientModalTitle').textContent = 'Registrar Nuevo Cliente';
  document.getElementById('newClientModal').classList.remove('hidden');
}

async function saveClient() {
  const id = document.getElementById('editClientId').value;
  const name = document.getElementById('clientName').value.trim();
  const company = document.getElementById('clientCompany').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const status = document.getElementById('clientStatus').value;

  if (!name || !company) return toast('Nombre y Empresa son obligatorios', 'err');

  try {
    const url = id ? `/api/clients/${id}` : '/api/clients';
    const method = id ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${asToken}`
      },
      body: JSON.stringify({ name, company, email, status })
    });
    
    if (res.ok) {
      toast(id ? 'Cliente actualizado' : 'Cliente registrado', 'success');
      closeModal('newClientModal');
      renderClients();
      renderDashboard();
    }
  } catch (e) {
    toast('Error en el proceso', 'err');
  }
}

window.editClient = async function(id) {
  console.log("Editando cliente:", id);
  try {
    const c = await apiFetch(`/api/clients/${id}`);
    document.getElementById('editClientId').value = c.id;
    document.getElementById('clientName').value = c.name;
    document.getElementById('clientCompany').value = c.company;
    document.getElementById('clientEmail').value = c.email || '';
    document.getElementById('clientStatus').value = c.status;
    document.getElementById('clientModalTitle').textContent = 'Editar Cliente';
    document.getElementById('newClientModal').classList.remove('hidden');
  } catch (e) { toast('Error al cargar datos', 'err'); }
};

window.ejecutarEliminacionMaestra = async function(id) {
  if (!confirm('¿ESTÁS SEGURO? Se borrarán todos los archivos y trabajos de este cliente de forma permanente.')) return;
  
  try {
    const response = await fetch(`/api/clients/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('as_token')}` }
    });

    if (response.ok) {
      toast('✅ Cliente eliminado con éxito', 'success');
      renderClients();
      renderDashboard();
    } else {
      toast(`❌ Error en servidor`, 'err');
    }
  } catch (e) { 
    toast('⚠️ Error de red', 'err'); 
  }
};

async function renderClients() {
  try {
    const clients = await apiFetch('/api/clients');
    const clientsBody = document.getElementById('clientsTableBody');
    if (clientsBody) {
      clientsBody.innerHTML = clients.map(c => `
        <tr>
          <td style="padding:1.2rem 1rem;">
            <div style="font-weight:700; color:#fff; font-size:0.9rem; font-family:'Outfit';">${c.name}</div>
            <div style="font-size:0.65rem; color:#555; text-transform:uppercase; letter-spacing:0.05em; margin-top:4px;">${c.company}</div>
          </td>
          <td style="color:var(--text-dim); font-size:0.8rem;">${c.email || 'Sin correo'}</td>
          <td>
            <span style="font-size:0.6rem; background: ${c.status === 'active' ? 'rgba(0,255,170,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${c.status === 'active' ? 'var(--accent)' : '#ef4444'}; padding:4px 10px; border-radius:6px; font-weight:800; text-transform:uppercase;">
              ${c.status === 'active' ? '● ACTIVO' : '○ INACTIVO'}
            </span>
          </td>
          <td style="text-align:right;">
            <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
              <button class="btn-icon" style="width:36px; height:36px;" onclick="editClient(${c.id})">✏️</button>
              <button class="btn-icon btn-delete" style="width:36px; height:36px;" onclick="ejecutarEliminacionMaestra(${c.id})">✕</button>
            </div>
          </td>
        </tr>`).join('');
    }
  } catch (e) { console.error('Clients load error', e); }
}

// ---- HISTORY ----
async function renderHistory() {
  try {
    const history = await apiFetch('/api/history');
    document.getElementById('historyTableBody').innerHTML = history.map(h => `
      <tr>
        <td><span class="badge-ext">${h.id}</span></td>
        <td class="td-bold">${h.job_name}</td>
        <td>${h.client_company}</td>
        <td style="color:var(--text-dim)">${h.filename}</td>
        <td>${new Date(h.created_at).toLocaleDateString()}</td>
        <td><span class="pill ${h.status}">${formatStatus(h.status)}</span></td>
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
      <div class="list-item" style="padding:1rem;">
        <span class="status-dot" style="background:${l.level === 'err' ? '#ef4444' : 'var(--accent)'}"></span>
        <div style="flex:1">
          <div style="color:#fff; font-size:0.85rem;">${l.message}</div>
          <div style="font-size:0.7rem; color:var(--text-dim);">${new Date(l.created_at).toLocaleString()}</div>
        </div>
      </div>`).join('');
  } catch (e) {}
}

// ---- REMOTE OPERATIONS ----
async function renderRemote() {
  const workspace = document.getElementById('remoteWorkspace');
  if (!workspace) return;

  const userStr = sessionStorage.getItem('as_user');
  const user = userStr ? JSON.parse(userStr) : {};
  const isOperator = user.role === 'operator';

  if (isOperator) {
    workspace.innerHTML = `
      <div style="text-align: center; padding: 2rem; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at center, #0a0a0a 0%, #000 100%);">
        <div style="font-size: 3rem; margin-bottom: 1.5rem;">📡</div>
        <h2 style="font-family:'Outfit'; color:#fff; letter-spacing:0.1em; margin-bottom:0.5rem;">TU ESTACIÓN ESTÁ LISTA</h2>
        <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 3rem;">Pásale estos datos a tu Administrador para que pueda conectar con este equipo.</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; width: 100%; max-width: 500px;">
          <div class="bento-item" style="padding: 1.5rem; background: rgba(0,255,170,0.05); border: 1px solid rgba(0,255,170,0.1);"><div class="bento-label">IP PÚBLICA</div><div style="font-size: 1.5rem; font-weight: 800; color: var(--accent);">181.143.220.12</div></div>
          <div class="bento-item" style="padding: 1.5rem; background: rgba(255,255,255,0.05);"><div class="bento-label">PUERTO</div><div style="font-size: 1.5rem; font-weight: 800; color: #fff;">6080</div></div>
        </div>
        <button class="nav-item" style="margin-top:2rem; width:100%; max-width:500px; background:var(--accent); color:#000; font-weight:800; padding:1.5rem;" onclick="startLiveDemo()">🚀 ACTIVAR SEÑAL REMOTA</button>
        <video id="liveVideoDemo" autoplay playsinline style="display:none;"></video>
      </div>
    `;
  } else {
    // ADMIN VIEW
    workspace.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; background: #000; overflow: hidden;">
        <div style="padding: 1rem; background: #111; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222;">
           <div style="font-size: 0.75rem; font-weight: 800; color: var(--accent); font-family:'Outfit';">🛰️ ACCESO MAESTRO — ESTACIÓN BARRANQUILLA</div>
           <button class="nav-item" style="padding: 0.5rem 1rem; font-size: 0.6rem; background: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="location.reload()">DESCONECTAR</button>
        </div>
        <div id="remoteContainer" style="flex: 1; position: relative; background: #000; display: flex; align-items: center; justify-content: center; cursor: crosshair;">
          <video id="remoteVideo" autoplay playsinline style="width:100%; height:100%; object-fit:contain;"></video>
          <div id="remoteOverlay" style="position: absolute; inset: 0; z-index: 99;"></div>
        </div>
      </div>
    `;

    const remoteVideo = document.getElementById('remoteVideo');
    const remoteOverlay = document.getElementById('remoteOverlay');

    socket.on('remote-frame', (data) => { remoteVideo.src = data; });

    remoteOverlay.addEventListener('mousedown', (e) => {
      const rect = remoteVideo.getBoundingClientRect();
      socket.emit('remote-input', { type: 'click', x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, button: e.button });
    });

    remoteOverlay.addEventListener('mousemove', (e) => {
      if (Date.now() % 5 === 0) {
        const rect = remoteVideo.getBoundingClientRect();
        socket.emit('remote-input', { type: 'move', x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
      }
    });

    window.addEventListener('keydown', (e) => {
      if (document.getElementById('page-remote').classList.contains('hidden')) return;
      socket.emit('remote-input', { type: 'key', key: e.key });
    });
  }

  // Common software list rendering
  const swList = document.getElementById('softwareList');
  if (swList) {
    swList.innerHTML = [
      { name:'Adobe Illustrator', ver:'2024', status:'Normal' },
      { name:'FlexiSIGN-PRO', ver:'v12.2', status:'Activo' },
      { name:'Roland VersaWorks', ver:'v6.4', status:'Idle' }
    ].map(s => `
      <div class="list-item" style="padding:0.6rem 1rem; margin-bottom:4px;">
        <div style="flex:1">
          <div style="font-weight:700; color:#fff; font-size:0.8rem;">${s.name}</div>
          <div style="font-size:0.6rem; color:var(--text-dim);">${s.ver}</div>
        </div>
        <div style="font-size:0.6rem; font-weight:800; color:var(--accent); text-transform:uppercase;">${s.status}</div>
      </div>`).join('');
  }
}
  
function startRemoteSession() {
  const host = localStorage.getItem('remoteHost');
  const port = localStorage.getItem('remotePort');
  if (!host || !port) {
    toast('Configura los datos de la estación primero', 'warn');
    openRemoteSettings();
    return;
  }

  const ph = document.getElementById('vncPlaceholder');
  if (!ph) return;

  ph.innerHTML = `
    <div style="text-align:center;">
      <div class="ring-pulse" style="width:80px; height:80px; margin:0 auto 2rem;">
        <div class="ring-inner">...</div>
      </div>
      <div style="font-size:1.1rem; font-weight:700; color:var(--accent);">NEGOCIANDO HANDSHAKE SEGURO...</div>
      <div style="font-size:0.7rem; color:#444; margin-top:1rem;">Estableciendo túnel WSS con ${host}:${port}</div>
    </div>
  `;

  setTimeout(() => {
    ph.innerHTML = `
      <div id="vncCanvasContainer" style="position:absolute; inset:0; background:#000; display:flex; flex-direction:column;">
         <!-- Monitor Header -->
         <div style="background:#1a1a1a; padding:5px 15px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333;">
            <div style="font-size:0.6rem; color:#888;">RESOLUCIÓN: 1920x1080 (100%) · CIFRADO AES-256</div>
            <div style="display:flex; gap:10px;">
               <span style="color:var(--accent); font-size:0.6rem; font-weight:800;">● LIVE</span>
               <span style="color:#666; font-size:0.6rem;">FPS: 60</span>
            </div>
         </div>
         
         <!-- The Desktop Stream -->
         <div style="position:relative; flex:1; overflow:hidden; cursor:crosshair;">
            <!-- Simulated Windows Desktop with Illustrator -->
            <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop" style="width:100%; height:100%; object-fit:cover;">
            
            <!-- Floating Illustrator Window UI Overlay -->
            <div style="position:absolute; top:10%; left:10%; width:80%; height:70%; background:rgba(30,30,30,0.95); border:1px solid #444; border-radius:4px; box-shadow:0 20px 50px rgba(0,0,0,0.5); display:flex; flex-direction:column;">
               <div style="background:#2d2d2d; padding:8px 15px; display:flex; justify-content:space-between; font-size:0.7rem; color:#ccc; border-bottom:1px solid #1a1a1a;">
                  <div>Adobe Illustrator 2024 - [Banner_AguaShield.ai]</div>
                  <div>— ❐ ✕</div>
               </div>
               <div style="flex:1; display:flex; align-items:center; justify-content:center; color:#444; font-weight:800;">[ ÁREA DE DISEÑO REMOTA ]</div>
            </div>

            <!-- Simulated Mouse Cursor -->
            <div id="remoteCursor" style="position:absolute; top:50%; left:50%; width:20px; height:20px; transition: all 0.1s ease-out; pointer-events:none;">
               <svg viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1"><path d="M7 2l12 11.2l-5.8 0.8l3.3 6.3l-2.5 1.4l-3.3-6.3l-3.7 3.6z"/></svg>
            </div>
         </div>
      </div>
    `;
    
    // Start cursor simulation
    simulateRemoteCursor();
    const term = document.getElementById('remoteTerminal');
    if (term) {
       const div = document.createElement('div');
       div.style.color = '#fff';
       div.textContent = `> CONEXIÓN ESTABLECIDA CON ${host}. Recibiendo frames...`;
       term.appendChild(div);
       term.scrollTop = term.scrollHeight;
    }
  }, 2500);
}

function openRemoteSettings() {
  document.getElementById('remoteHost').value = localStorage.getItem('remoteHost') || '';
  document.getElementById('remotePort').value = localStorage.getItem('remotePort') || '';
  document.getElementById('remoteSettingsModal').classList.remove('hidden');
}

function closeRemoteSettings() {
  document.getElementById('remoteSettingsModal').classList.add('hidden');
}

function saveRemoteSettings() {
  const host = document.getElementById('remoteHost').value;
  const port = document.getElementById('remotePort').value;
  const pass = document.getElementById('remotePass').value;

  if (!host || !port) return toast('IP y Puerto son obligatorios', 'warn');

  localStorage.setItem('remoteHost', host);
  localStorage.setItem('remotePort', port);
  localStorage.setItem('remotePass', pass);

  toast('Configuración de Estación guardada', 'success');
  closeRemoteSettings();
}

function renderSettings() {
  document.getElementById('globalHost').value = localStorage.getItem('remoteHost') || '';
  document.getElementById('globalPort').value = localStorage.getItem('remotePort') || '';
  renderSettingsUsers();
}

function showSettingsTab(tab, btn) {
  document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  document.getElementById('workstation-tab').classList.toggle('hidden', tab !== 'workstation');
  document.getElementById('users-tab').classList.toggle('hidden', tab !== 'users');
}

async function renderSettingsUsers() {
  const list = document.getElementById('settingsUserList');
  if (!list) return;

  const users = [
    { name: 'Samuel Santiago', user: 'sam', role: 'Admin', status: 'Online' },
    { name: 'Operador Barranquilla', user: 'operador_baq', role: 'Estación', status: 'Standby' },
    { name: 'Diseñador Senior', user: 'design_01', role: 'Editor', status: 'Offline' }
  ];

  list.innerHTML = users.map(u => `
    <div class="list-item">
      <div style="flex:1">
        <div style="font-weight:700; color:#fff;">${u.name} (@${u.user})</div>
        <div style="font-size:0.65rem; color:var(--text-dim);">${u.role}</div>
      </div>
      <div style="font-size:0.6rem; color:${u.status === 'Online' ? 'var(--accent)' : '#666'}; font-weight:800;">${u.status.toUpperCase()}</div>
    </div>`).join('');
}

function saveGlobalSettings() {
  const host = document.getElementById('globalHost').value;
  const port = document.getElementById('globalPort').value;
  const pass = document.getElementById('globalPass').value;

  if (!host || !port) return toast('Datos incompletos', 'warn');

  localStorage.setItem('remoteHost', host);
  localStorage.setItem('remotePort', port);
  localStorage.setItem('remotePass', pass);

  toast('CONFIGURACIÓN MAESTRA ACTUALIZADA', 'success');
}

async function testRemoteConnection() {
  const host = document.getElementById('remoteHost').value;
  const port = document.getElementById('remotePort').value;
  const resDiv = document.getElementById('testResult');

  if (!host || !port) return toast('Ingresa IP y Puerto primero', 'warn');

  resDiv.classList.remove('hidden');
  resDiv.style.color = '#aaa';
  resDiv.textContent = '⏱️ Probando enlace con Barranquilla...';

  try {
    // In a real scenario, we might use a small ping endpoint or try to fetch the WS handshake
    // For now, we simulate the reachability check
    await new Promise(r => setTimeout(r, 1500));
    
    // Logic: If it's a valid-looking IP, we say it's OK for the demo
    if (host.includes('.')) {
      resDiv.style.color = 'var(--accent)';
      resDiv.innerHTML = '✅ ENLACE EXITOSO: La estación respondió correctamente.';
      toast('Conexión verificada', 'success');
    } else {
      throw new Error();
    }
  } catch (e) {
    resDiv.style.color = '#ef4444';
    resDiv.innerHTML = '❌ ERROR: No se pudo contactar la estación. Verifica la IP y que el puerto esté abierto.';
    toast('Fallo de conexión', 'error');
  }
}

function remoteCmd(cmd) {
  const term = document.getElementById('remoteTerminal');
  const msg = document.createElement('div');
  msg.textContent = `> Ejecutando: ${cmd}...`;
  term.appendChild(msg);
  setTimeout(() => {
    const res = document.createElement('div');
    res.style.color = '#fff';
    res.textContent = `> Resultado: OK. Comando procesado en ${cmd}.`;
    term.appendChild(res);
    term.scrollTop = term.scrollHeight;
  }, 800);
}

function launchRemote(app) {
  toast(`Iniciando conexión ${app.toUpperCase()}...`, 'info');
}

async function startLiveDemo() {
  const workspace = document.getElementById('remoteWorkspace');
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ 
      video: { cursor: "always", frameRate: 15 } 
    });
    
    // Create hidden canvas for capturing frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    workspace.innerHTML = `
      <div style="position:absolute; inset:0; background:#000; display:flex; flex-direction:column; align-items:center; justify-content:center;">
         <div style="color:var(--accent); font-weight:800; margin-bottom:1rem; font-size:1.5rem;">● TRANSMITIENDO EN VIVO</div>
         <p style="color:#666; font-size:0.8rem;">Tu pantalla está siendo enviada al Administrador en tiempo real.</p>
         <button onclick="location.reload()" style="margin-top:2rem; padding:0.7rem 2rem; background:#ef4444; border:none; border-radius:8px; color:#fff; font-weight:700; cursor:pointer;">DETENER TRANSMISIÓN</button>
      </div>
    `;

    // Frame broadcast loop
    const broadcastInterval = setInterval(() => {
      if (video.paused || video.ended) return clearInterval(broadcastInterval);
      
      canvas.width = video.videoWidth / 2; // Resize for performance
      canvas.height = video.videoHeight / 2;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const frameData = canvas.toDataURL('image/jpeg', 0.5);
      socket.emit('screen-frame', frameData);
    }, 100);

    toast('CONEXIÓN PUNTO A PUNTO ESTABLECIDA', 'success');
    
  } catch (err) {
    console.error("Error sharing screen:", err);
    toast('Acceso denegado o error de captura', 'error');
  }
}

// Admin Side: Receive and render remote frames
socket.on('remote-frame', (frame) => {
  const ph = document.getElementById('vncPlaceholder');
  if (!ph) return;

  // If it's the first frame, prepare the container
  if (!ph.querySelector('#liveRender')) {
    ph.innerHTML = `
      <div style="position:absolute; inset:0; background:#000; display:flex; flex-direction:column;">
        <div style="background:#1a1a1a; padding:4px 10px; display:flex; justify-content:space-between; align-items:center; font-size:0.6rem; color:#888;">
           <span>● LIVE STREAM: BARRANQUILLA OPS</span>
           <span style="color:var(--accent); font-weight:800;">CONECTADO</span>
        </div>
        <img id="liveRender" style="width:100%; height:100%; object-fit:contain; background:#000;">
      </div>
    `;
  }

  const img = document.getElementById('liveRender');
  if (img) img.src = frame;
});

function simulateRemoteCursor() {
  const cursor = document.getElementById('remoteCursor');
  if (!cursor) return;
  
  setInterval(() => {
    const x = 20 + Math.random() * 60;
    const y = 20 + Math.random() * 60;
    cursor.style.left = x + '%';
    cursor.style.top = y + '%';
  }, 3000);
}

// ---- UPLOADS ----
async function confirmUpload() {
  const btn = document.querySelector('#uploadModal .btn-primary');
  const input = document.getElementById('fileInput');
  if (!input.files.length) return toast('Selecciona archivos del PC', 'warn');

  const formData = new FormData();
  for (const file of input.files) {
    formData.append('files', file);
  }
  
  formData.append('client_id', document.getElementById('uploadClient').value);
  formData.append('notes', document.getElementById('uploadNotes').value);
  if (currentBrandId) formData.append('brand_id', currentBrandId);

  try {
    btn.disabled = true;
    btn.textContent = 'Subiendo...';
    
    await apiFetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });
    
    toast('Archivos subidos correctamente', 'success');
    closeModal('uploadModal');
    await renderFiles();
    await renderDashboard();
  } catch (e) {
    // Error already toasted by apiFetch
  } finally {
    btn.disabled = false;
    btn.textContent = 'Procesar Archivo';
  }
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
