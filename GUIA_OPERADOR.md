# 🛰️ Guía de Conexión — Estación Barranquilla (Aqua Shield OPS)

Este manual contiene los pasos necesarios para configurar el PC que será controlado remotamente desde la central de Aqua Shield.

### 1. Requisitos Previos
Es indispensable tener instalado **Node.js**. 
- Descarga: [https://nodejs.org/](https://nodejs.org/)
- Elige la versión **LTS** (la más estable).

### 2. Configuración Inicial (Solo la primera vez)
1. Crea una carpeta llamada `AquaShield_Control`.
2. Coloca el archivo `agente_remoto.js` dentro de esa carpeta.
3. Abre una terminal (CMD) en esa carpeta y escribe:
   ```bash
   npm install socket.io-client robotjs
   ```

### 3. Cómo Activar el Acceso Remoto
Para permitir que el Administrador controle el PC, sigue estos pasos:
1. Abre la carpeta `AquaShield_Control`.
2. Abre una terminal y ejecuta:
   ```bash
   node agente_remoto.js
   ```
3. Cuando veas el mensaje `✅ Conectado`, el Administrador ya podrá operar desde el Dashboard.

---
**⚠️ AVISO:** No cierres la ventana negra (terminal) mientras el Administrador esté trabajando, de lo contrario la conexión se perderá.
