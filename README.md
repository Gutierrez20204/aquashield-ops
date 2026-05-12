# 🛡 Agua Shield OPS — Sistema de Gestión Operativa

Sistema de acceso remoto y gestión operativa para empresa de diseño y ploteo vehicular en Barranquilla, Colombia.

## 🚀 Inicio Rápido

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/aquashield-ops.git
cd aquashield-ops

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar servidor
npm start
# ó en desarrollo con auto-reload:
npm run dev
```

Abre **http://localhost:3000** en tu navegador.

## 🔐 Credenciales por defecto

| Usuario    | Contraseña   | Rol           |
|------------|--------------|---------------|
| `admin`    | `admin123`   | Administrador |
| `operador` | `ops2026`    | Operador      |
| `diseno`   | `design2026` | Diseñador     |

> ⚠️ Cambia las contraseñas en producción.

## 🗂 Estructura del Proyecto

```
aquashield-ops/
├── public/              # Frontend estático (servido por Express)
│   ├── index.html       # Login
│   ├── dashboard.html   # Panel principal
│   ├── css/             # Estilos
│   └── js/              # Lógica frontend
├── routes/              # API REST
│   ├── auth.js          # Login / JWT
│   ├── files.js         # Gestión de archivos
│   ├── queue.js         # Cola de impresión
│   ├── clients.js       # Clientes
│   ├── history.js       # Historial + estadísticas
│   ├── users.js         # Usuarios
│   └── logs.js          # Logs del sistema
├── db/
│   └── database.js      # SQLite (sql.js) + schema + seed
├── uploads/             # Archivos subidos (gitignored)
├── server.js            # Entrada principal Express
├── package.json
├── .env.example
└── .gitignore
```

## 📡 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión → JWT |
| `GET` | `/api/auth/me` | Perfil del usuario actual |
| `GET` | `/api/files` | Listar archivos (filtros: type, status, q) |
| `POST` | `/api/files/upload` | Subir AI/EPS/PDF/SVG |
| `DELETE` | `/api/files/:id` | Eliminar archivo |
| `GET` | `/api/queue` | Cola de impresión activa |
| `POST` | `/api/queue` | Agregar trabajo a cola |
| `PATCH` | `/api/queue/:id/status` | Cambiar estado del trabajo |
| `PATCH` | `/api/queue/:id/move` | Reordenar cola |
| `GET` | `/api/clients` | Listar clientes |
| `POST` | `/api/clients` | Crear cliente |
| `GET` | `/api/history` | Historial de trabajos |
| `GET` | `/api/history/stats` | KPIs del dashboard |
| `GET` | `/api/users` | Usuarios (solo admin) |
| `POST` | `/api/users` | Crear usuario (solo admin) |
| `GET` | `/api/logs` | Logs del sistema |
| `GET` | `/api/health` | Estado del servidor |

## 🛠 Stack Tecnológico

- **Frontend:** HTML5 · CSS3 Vanilla · JavaScript ES6+
- **Backend:** Node.js · Express.js
- **Base de datos:** SQLite (sql.js — sin compilación nativa)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Uploads:** Multer (AI, EPS, PDF, SVG)

## 🌐 Deploy en Railway / Render / Heroku

```bash
# Variables de entorno requeridas:
PORT=3000
JWT_SECRET=tu_secreto_seguro_aqui
NODE_ENV=production
```

## 📋 Formatos Soportados

| Formato | Software | Uso |
|---------|----------|-----|
| `.ai`   | Adobe Illustrator | Diseños vectoriales |
| `.eps`  | Illustrator / CorelDRAW | Corte plotter |
| `.pdf`  | Universal | Impresión directa |
| `.svg`  | FlexiSIGN / VersaWorks | Vinilo de corte |

---
© 2026 Agua Shield · Barranquilla, Colombia
