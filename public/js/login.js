/* ====================================================
   AGUA SHIELD OPS — LOGIN LOGIC
   ==================================================== */

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('btnLogin');
  const loader = document.getElementById('btnLoader');
  const alert = document.getElementById('loginAlert');

  // Reset and Show Loading
  alert.className = 'login-alert';
  alert.textContent = '';
  btn.disabled = true;
  loader.style.display = 'block';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      sessionStorage.setItem('as_token', data.token);
      sessionStorage.setItem('as_user', JSON.stringify(data.user));
      
      showAlert('Acceso verificado. Sincronizando datos...', 'success');
      
      // Delay for cinematic feel
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      loader.style.display = 'none';
      btn.disabled = false;
      showAlert(data.error || 'Credenciales incorrectas.', 'error');
      document.getElementById('password').value = '';
    }
  } catch (error) {
    loader.style.display = 'none';
    btn.disabled = false;
    showAlert('Error crítico de conexión con el núcleo.', 'error');
    console.error('Login error:', error);
  }
}

function showAlert(msg, type) {
  const alert = document.getElementById('loginAlert');
  alert.textContent = msg;
  alert.className = `login-alert ${type}`;
}

// Typing sounds or micro-interactions could be added here
console.log('🛡 AGUA SHIELD OPS — Core Security Module Initialized');
