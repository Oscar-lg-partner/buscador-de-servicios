# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

LG service/warranty search tool ("Buscador de servicios"). Static front end (plain HTML + Bootstrap 5 from CDN + vanilla JS, no build step, no package.json, no tests) hosted on Vercel, with a Google Apps Script backend reading a private Google Sheet. Code, comments and UI are in Spanish.

## Commands

```bash
# Local dev server (from repo root), then open http://127.0.0.1:5500/
python -m http.server 5500
```

There is no build, lint or test tooling. Vercel deploys the repo root as-is (`vercel.json` only sets headers and the `/` rewrite).

Files under `apps-script/*.gs` do **not** run anywhere from this repo: after changing them, they must be copied manually into the Google Apps Script project and redeployed (**Implementar → Nueva versión**). The web app must be deployed as "execute as owner / access: anyone". The deployed URL lives in `js/config.js` (`APP_CONFIG.appsScriptUrl`) and is mirrored in `apps-script-url.txt`.

## Architecture

### Front ↔ backend: JSONP, not fetch
`js/api.js` `apiCall(payload)` injects a `<script>` tag to the Apps Script `/exec` URL with a random `callback` param (avoids CORS on `*.vercel.app`). It retries up to 3 times (Chrome QUIC errors) with a 180 s timeout. Everything is a GET with query params, including the login password.

`apps-script/Conexion.gs` `doGet` dispatches on `action`: `Login` or `sendAllData`, and wraps the JSON in the callback.

### Auth and data flow
1. `index.html` redirects to `buscador-de-servicios/login/page_login.html`.
2. `Login.gs` validates against the `users` sheet (col A user, col B pass) and stores a UUID token in `CacheService` for 6 h. Front stores token/user in `sessionStorage` (`js/auth.js`).
3. After login, `js/datos.js` `traerYGuardarDatos()` calls `sendAllData` once and caches the whole dataset (`items` + `cpTarifas`) in IndexedDB (`FlatFeeDB` / store `datos` / key `all`) plus in-memory globals. Pages call `cargarDatosEnMemoria()` then read synchronously via `leerDatos()` / `leerCpTarifas()`. The "Actualizar" button refetches; logout clears everything. A backend error mentioning "sesión" forces logout.

### Backend data join (`sendAllData.gs`)
Each item = one `SearchDatabase` row merged with at most one `Ventas lg rangos` row, matched by `Modelo (Tech. Name)` ↔ `Model`: exact match first, otherwise `Model` values starting with `tech + "."`; among candidates pick the oldest `Año`. Unmatched rows get empty Ventas columns; Ventas-only rows are dropped. `cpTarifas` comes from sheet `CP Tarifas` (fallback `CP Tarifasuser`). Items are keyed by raw sheet column headers (e.g. `"Modelo (Tech. Name)"`, `"Precio de coste 2"`, `"Modelo Renove"`), so renaming a sheet column breaks the front.

### Pages
Each page under `buscador-de-servicios/<page>/` loads the shared scripts in order `config.js → api.js → auth.js → datos.js` (all globals, no modules), then its own JS, then an inline `<script>` with page wiring. Routes are relative paths in `APP_CONFIG.routes`.

- **home**: list grouped by `Modelo (Tech. Name)`. `lista_home.js` builds a "bolsa" of display-ready items; `buscador.js` applies AND filters (text: every typed word must appear in the item's `texto_busqueda`, built by `campo_texto_busqueda` from only the values visible on the card and normalized by `normalizar_busqueda`; stock where "con stock" = `Stock > 5`). The bolsa is cached in `datos_necesarios()` until `leerDatos()` returns a new array and persists filters + scroll in `sessionStorage` (`flatfee_filtros_home`) so returning from detalles restores state. Clicking navigates to `page_detalles.html?modelo=<tech>`.
- **detalles**: `lista_detalles.js` shows all rows for one tech name.

### Field-function pattern (lista_home.js / lista_detalles.js)
Both files follow the same structure, documented in their headers: (1) one `campo_*` / `campo_det_*` function per displayed field that reads the raw row, applies business rules, formats and HTML-escapes; (2) a "bolsa" loop that builds plain objects by calling those functions; (3) HTML rendering that only prints already-clean values; (4) helpers. When adding or changing a displayed field, add/modify a `campo_*` function and the bolsa entry rather than putting logic in the HTML step.

Key business rule: **`Modelo Renove`** drives what is shown. Filled and ≠ `"1"` → plan renove: show `Precio` (SearchDatabase), Modelo Renove; hide SKU, Precio OPP (`Precio de coste 2`). Empty or `"1"` → show SKU and `Precio de coste 2`. Filled at all → hide `Rango Prefijo`. Column lookups tolerate header variants (`leer_modelo_renove*`, `valor_escapado(fila, [alt names])`). Prices are formatted as Spanish euros (`1.667 €`).
