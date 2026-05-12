/* ============================
   AGUA SHIELD — LOGIN LOGIC
   ============================ */

// Demo credentials
const USERS = [
  { user: 'admin', pass: 'admin123', role: 'admin', name: 'Administrador' },
  { user: 'operador', pass: 'ops2026', role: 'operator', name: 'Operador Plotter' },
  { user: 'diseno', pass: 'design2026', role: 'designer', name: 'Diseñador' },
];

// ---- Particle Canvas ----
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function randBetween(a, b) { return a + Math.random() * (b - a); }

for (let i = 0; i < 80; i++) {
  particles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: randBetween(0.5, 2.5),
    vx: randBetween(-0.3, 0.3),
    vy: randBetween(-0.3, 0.3),
    alpha: randBetween(0.1, 0.5),
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,180,255,${p.alpha})`;
    ctx.fill();
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
  });
  // Draw connecting lines
  particles.forEach((p, i) => {
    particles.slice(i + 1).forEach(q => {
      const dist = Math.hypot(p.x - q.x, p.y - q.y);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = `rgba(0,150,255,${0.06 * (1 - dist / 120)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

// ---- Counter animation ----
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current).toLocaleString('es-CO') + suffix;
  }, 25);
}
animateCounter(document.getElementById('statFiles'), 2847);
animateCounter(document.getElementById('statJobs'), 1203);
animateCounter(document.getElementById('statClients'), 89);

// ---- Toggle Password ----
function togglePassword() {
  const input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ---- Show Alert ----
function showAlert(msg, type = 'error') {
  const el = document.getElementById('loginAlert');
  el.textContent = msg;
  el.className = `login-alert show ${type}`;
  setTimeout(() => { el.className = 'login-alert'; }, 4000);
}

// ---- Handle Login ----
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('btnLogin');

  btn.classList.add('loading');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    btn.classList.remove('loading');

    if (response.ok) {
      sessionStorage.setItem('as_token', data.token);
      sessionStorage.setItem('as_user', JSON.stringify(data.user));
      showAlert('Acceso concedido. Redirigiendo...', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } else {
      showAlert(data.error || 'Credenciales incorrectas. Intenta de nuevo.');
      document.getElementById('password').value = '';
    }
  } catch (error) {
    btn.classList.remove('loading');
    showAlert('Error de conexión con el servidor.');
    console.error('Login error:', error);
  }
}
