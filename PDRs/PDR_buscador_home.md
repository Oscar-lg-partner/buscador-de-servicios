# PDR — Buscador (página home)

**Página:** `buscador-de-servicios/home/page_home.html`
**Scripts:** `home/js/lista_home.js` (datos + pintado), `home/js/buscador.js` (filtros), script inline de la página (eventos)
**Fecha de análisis:** 2026-10-13

---

## 1. Objetivo

Permitir a un usuario logueado buscar rápidamente un modelo LG en la lista de servicios (SearchDatabase cruzada con Ventas) y ver de un vistazo su servicio, precio, renovación, año, stock y si tiene CP. Desde cada tarjeta se entra al detalle del modelo.

---

## 2. Flujo de carga

1. **Sesión:** `exigirSesion()`. Si no hay token en `sessionStorage`, se redirige al login.
2. **Restaurar estado:** `restaurar_filtros_home()` recupera de `sessionStorage` (`flatfee_filtros_home`) el texto buscado, el filtro de stock y la posición de scroll. Así, al volver de detalles todo queda como estaba.
3. **Datos locales:** `cargarDatosEnMemoria()` lee IndexedDB (`FlatFeeDB`). **No llama al servidor**: los datos se descargaron en el login.
4. **Sin datos:** muestra *"No hay datos. Pulsa actualizar o vuelve a entrar."*
5. **Con datos:** pinta la lista y recoloca el scroll guardado.

---

## 3. Elementos de la pantalla

| Elemento | Id | Qué hace |
|---|---|---|
| Botón menú (☰) | `btn-menu` | **Cierra sesión** previa confirmación. Además borra los filtros guardados y los datos de IndexedDB. No es un menú. |
| Caja de búsqueda | `input-buscar` | Filtro de texto en vivo (en cada tecla). |
| Botón embudo | `btn-abrir-filtros` | Abre el panel lateral de filtros (offcanvas). |
| Botón actualizar (⟳) | `btn-refresh` | Vuelve a descargar todo del Sheet (`sendAllData`), reemplaza IndexedDB y repinta. Mientras tanto muestra *"Actualizando desde el Sheet..."*. |
| Chips | `chips-filtros` | Muestra el filtro de stock activo con una ✕ para quitarlo. |
| Lista | `lista-buscador` | Cabecera "Modelos" con contador y una tarjeta por fila. |
| Barra inferior | — | Un único enlace, "Buscador" (decorativo). |

---

## 4. Filtros

Los filtros activos se combinan con **AND** (`aplicar_filtros` en `buscador.js`). Cualquier cambio repinta la lista, vuelve arriba y guarda el estado en `sessionStorage`.

### 4.1 Texto (caja "Buscar modelo...")

*(Actualizado 2026-10-16: búsqueda ampliada.)*

- Búsqueda por **"contiene"**. No distingue mayúsculas ni tildes, e ignora puntos, espacios y € (`1.099 €` = `1099`; `garantia` = `Garantía`). Busca en los **valores**, no en las etiquetas: `2021` encuentra el año, pero `año` no.
- **Varias palabras = todas deben aparecer** (`OLED 2023`).
- Busca **solo en lo que se ve en la tarjeta**, tooltips incluidos (`campo_texto_busqueda` en `lista_home.js`):
  - `Modelo (Tech. Name)` completo, con el sufijo tras el punto.
  - `Model` (Ventas).
  - `Resumen 2` (servicio).
  - El precio mostrado (`Precio` o `Precio de coste 2`, según `Modelo Renove`).
  - Renovaciones, o "Sin renovación".
  - Año.
  - Stock, solo si > 5 (cuando se ve el icono).
  - "CP", si tiene el icono CP.
  - `Precios`, si se ve el icono 🏷.
- **No** busca en columnas que no se ven, como `Referencia n 2` o `Modelo Renove`.
- Repinta 200 ms después de dejar de escribir; la bolsa se calcula una vez por carga de datos.
- No genera chip.

### 4.2 Stock Estado (panel de filtros)

- Dos casillas, **Con Stock** y **Sin Stock**, que funcionan como opción única: marcar una desmarca la otra. Ninguna marcada significa sin filtro.
- Regla: **con stock = columna `Stock` > 5** (número; admite coma decimal y espacios). Un stock vacío, no numérico o ≤ 5 cuenta como "sin stock".
- El filtro se aplica **al momento** al marcar la casilla; no hace falta pulsar DONE.
- Genera el chip *"Stock Estado: Con Stock"* o *"Stock Estado: Sin Stock"*; la ✕ lo quita.

### 4.3 Renovación (panel de filtros) — *añadido 2026-10-16*

