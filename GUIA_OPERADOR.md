# 🛰️ Guía de Conexión — Estación Barranquilla (Aqua Shield OPS)

Este manual contiene los pasos necesarios para configurar el PC que será controlado remotamente desde la central de Aqua Shield. El sistema consta de dos partes: la **transmisión de pantalla** (vía navegador) y el **puente de control** (vía Agente Node.js).

---

## 🛠️ 1. Requisitos Previos (Solo la primera vez)

Es indispensable tener instalado **Node.js** para que el Administrador pueda mover el mouse y usar el teclado de esta estación.

1.  **Descargar Node.js:** [https://nodejs.org/](https://nodejs.org/) (Elige la versión **LTS**).
2.  **Preparar la carpeta:**
    *   Crea una carpeta llamada `AquaShield_Control`.
    *   Copia el archivo `agente_remoto.js` dentro de esa carpeta.
3.  **Instalar dependencias:**
    *   Abre una terminal (CMD o PowerShell) dentro de esa carpeta.
    *   Escribe y presiona Enter:
        ```bash
        npm install socket.io-client robotjs
        ```

---

## 🚀 2. Cómo Activar el Acceso Remoto

Para permitir que el Administrador vea y opere este equipo, sigue estos dos pasos:

### Paso A: Activar la Señal de Video (Navegador)
1.  Abre **Chrome** o **Edge** y entra a: `https://aquashield-ops.onrender.com`
2.  Inicia sesión (Usuario: `operador_baq` / Clave: `baq2024`).
3.  Ve al menú **"Remoto"** y haz clic en el botón verde: **"🚀 ACTIVAR SEÑAL REMOTA"**.
4.  Selecciona **"Toda la pantalla"** y haz clic en Compartir.
5.  Mantén esa pestaña abierta.

### Paso B: Activar el Puente de Control (Agente)
1.  Abre la carpeta `AquaShield_Control`.
2.  Abre una terminal y ejecuta:
    ```bash
    node agente_remoto.js
    ```
3.  Cuando veas el mensaje `✅ Conectado`, el Administrador ya podrá operar desde el Dashboard.

---

## ⚠️ AVISO IMPORTANTE

*   **No cierres la terminal negra** (agente) ni la pestaña del navegador mientras el Administrador esté trabajando.
*   Si la conexión se pierde, cierra la terminal, ábrela de nuevo y repite el Paso B.
*   Para mayor seguridad, cuando el trabajo termine, puedes cerrar la terminal y el navegador para cortar el acceso por completo.

---
*Aqua Shield OPS v2.3.0 — Sistema de Control Operativo*
