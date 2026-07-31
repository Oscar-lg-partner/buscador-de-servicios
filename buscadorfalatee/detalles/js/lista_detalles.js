/**
 * LISTA DETALLES
 *
 * Misma arquitectura que lista_home:
 *  1) Campos
 *  2) Bolsa (solo filas de un Modelo_Tech_Name)
 *  3) HTML
 *  4) Ayudas
 */

/* =========================================================
 * 1) BOLSA — filas de UN modelo (ya concatenadas)
 * ========================================================= */

function crear_bolsa_detalle(techKey) {
  var filas = leerDatos();
  var data = [];
  var i;
  var fila;
  var keyBuscada = texto_det(techKey);

  for (i = 0; i < filas.length; i++) {
    fila = filas[i];
    if (texto_det(fila["Modelo (Tech. Name)"]) !== keyBuscada) continue;

    data.push({
      modelo: campo_det_modelo(fila),
      producto: campo_det_producto(fila),
      pvp: campo_det_pvp(fila),
      modelo_renove: campo_det_modelo_renove(fila),
      sku: campo_det_sku(fila),
      servicio: campo_det_servicio(fila),
      precio_opp: campo_det_precio_opp(fila),
      precio: campo_det_precio(fila),
      periodo: campo_det_periodo(fila),
      stock_estado: campo_det_stock_estado(fila),
      rango_prefijo: campo_det_rango_prefijo(fila),
      con_renove: campo_det_con_renove(fila),
      sku_garantia: campo_det_sku_garantia(fila),
      precio_garantia: campo_det_precio_garantia(fila),
      anio: campo_det_anio(fila),
      anios_transcurridos: campo_det_anios_transcurridos(fila),
      renovaciones: campo_det_renovaciones(fila),
      gama: campo_det_gama(fila),
    });
  }

  return {
    items: data,
    total_datos: data.length,
  };
}

/* =========================================================
 * 2) CAMPOS — cada uno deja el valor listo para pintar
 * ========================================================= */

function campo_det_modelo(fila) {
  return valor_escapado(fila, ["Modelo (Tech. Name)"]);
}

function campo_det_producto(fila) {
  return valor_escapado(fila, ["Modelo (Pet Name)"]);
}

/**
 * PVP solo si Modelo Renove tiene valor y es distinto de "1".
 * Formato: 1.667 €
 */
function campo_det_pvp(fila) {
  if (!campo_det_mostrar_pvp(fila)) return "";
  return formato_precio_euros_det(fila["PVP"]);
}

function campo_det_mostrar_pvp(fila) {
  var renove = texto_det(leer_modelo_renove(fila));
  return renove !== "" && renove !== "1";
}

/** Modelo Renove: solo si tiene valor y es distinto de "1" */
function campo_det_modelo_renove(fila) {
  if (!campo_det_mostrar_pvp(fila)) return "";
  return escapar_det(texto_det(leer_modelo_renove(fila)));
}

function campo_det_sku(fila) {
  /* Si Modelo Renove tiene valor ≠ 1 → no mostrar SKU */
  if (campo_det_mostrar_pvp(fila)) return "";
  return valor_escapado(fila, ["Referencia n 2", "SKU"]);
}

function campo_det_servicio(fila) {
  return valor_escapado(fila, ["Resumen 2", "Servicio"]);
}

function campo_det_precio_opp(fila) {
  /* Si Modelo Renove tiene valor ≠ 1 → no mostrar Precio OPP */
  if (campo_det_mostrar_pvp(fila)) return "";
  return formato_precio_euros_det(fila["Precio de coste 2"]);
}

/** Precio (SearchDatabase): solo si Modelo Renove tiene valor ≠ 1. Formato: 1.099 € */
function campo_det_precio(fila) {
  if (!campo_det_mostrar_pvp(fila)) return "";
  return formato_precio_euros_det(fila["Precio"]);
}

function campo_det_periodo(fila) {
  return valor_escapado(fila, [
    "Período ofrecimiento (años)",
    "Periodo ofrecimiento (años)",
  ]);
}

function campo_det_stock_estado(fila) {
  if (tiene_stock_det(fila["Stock"])) {
    return escapar_det("Con Stock");
  }
  return escapar_det("Sin Stock");
}

function campo_det_rango_prefijo(fila) {
  /* Si Modelo Renove está LLENA → no mostrar Rango Prefijo */
  if (campo_det_con_renove(fila)) return "";
  return valor_escapado(fila, ["Rango Prefijo"]);
}

/** true si Modelo Renove está LLENA */
function campo_det_con_renove(fila) {
  return texto_det(leer_modelo_renove(fila)) !== "";
}

