/* ====================================================
   AQUA SHIELD OPS — LÓGICA DE ACCESO SEGURO
   ==================================================== */

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('btnLogin');
  const loader = document.getElementById('btnLoader');
  const alert = document.getElementById('loginAlert');

  // Estado de carga
  alert.textContent = '';
  btn.disabled = true;
  if (loader) loader.style.display = 'block';
  btn.style.opacity = '0.7';
  btn.querySelector('.btn-text').textContent = 'VERIFICANDO...';

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
      
      alert.style.color = '#00ffaa';
      alert.textContent = 'Acceso verificado. Sincronizando datos...';
      
      // Animación de salida hacia el dashboard
      setTimeout(() => {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 500);
      }, 1000);
    } else {
      btn.disabled = false;
      if (loader) loader.style.display = 'none';
      btn.style.opacity = '1';
      btn.querySelector('.btn-text').textContent = 'INICIALIZAR SISTEMA';
      
      alert.style.color = '#ff3e3e';
      alert.textContent = data.error || 'Credenciales no reconocidas por el núcleo.';
      document.getElementById('password').value = '';
    }
  } catch (error) {
    btn.disabled = false;
    if (loader) loader.style.display = 'none';
    btn.style.opacity = '1';
    btn.querySelector('.btn-text').textContent = 'INICIALIZAR SISTEMA';
    
    alert.style.color = '#ff3e3e';
    alert.textContent = 'Error de enlace con el servidor de seguridad.';
    console.error('Login error:', error);
  }
}

// Inicialización de efectos visuales adicionales
document.addEventListener('DOMContentLoaded', () => {
  console.log('🛡 AQUA SHIELD OPS — Módulo de Seguridad Iniciado');
  
  // ---- VIDEO ROTATION SYSTEM ----
  const videos = ['video_login_1.mp4', 'video_login_2.mp4'];
  let currentVideoIndex = 0;
  
  const mainVideo = document.querySelector('.main-visual');
  const blurVideo = document.querySelector('.bg-video-blur');
  
  function rotateVideo() {
    currentVideoIndex = (currentVideoIndex + 1) % videos.length;
    const nextSrc = videos[currentVideoIndex];
    
    // Smooth transition out
    mainVideo.style.opacity = '0';
    blurVideo.style.opacity = '0';
    
    setTimeout(() => {
      mainVideo.src = nextSrc;
      blurVideo.src = nextSrc;
      mainVideo.load();
      blurVideo.load();
      
      mainVideo.oncanplay = () => {
        mainVideo.play();
        blurVideo.play();
        mainVideo.style.opacity = '1';
        blurVideo.style.opacity = '1';
      };
    }, 500);
  }

  // Set initial source if needed (optional since HTML has it)
  // Catch the end of the video to rotate
  if (mainVideo) {
    mainVideo.removeAttribute('loop'); // Disable native loop to catch 'ended'
    mainVideo.addEventListener('ended', rotateVideo);
    
    // Initial transition setup
    mainVideo.style.transition = 'opacity 0.8s ease-in-out';
    blurVideo.style.transition = 'opacity 0.8s ease-in-out';
  }

  // Efecto de enfoque en inputs
  const inputs = document.querySelectorAll('.input-container input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.style.transform = 'translateX(5px)';
    });
    input.addEventListener('blur', () => {
      input.parentElement.style.transform = 'translateX(0)';
    });
  });
});
