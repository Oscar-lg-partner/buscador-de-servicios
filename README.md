# Buscador de servicios (LG)

Front estático (HTML + Bootstrap + JS) + backend en **Google Apps Script** (Sheet privado).

## Stack

- Front: HTML5, Bootstrap 5, Bootstrap Icons, JS
- Datos / login: Google Apps Script (JSONP → sin problemas de CORS en Vercel)
- Hosting front: Vercel

## CORS

No hace falta proxy en Vercel. El front habla con Apps Script por **JSONP** (`js/api.js`), así que el dominio `*.vercel.app` puede llamar al script sin CORS.

En Apps Script, la web app debe estar desplegada como:

- Ejecutar como: **tu cuenta**
- Quién tiene acceso: **Cualquiera** (el login sigue protegiendo los datos)

## Desarrollo local

```bash
# desde la raíz del proyecto
python -m http.server 5500
```

Abrir `http://127.0.0.1:5500/` → redirige al login.

## Deploy en Vercel

1. Importar el repo `Oscar-lg-partner/buscador-de-servicios`
2. Framework preset: **Other** (estático)
3. Root directory: `.` (raíz)
4. Build command: (vacío)
5. Output directory: `.` (o dejar por defecto para estático)

URL de Apps Script: `js/config.js` → `appsScriptUrl`.

## Estructura

```
index.html
js/                 # config, api (JSONP), auth, datos
css/
buscador-de-servicios/
  login/
  home/
  detalles/
apps-script/        # código .gs para copiar en Google (no corre en Vercel)
```

## Apps Script

Al cambiar `apps-script/*.gs`, copiar al proyecto de Google → **Implementar → Nueva versión**.
