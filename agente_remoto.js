/**
 * AQUA SHIELD OPS — AGENTE DE CONTROL REMOTO (BARRANQUILLA)
 * 
 * Este script permite que el Administrador controle este PC desde el Dashboard.
 * Instrucciones:
 * 1. Instalar dependencias: npm install socket.io-client robotjs
 * 2. Ejecutar: node agente_remoto.js
 */

const io = require('socket.io-client');
const robot = require('robotjs');

// SUSTITUIR POR TU URL DE RENDER
const RENDER_URL = 'https://aquashield-ops.onrender.com'; 

console.log('🛡️ Iniciando Agente Remoto Aqua Shield...');
const socket = io(RENDER_URL);

socket.on('connect', () => {
    console.log('✅ Conectado al Centro de Operaciones en Render');
    console.log('📡 Esperando comandos del Administrador...');
});

socket.on('remote-input', (data) => {
    const screenSize = robot.getScreenSize();
    
    // CONTROL DE RATÓN
    if (data.type === 'move' || data.type === 'click') {
        const x = data.x * screenSize.width;
        const y = data.y * screenSize.height;
        
        robot.moveMouse(x, y);
        
        if (data.type === 'click') {
            const button = data.button === 2 ? 'right' : 'left';
            robot.mouseClick(button);
            console.log(`🖱️ Clic ${button} en: ${Math.round(x)}, ${Math.round(y)}`);
        }
    }

    // CONTROL DE TECLADO
    if (data.type === 'key') {
        try {
            const key = data.key.toLowerCase();
            // Mapeo de teclas especiales si es necesario
            if (key === 'enter') robot.keyTap('enter');
            else if (key === 'backspace') robot.keyTap('backspace');
            else if (key.length === 1) robot.keyTap(key);
            console.log(`⌨️ Tecla presionada: ${key}`);
        } catch (e) {
            // Silenciar errores de teclas no soportadas
        }
    }
});

socket.on('disconnect', () => {
    console.log('❌ Desconectado del servidor. Reintentando...');
});