- **Con renovación:** tarjetas que muestran "Renovación: N" (`Modelo Renove` vacía y `Renovaciones` con valor). Un desplegable **Nº de renovación** permite elegir **Todas** o un número concreto. Solo se activa con "Con renovación" marcado, y los números se sacan de los datos cargados.
- **Sin renovación:** tarjetas que muestran "Sin renovación" (`Modelo Renove` con valor).
- Las tarjetas con `Modelo Renove` vacía y `Renovaciones` vacía no muestran texto de renovación, así que no entran en ninguna de las dos opciones.
- Chip: *"Renovación: Con renovación"*, *"Renovación: N"* o *"Renovación: Sin renovación"*.

### 4.4 CP (panel de filtros) — *añadido 2026-10-16*

- **Con Código Postal:** tarjetas con el icono 📍 CP (`Referencia n 2` coincide con un SKU de *CP Tarifas*).
- **Sin Código Postal:** el resto.
- Chip: *"CP: Con Código Postal"* o *"CP: Sin Código Postal"*.

En los tres filtros del panel, Con y Sin son excluyentes, el cambio se aplica al momento y cada chip tiene su ✕. Todos se guardan al ir a detalles y volver.

### 4.5 Botones del panel

| Botón | En la vista principal ("Filter") | Dentro de un filtro |
|---|---|---|
| **CLEAR** | Borra **texto y todos los filtros** | Borra solo ese filtro |
| **DONE** | Aplica y cierra el panel | Aplica, vuelve a la vista principal y cierra el panel |

---

## 5. Tarjeta de modelo (qué se pinta)

Cada **fila** de SearchDatabase es una tarjeta, así que un mismo Tech Name puede salir varias veces (una por servicio). El contador "Modelos" cuenta tarjetas filtradas, no modelos únicos.

| Posición | Contenido | Regla |
|---|---|---|
| Fila 1, izquierda | Tech Name | Se corta en el primer punto (`F4J7TY1W.ABWQPES` → `F4J7TY1W`). |
| Fila 1, derecha | Renovación | `Modelo Renove` con valor → *"Sin renovación"*. Vacío → *"Renovación: {Renovaciones}"*. |
| Fila 2, izquierda | `Model` (Ventas) | Vacío si no hubo cruce. |
| Fila 2, derecha | *"Año: {Año}"* | Lee `Año` y, si falta, `Ano`. |
| Fila 3, izquierda | `Resumen 2` (servicio) + precio | **Precio:** si `Modelo Renove` tiene valor ≠ `"1"`, se usa la columna `Precio`; si no, `Precio de coste 2`. Se muestra **sin formato €**, tal cual viene del Sheet. |
| Fila 3, derecha | Iconos con tooltip | 📦 **Stock**: solo si Stock > 5, con el tooltip "Stock: N". 📍 **CP**: si `Referencia n 2` coincide **exacto** con algún SKU de la hoja *CP Tarifas* (las celdas con varios SKU se separan por comas). 🏷 **Precio**: columna `Precios` (precio de 1 año de garantía), oculto si `Modelo Renove` tiene valor. |

**Clic en la tarjeta** → guarda los filtros y abre `page_detalles.html?modelo={Tech Name completo}&pos={n}`. `pos` es el índice de esa fila dentro de su Tech Name, y detalles lo usa para abrir la misma fila y navegar con anterior/siguiente.

---

## 6. Observaciones del análisis

Detectadas al leer el código. No se ha cambiado nada.

1. **Reglas de `Modelo Renove` distintas según el dato.** "Sin renovación" y ocultar el icono 🏷 se activan con *cualquier* valor (incluido `"1"`), mientras que el cambio de precio exige un valor ≠ `"1"`. Con `Modelo Renove = "1"`, la tarjeta dice "Sin renovación" pero muestra `Precio de coste 2`. Conviene confirmar si es lo deseado.
2. **Precio sin formato en home.** Detalles formatea los precios como `1.667 €`, pero home no.
3. **Rendimiento.** En cada tecla se reconstruye toda la "bolsa" (incluido el mapa de SKUs de CP) y se repinta la lista entera con `innerHTML`, sin *debounce* ni paginación. Con muchos registros puede ir lento en móvil.
4. **El texto se compara ya escapado.** Un `&` en el modelo se guarda como `&amp;`, así que buscar "&" no coincidiría. Es poco probable en códigos de modelo.
5. **La lógica de stock está duplicada**: `tiene_stock` en `lista_home.js` y `tiene_stock_filtro_` en `buscador.js` aplican la misma regla (> 5). Si la regla cambia, hay que tocar ambas.
6. **Textos mezclados en inglés y español**: "Filter", "CLEAR", "DONE" frente a "Stock Estado", "Con Stock"...
7. **El botón ☰ cierra sesión.** Por el icono, el usuario puede esperar un menú.
8. **El texto buscado no tiene chip.** Solo el filtro de stock aparece como chip.

---

## 7. Fuera de alcance / posibles mejoras

- Más filtros: CP sí/no, con/sin renovación, año, servicio (`Resumen 2`).
- Agrupar las tarjetas por Tech Name en lugar de una tarjeta por fila.
- *Debounce* en la búsqueda y paginación o renderizado incremental.
- Unificar el formato de precio con detalles.
