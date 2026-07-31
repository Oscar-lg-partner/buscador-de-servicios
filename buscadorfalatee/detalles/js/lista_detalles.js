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
  return formato_precio_euros_det(valor_bruto(fila, ["PVP"]));
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
  return formato_precio_euros_det(valor_bruto(fila, ["Precio de coste 2"]));
}

/** Precio (SearchDatabase): solo si Modelo Renove tiene valor ≠ 1. Formato: 1.099 € */
function campo_det_precio(fila) {
  if (!campo_det_mostrar_pvp(fila)) return "";
  return formato_precio_euros_det(valor_bruto(fila, ["Precio"]));
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
  return formato_precio_euros_det(valor_bruto(fila, ["Precios"]));
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

/**
 * Formato euros:
 *   1.667 / 1.059 (miles mal leídos) → "1.667 €"
 *   39.99 / "39,99"                   → "39,99 €"
 */
function formato_precio_euros_det(bruto) {
  if (bruto === null || bruto === undefined || bruto === "") return "";
  var n = parse_precio_numero_det(bruto);
  if (isNaN(n)) return escapar_det(texto_det(bruto));

  /* Céntimos reales (1–2 decimales): 39,99 € */
  if (precio_trae_centimos_det(bruto)) {
    var fijo = Math.abs(n).toFixed(2).split(".");
    var parteEntera = fijo[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    var signo = n < 0 ? "-" : "";
    return escapar_det(signo + parteEntera + "," + fijo[1] + " €");
  }

  /* Entero + miles con punto */
  var entero = String(Math.round(n));
  var conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return escapar_det(conMiles + " €");
}

/** true solo si el bruto trae 1–2 decimales (céntimos), no 3 (miles / ruido) */
function precio_trae_centimos_det(bruto) {
  var s;
  if (typeof bruto === "number" && isFinite(bruto)) {
    if (Math.abs(bruto - Math.round(bruto)) < 1e-9) return false;
    s = String(bruto);
    if (/e/i.test(s)) return false;
  } else {
    s = String(bruto).trim().replace(/\s/g, "").replace(/€/g, "");
  }
  var lastComma = s.lastIndexOf(",");
  var lastDot = s.lastIndexOf(".");
  var sepAt = Math.max(lastComma, lastDot);
  if (sepAt < 0) return false;
  var cola = s.slice(sepAt + 1).replace(/[^\d]/g, "");
  return cola.length === 1 || cola.length === 2;
}

function parse_precio_numero_det(bruto) {
  if (typeof bruto === "number" && isFinite(bruto)) {
    if (Math.abs(bruto - Math.round(bruto)) < 1e-9) return Math.round(bruto);
    /*
     * Solo X.YYY con |X| < 10 → miles mal leídos (1.667 → 1667).
     * NUNCA 1667.115 → eso ya es ~1667 €.
     */
    var textoNum = String(bruto);
    if (/e/i.test(textoNum)) {
      textoNum = bruto.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    }
    var punto = textoNum.indexOf(".");
    if (punto >= 0) {
      var dec = textoNum.slice(punto + 1);
      if (/^\d{3}$/.test(dec) && Math.abs(bruto) < 10) {
        return Math.round(bruto * 1000);
      }
    }
    return bruto;
  }

  var s = String(bruto).trim().replace(/\s/g, "").replace(/€/g, "");
  if (!s) return NaN;

  var lastComma = s.lastIndexOf(",");
  var lastDot = s.lastIndexOf(".");

  /* Ambos: el último es decimal (1.059,50 o 1,059.50) */
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
    return parse_precio_numero_det(Number(s));
  }

  /* Solo coma o solo punto */
  if (lastComma >= 0 || lastDot >= 0) {
    var sep = lastComma >= 0 ? "," : ".";
    var parts = s.split(sep);
    var cola = parts[parts.length - 1];
    var izquierda = parts[0].replace(/[^\d-]/g, "");

    /* 3 dígitos y parte entera corta → miles: 1.667 / 1,059 */
    if (
      /^\d{3}$/.test(cola) &&
      parts.length === 2 &&
      izquierda.replace("-", "").length <= 3
    ) {
      return Number(izquierda + cola);
    }
    /* Varios grupos de miles: 1.234.567 */
    if (/^\d{3}$/.test(cola) && parts.length > 2) {
      return Number(parts.join(""));
    }
    /* 1–2 dígitos → céntimos: 39,99 */
    if (parts.length === 2 && /^\d{1,2}$/.test(cola)) {
      return Number(izquierda + "." + cola);
    }
    /* 1667.115 → decimal real */
    if (parts.length === 2 && /^\d+$/.test(cola)) {
      return Number(izquierda + "." + cola);
    }
    return Number(s.replace(/[.,]/g, ""));
  }

  return Number(s);
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

/**
 * Lee el primer valor no vacío (sin escapar).
 * Sirve para precios: hay que formatear el bruto, no el HTML escapado.
 */
function valor_bruto(fila, claves) {
  var i;
  var valor;
  for (i = 0; i < claves.length; i++) {
    valor = fila[claves[i]];
    if (valor !== null && valor !== undefined && valor !== "") {
      return valor;
    }
  }
  return "";
}

/** Misma lectura que valor_bruto + escape HTML */
function valor_escapado(fila, claves) {
  var valor = valor_bruto(fila, claves);
  if (valor === "") return "";
  return escapar_det(texto_det(valor));
}
