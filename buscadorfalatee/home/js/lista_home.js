/**
 * LISTA HOME
 *
 * Estructura (siempre igual si añades un dato nuevo):
 *  1) Campos: una función por dato (valida + texto + escapar)
 *  2) Bolsa: for que llama a cada campo y hace push
 *  3) HTML: solo pinta lo que ya viene limpio
 *  4) Ayudas: texto, escapar, etc.
 */
/* =========================================================
 * 1) BOLSA — junta todos los campos de cada fila
 * ========================================================= */

function crear_bolsa_datos() {
  var filas = leerDatos();
  var skusCp = mapa_skus_cp();
  var data = [];
  var i;
  var fila;
  var techKey;
  var contadores = {};

  for (i = 0; i < filas.length; i++) {
    fila = filas[i];
    techKey = texto(fila["Modelo (Tech. Name)"]);

    if (!contadores[techKey]) {
      contadores[techKey] = 0;
    }

    data.push({
      tech_key: techKey,
      pos_en_modelo: contadores[techKey],
      Modelo_Tech_Name: campo_Modelo_Tech_Name(fila),
      modelo: campo_modelo(fila),
      resumen2: campo_resumen2(fila),
      precio_lista: campo_precio_lista(fila),
      con_renove: campo_con_renove(fila),
      renovacion: campo_renovacion(fila),
      anio: campo_anio(fila),
      stock: campo_stock(fila),
      stock_raw: texto(fila["Stock"]),
      con_stock: campo_con_stock(fila),
      cp: campo_cp(fila, skusCp),
      precios: campo_precios(fila),
    });

    contadores[techKey] = contadores[techKey] + 1;
  }

  return {
    items: data,
    total_datos: data.length,
  };
}
/* =========================================================
 * 2) CAMPOS — cada uno deja el valor listo para pintar
 * ========================================================= */

function campo_Modelo_Tech_Name(fila) {
  var valor = fila["Modelo (Tech. Name)"];
  if (valor === null || valor === undefined || valor === "") return "";
  return escapar(texto(valor));
}

function campo_modelo(fila) {
  var valor = fila["Model"];
  if (valor === null || valor === undefined || valor === "") return "";
  return escapar(texto(valor));
}

function campo_resumen2(fila) {
  var valor = fila["Resumen 2"];
  if (valor === null || valor === undefined || valor === "") return "";
  return escapar(texto(valor));
}

function campo_precio2(fila) {
  var valor = fila["Precio de coste 2"];
  if (valor === null || valor === undefined || valor === "") return "";
  return escapar(texto(valor));
}

/**
 * Renove con valor ≠ "1" → columna Precio (SearchDatabase)
 * Renove vacía o "1" → Precio de coste 2 (precio2)
 */
function campo_precio_lista(fila) {
  if (campo_mostrar_precio_search(fila)) {
    var valor = fila["Precio"];
    if (valor === null || valor === undefined || valor === "") return "";
    return escapar(texto(valor));
  }
  return campo_precio2(fila);
}

/** Igual que en detalles: Renove llena y distinta de "1" */
function campo_mostrar_precio_search(fila) {
  var renove = texto(leer_modelo_renove_home(fila));
  return renove !== "" && renove !== "1";
}

/** true si Modelo Renove está LLENA */
function campo_con_renove(fila) {
  return texto(leer_modelo_renove_home(fila)) !== "";
}

/** Lee Modelo Renove aunque el nombre de columna varíe un poco */
function leer_modelo_renove_home(fila) {
  if (!fila) return "";
  if (fila["Modelo Renove"] !== undefined && fila["Modelo Renove"] !== null) {
    return fila["Modelo Renove"];
  }
  var k;
  for (k in fila) {
    if (!Object.prototype.hasOwnProperty.call(fila, k)) continue;
    if (String(k).replace(/\s+/g, " ").trim().toLowerCase() === "modelo renove") {
      return fila[k];
    }
  }
  return "";
}

/**
 * Texto de renovación listo para pintar en home.
 * Modelo Renove LLENA → "Sin renovación"
 * Modelo Renove VACÍA → número (el HTML pone "Renovación: ")
 */
function campo_renovacion(fila) {
  if (campo_con_renove(fila)) return "Sin renovación";
  var valor = fila["Renovaciones"];
  if (valor === null || valor === undefined || valor === "") return "";
  return escapar(texto(valor));
}

/** Año debajo de renovación — siempre se muestra si hay valor */
function campo_anio(fila) {
  var valor = fila["Año"];
  if (valor === null || valor === undefined || valor === "") {
    valor = fila["Ano"];
  }
  if (valor === null || valor === undefined || valor === "") return "";
  return escapar(texto(valor));
}

function campo_stock(fila) {
  var valor = fila["Stock"];
  if (valor === null || valor === undefined || valor === "") return "";
  return escapar(texto(valor));
}

/**
 * CP:SI si Referencia n 2 coincide EXACTO con un SKU de CP Tarifas.
 * "RFBFRX01" sí; "RFBFRX01.AO05EW01" no (salvo que esté así en CP).
 */
function campo_cp(fila, skusCp) {
  var ref = texto(fila["Referencia n 2"]);
  if (!ref) return "";
  if (skusCp && skusCp[ref]) return escapar("SI");
  return "";
}

