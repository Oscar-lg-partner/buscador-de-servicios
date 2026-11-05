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

`apps-script/Conexion.gs` `doGet` dispatches on `action`: `Login`, `sendAllData` or `upgradeTool`, and wraps the JSON in the callback.

### Auth and data flow
1. `index.html` redirects to `buscador-de-servicios/login/page_login.html`.
2. `Login.gs` validates against the `users` sheet (col A user, col B pass) and stores a UUID token in `CacheService` for 6 h. Front stores token/user in `sessionStorage` (`js/auth.js`).
3. After login, `js/datos.js` `traerYGuardarDatos()` calls `sendAllData` once and caches the whole dataset (`items` + `cpTarifas`) in IndexedDB (`FlatFeeDB` / store `datos` / key `all`) plus in-memory globals. Pages call `cargarDatosEnMemoria()` then read synchronously via `leerDatos()` / `leerCpTarifas()`. The "Actualizar" button refetches; logout clears everything. A backend error mentioning "sesión" forces logout.

### Backend data join (`sendAllData.gs`)
Each item = one `SearchDatabase` row merged with at most one `Ventas lg rangos` row, matched by `Modelo (Tech. Name)` ↔ `Model`: exact match first, otherwise `Model` values starting with `tech + "."`; among candidates pick the oldest `Año`. Unmatched rows get empty Ventas columns; Ventas-only rows are dropped. `cpTarifas` comes from sheet `CP Tarifas` (fallback `CP Tarifasuser`). Items are keyed by raw sheet column headers (e.g. `"Modelo (Tech. Name)"`, `"Precio de coste 2"`, `"Modelo Renove"`), so renaming a sheet column breaks the front.

### Pages
Each page under `buscador-de-servicios/<page>/` loads the shared scripts in order `config.js → api.js → auth.js → datos.js` (login stops there; home and detalles also load `formato.js`, whose `formato_precio_euros` is the single euro formatter) (all globals, no modules), then its own JS, then an inline `<script>` with page wiring. Routes are relative paths in `APP_CONFIG.routes`. No Bootstrap CSS/JS anymore — only Bootstrap Icons, IBM Plex Sans (Google Fonts) and `css/main.css` (design tokens on `:root`).

- **home**: `lista_home.js` builds a "bolsa" of display-ready items and renders one `.fila` per item; the same markup is a table row on ≥900px and a card below (CSS grid areas). `buscador.js` applies AND filters: text (every typed word must appear in the item's `texto_busqueda`, built by `campo_texto_busqueda` from only the values visible on the card and normalized by `normalizar_busqueda`; matches are highlighted by `resaltar`), stock (`Stock > 5`), renovación (con + optional nº / sin) and CP. Filters are always-visible radio segments; state persists in `sessionStorage` (`flatfee_filtros_home`). The bolsa is cached in `datos_necesarios()` until `leerDatos()` returns a new array.
  - ≥1200px: clicking/arrowing a row opens the ficha in the right panel (home also loads `../detalles/js/lista_detalles.js`). Narrower: navigates to `page_detalles.html?modelo=<tech>&pos=<n>`.
- **detalles**: `lista_detalles.js` → `crear_bolsa_detalle(tech)` + `pintar_detalle(bolsa, pos, caja)` render the ficha (answer block with servicio/precio/stock/renovación, then the remaining fields); `activar_ficha_det(caja, onNav)` wires prev/next and copy buttons. Shared by the detalles page and the home panel.
- **upgrade**: the "Servicio Upgrade" button in the home filter bar opens `upgrade/page_upgrade.html` in a new tab (`window.open` without noopener, so `sessionStorage`/token is copied). It calls action `upgradeTool` (`apps-script/upgradeTool.gs`) on every load (not cached in IndexedDB), which reads sheet `Upgrade tool` **by column position** with `getDisplayValues()`: A, J, K, M are shown, F is the group (QNED, OLED…) and splits the data into one table per group.
- **Product constraint**: never remove a data field from cards/ficha unless the user asks (Gama, Rango Prefijo and Años transcurridos were removed on request); reordering is fine. Stock in the Sheet refreshes daily at 06:00 (the "Datos de…" badge turns amber when the download predates it).

### Field-function pattern (lista_home.js / lista_detalles.js)
Both files follow the same structure, documented in their headers: (1) one `campo_*` / `campo_det_*` function per displayed field that reads the raw row, applies business rules, formats and HTML-escapes; (2) a "bolsa" loop that builds plain objects by calling those functions; (3) HTML rendering that only prints already-clean values; (4) helpers. When adding or changing a displayed field, add/modify a `campo_*` function and the bolsa entry rather than putting logic in the HTML step.

Key business rule: **`Modelo Renove`** drives what is shown. Filled and ≠ `"1"` → plan renove: show `Precio` (SearchDatabase), Modelo Renove; hide SKU, Precio OPP (`Precio de coste 2`). Empty or `"1"` → show SKU and `Precio de coste 2`. Filled at all → hide SKU Garantía, garantía price, Año, Renovaciones. CP matching (badge, "Con CP" filter, postal-code search) compares the SKU before the dot (`RXMUKMN.AO5051WA` → `RXMUKMN`), since CP Tarifas lists SKUs without suffix. Display labels differ from sheet headers: `Período ofrecimiento (años)` → "Año fin de ofrecimiento", `Año` → "Año venta producto". Column lookups tolerate header variants (`leer_modelo_renove*`, `valor_escapado(fila, [alt names])`). Prices are formatted as Spanish euros (`1.667 €`).