/** Lee Modelo Renove aunque el nombre de columna varíe un poco */
function leer_modelo_renove(fila) {
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

/* Si Modelo Renove está LLENA → no devolver estos campos */
function campo_det_sku_garantia(fila) {
  if (campo_det_con_renove(fila)) return "";
  return valor_escapado(fila, ["SKU Garantía", "SKU Garantia"]);
}

function campo_det_precio_garantia(fila) {
  if (campo_det_con_renove(fila)) return "";
  return valor_escapado(fila, ["Precios"]);
}

function campo_det_anio(fila) {
  if (campo_det_con_renove(fila)) return "";
  return valor_escapado(fila, ["Año", "Ano"]);
}

function campo_det_anios_transcurridos(fila) {
  if (campo_det_con_renove(fila)) return "";
  return valor_escapado(fila, ["Años transcurridos", "Anos transcurridos"]);
}

function campo_det_renovaciones(fila) {
  if (campo_det_con_renove(fila)) return "";
  return valor_escapado(fila, ["Renovaciones"]);
}

function campo_det_gama(fila) {
  return valor_escapado(fila, ["Gama"]);
}

/* =========================================================
 * 3) HTML — solo pinta campos con valor (nada en blanco)
 * ========================================================= */

function pintar_detalle(bolsa, pos) {
  var caja = document.getElementById("caja-detalle");
  if (!caja) return;

  if (!bolsa.total_datos) {
    caja.innerHTML =
      '<p class="text-center text-muted py-4">No hay detalle para este modelo.</p>';
    return;
  }

  if (pos < 0) pos = 0;
  if (pos >= bolsa.total_datos) pos = bolsa.total_datos - 1;

  var item = bolsa.items[pos];
  var html = "";

  html += bloque_det("Modelo", item.modelo);
  html += bloque_det("Producto", item.producto);
  /* PVP + Modelo Renove: solo si Renove tiene valor ≠ 1 */
  html += bloque_det("PVP", item.pvp);
  html += bloque_det("Modelo Renove", item.modelo_renove);
  html += bloque_det("SKU", item.sku);
  html += bloque_det("Servicio", item.servicio);
  /* Renove ≠ 1 → Precio (SearchDatabase); si no → Precio OPP */
  html += bloque_det("Precio OPP/Tarifa Plana Tranquilidad", item.precio_opp);
  html += bloque_det("Precio", item.precio);
  html += bloque_det("Período ofrecimiento (años)", item.periodo);
  html += bloque_det("Stock Estado", item.stock_estado);
  /* Rango Prefijo solo si Renove VACÍA (el campo ya viene vacío si está llena) */
  html += bloque_det("Rango Prefijo", item.rango_prefijo);

  /* Modelo Renove VACÍA → sí mostrar garantía/renovación (si tienen valor) */
  if (!item.con_renove) {
    html += bloque_det("SKU Garantía", item.sku_garantia);
    html += bloque_det("Precio 1 año de garantía renovable", item.precio_garantia);
    html += bloque_det("Año", item.anio);
    html += bloque_det("Años transcurridos", item.anios_transcurridos);
    html += bloque_det("Renovaciones", item.renovaciones);
  }

  html += bloque_det("Gama", item.gama);
  caja.innerHTML = html;
}

/** Si no hay valor, no se pinta el bloque (evita labels en blanco) */
function bloque_det(label, valor) {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return "";
  }
  return (
    '<div class="detalle-campo">' +
    '<div class="detalle-label">' +
    label +
    "</div>" +
    '<div class="detalle-valor">' +
    valor +
    "</div>" +
    "</div>"
  );
}

/* =========================================================
 * 4) AYUDAS
 * ========================================================= */

function texto_det(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

/** Entero redondeado + miles con punto + " €" → 1.099 € */
function formato_precio_euros_det(bruto) {
  if (bruto === null || bruto === undefined || bruto === "") return "";
  var limpio = String(bruto).trim().replace(/\s/g, "").replace(/€/g, "");
  /* Quitar puntos de miles y usar coma/punto decimal → número */
  if (limpio.indexOf(",") >= 0 && limpio.indexOf(".") >= 0) {
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (limpio.indexOf(",") >= 0) {
    limpio = limpio.replace(",", ".");
  }
  var n = Number(limpio);
  if (isNaN(n)) return escapar_det(texto_det(bruto));
  var entero = String(Math.round(n));
  var conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return escapar_det(conMiles + " €");
}

function tiene_stock_det(valor) {
  if (valor === null || valor === undefined || valor === "") return false;
  var n = Number(String(valor).replace(/\s/g, "").replace(",", "."));
  /* Con stock solo si Stock > 5 */
  return !isNaN(n) && n > 5;
}

function escapar_det(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function valor_escapado(fila, claves) {
  var i;
  var valor;
  for (i = 0; i < claves.length; i++) {
    valor = fila[claves[i]];
    if (valor !== null && valor !== undefined && valor !== "") {
      return escapar_det(texto_det(valor));
    }
  }
  return "";
}