function campo_precios(fila) {
  /* Modelo Renove LLENA → no mostrar Precio 1 año de garantía (P:) */
  if (campo_con_renove(fila)) return "";
  var valor = fila["Precios"];
  if (valor === null || valor === undefined || valor === "") return "";
  return escapar(texto(valor));
}

/** Para el filtro (no se pinta; no lleva escapar) */
function campo_con_stock(fila) {
  return tiene_stock(fila["Stock"]);
}

function tiene_stock(valor) {
  if (valor === null || valor === undefined || valor === "") return false;
  var n = Number(String(valor).replace(/\s/g, "").replace(",", "."));
  /* Con stock solo si Stock > 5 */
  return !isNaN(n) && n > 5;
}

///////SOLO PARA BUSCADOR/////////////////
/* Alias: el buscador / home ya llaman datos_necesarios() */
function datos_necesarios() {
  return crear_bolsa_datos();
}

/* =========================================================
 * 3) HTML — solo pinta (sin validar)
 * ========================================================= */

function listar_datos_home() {
  var caja = document.getElementById("lista-buscador");
  if (!caja) return;

  /* Bolsa completa → filtros (texto + stock) → pintar */
  var base = datos_necesarios();
  var itemsFiltrados =
    typeof aplicar_filtros === "function"
      ? aplicar_filtros(base.items)
      : base.items;

  var bolsa = {
    items: itemsFiltrados,
    total_datos: itemsFiltrados.length,
  };

  var html = "";
  var i;
  var item;

  if (!bolsa.total_datos) {
    caja.innerHTML =
      '<p class="text-center text-muted py-4 mb-0">No hay modelos para mostrar.</p>';
    return;
  }

  html +=
    '<div class="grupo-header">' +
    '<span class="grupo-nombre">Modelos</span>' +
    '<span class="grupo-badge">' +
    bolsa.total_datos +
    "</span></div>";

  for (i = 0; i < bolsa.total_datos; i++) {
    item = bolsa.items[i];
    if (!item.Modelo_Tech_Name) continue;

    html +=
      '<article class="item-modelo" data-tech="' +
      escapar(item.tech_key) +
      '" data-pos="' +
      item.pos_en_modelo +
      '">' +
      '<div class="item-fila">' +
      '<div class="item-modelo-nombre">' +
      texto_antes_punto(item.Modelo_Tech_Name) +
      "</div>" +
      '<div class="item-renovacion">' +
      (item.con_renove
        ? item.renovacion || "Sin renovación"
        : item.renovacion
          ? "Renovación: " + item.renovacion
          : "") +
      "</div>" +
      "</div>" +
      '<div class="item-fila item-fila-modelo">' +
      '<div class="item-modelo-ventas">' +
      item.modelo +
      "</div>" +
      '<div class="item-anio">' +
      (item.anio ? "Año: " + item.anio : "") +
      "</div>" +
      "</div>" +
      '<div class="item-fila item-fila-resumen">' +
      '<div class="item-resumen-precio">' +
      '<span class="item-resumen">' +
      item.resumen2 +
      "</span>" +
      '<span class="item-precio">' +
      item.precio_lista +
      "</span>" +
      "</div>" +
      '<div class="item-meta-derecha">' +
      (item.stock
        ? '<span class="item-meta-icon item-stock" title="Stock: ' +
          item.stock +
          '" data-tip="Stock: ' +
          item.stock +
          '"><i class="bi bi-box-seam" aria-hidden="true"></i></span>'
        : "") +
      (item.cp
        ? '<span class="item-meta-icon item-cp" title="CP: ' +
          item.cp +
          '" data-tip="CP: ' +
          item.cp +
          '"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i></span>'
        : "") +
      (item.precios
        ? '<span class="item-meta-icon item-precios" title="Precio: ' +
          item.precios +
          '" data-tip="Precio: ' +
          item.precios +
          '"><i class="bi bi-tag-fill" aria-hidden="true"></i></span>'
        : "") +
      "</div>" +
      "</div>" +
      "</article>";
  }

  caja.innerHTML = html;
}

/* =========================================================
 * 4) AYUDAS
 * ========================================================= */

function texto(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

/** Para pintar en home: F4J7TY1W.ABWQPES → F4J7TY1W */
function texto_antes_punto(t) {
  var s = String(t || "");
  var i = s.indexOf(".");
  if (i === -1) return s;
  return s.substring(0, i);
}

function escapar(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Mapa { "RFBFRX01": true, ... } desde CP Tarifas.
 * Parte cada celda SKU por comas; solo coincidencia exacta después.
 */
function mapa_skus_cp() {
  var filas = typeof leerCpTarifas === "function" ? leerCpTarifas() : [];
  var mapa = {};
  var i;
  var skuCelda;
  var partes;
  var p;
  var codigo;

  for (i = 0; i < filas.length; i++) {
    skuCelda = texto(filas[i]["SKU"]);
    if (!skuCelda) continue;
    partes = skuCelda.split(",");
    for (p = 0; p < partes.length; p++) {
      codigo = texto(partes[p]);
      if (codigo) mapa[codigo] = true;
    }
  }

  return mapa;
}
