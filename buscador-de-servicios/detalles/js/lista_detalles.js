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
      con_stock: tiene_stock_det(fila["Stock"]),
      stock_unidades: campo_det_stock_unidades(fila),
      con_renove: campo_det_con_renove(fila),
      sku_garantia: campo_det_sku_garantia(fila),
      precio_garantia: campo_det_precio_garantia(fila),
      anio: campo_det_anio(fila),
      renovaciones: campo_det_renovaciones(fila),
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
 * PVP si existe en el sheet (cualquier flujo: renove o resto).
 * Formato: 1.667 €
 */
function campo_det_pvp(fila) {
  return formato_precio_euros_det(valor_bruto(fila, ["PVP"]));
}

/** true si Modelo Renove tiene valor y es distinto de "1" (plan renove) */
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

/** Unidades de stock (solo si hay stock: Stock > 5) */
function campo_det_stock_unidades(fila) {
  if (!tiene_stock_det(fila["Stock"])) return "";
  return valor_escapado(fila, ["Stock"]);
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

function campo_det_renovaciones(fila) {
  if (campo_det_con_renove(fila)) return "";
  return valor_escapado(fila, ["Renovaciones"]);
}

/* =========================================================
 * 3) HTML — solo pinta campos con valor (nada en blanco)
 * ========================================================= */

/**
 * Ficha de una fila. Se usa en la página de detalles y en el panel de home.
 *  - Arriba: lo que el agente dice en voz alta (servicio, precio, stock, renovación)
 *  - Debajo: el resto de datos (solo los que tienen valor)
 * Botones con data-nav="-1|1" (anterior / siguiente) y data-copiar="texto":
 * la página que la usa escucha esos clics.
 */
function pintar_detalle(bolsa, pos, caja) {
  caja = caja || document.getElementById("caja-detalle");
  if (!caja) return;

  if (!bolsa.total_datos) {
    caja.innerHTML =
      '<div class="estado"><p class="estado-titulo">No hay ficha para este modelo</p>' +
      "<p>Puede que ya no esté en el Sheet. Pulsa Actualizar o vuelve al buscador.</p></div>";
    return;
  }

  if (pos < 0) pos = 0;
  if (pos >= bolsa.total_datos) pos = bolsa.total_datos - 1;

  var item = bolsa.items[pos];
  /* Solo uno de los dos tiene valor (depende de Modelo Renove) */
  var precio = item.precio_opp || item.precio;
  var html = "";

  /* Cabecera: modelo + producto + navegación entre servicios del mismo modelo */
  html +=
    '<div class="ficha-cab">' +
    "<div>" +
    '<h2 class="ficha-modelo">' +
    item.modelo +
    "</h2>" +
    (item.producto ? '<div class="ficha-producto">' + item.producto + "</div>" : "") +
    "</div>";
  if (bolsa.total_datos > 1) {
    html +=
      '<div class="ficha-nav">' +
      '<button type="button" class="btn btn-icono" data-nav="-1" aria-label="Servicio anterior"' +
      (pos <= 0 ? " disabled" : "") +
      '><i class="bi bi-chevron-left"></i></button>' +
      '<span class="ficha-nav-texto"><span class="nav-pre">Servicio </span>' +
      (pos + 1) +
      " de " +
      bolsa.total_datos +
      "</span>" +
      '<button type="button" class="btn btn-icono" data-nav="1" aria-label="Servicio siguiente"' +
      (pos >= bolsa.total_datos - 1 ? " disabled" : "") +
      '><i class="bi bi-chevron-right"></i></button>' +
      "</div>";
  }
  html += "</div>";

  /* La respuesta */
  html += '<section class="ficha-respuesta" aria-label="Resumen para el cliente">';
  if (item.servicio) html += '<div class="ficha-servicio">' + item.servicio + "</div>";
  html +=
    '<div class="ficha-precio-fila">' +
    (precio
      ? '<span class="ficha-precio">' + precio + "</span>" + boton_copiar_det(precio, "precio")
      : '<span class="ficha-precio-sin">Sin precio en el Sheet</span>') +
    "</div>";
  html += '<div class="ficha-estados">';
  /* Mismo texto que en la lista: "Con stock (12)" / "Sin stock" */
  html += item.con_stock
    ? '<span class="pill pill-ok">Con stock' +
      (item.stock_unidades ? " (" + item.stock_unidades + ")" : "") +
      "</span>"
    : '<span class="pill pill-no">Sin stock</span>';
  if (item.con_renove) {
    html += '<span class="ficha-reno">Sin renovación</span>';
  } else if (item.renovaciones) {
    html += '<span class="ficha-reno">Renovaciones: <strong>' + item.renovaciones + "</strong></span>";
  }
  html += "</div></section>";

  /* Resto de datos, en el mismo orden de siempre */
  html += '<dl class="ficha-datos">';
  html += dato_det("SKU", item.sku, { copiar: true });
  html += dato_det("PVP Producto", item.pvp);
  html += dato_det("Modelo Renove", item.modelo_renove);
  html += dato_det("Año fin de ofrecimiento", item.periodo);
  /* Modelo Renove VACÍA → sí mostrar garantía/renovación (si tienen valor) */
  if (!item.con_renove) {
    html += dato_det("SKU Garantía", item.sku_garantia, { copiar: true });
    html += dato_det("Precio 1 año de garantía renovable", item.precio_garantia);
    html += dato_det("Año venta producto", item.anio);
  }
  html += "</dl>";

  caja.innerHTML = html;
}

/** Un dato de la ficha; si no hay valor no se pinta (evita etiquetas en blanco) */
function dato_det(label, valor, opts) {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return "";
  }
  opts = opts || {};
  return (
    /* Los que se copian (SKU) ocupan todo el ancho para no partirse */
    '<div class="dato' +
    (opts.copiar ? " dato-ancho" : "") +
    '">' +
    "<dt>" +
    label +
    "</dt>" +
    "<dd>" +
    valor +
    (opts.copiar ? boton_copiar_det(valor, label, true) : "") +
    "</dd>" +
    "</div>"
  );
}

/**
 * Botón "Copiar" (el valor llega ya escapado y sirve tal cual en el atributo).
 * soloIcono: versión compacta para los datos de abajo.
 */
function boton_copiar_det(valorEscapado, que, soloIcono) {
  return (
    '<button type="button" class="btn-copiar' +
    (soloIcono ? " btn-copiar-icono" : "") +
    '" data-copiar="' +
    valorEscapado +
    '" aria-label="Copiar ' +
    que +
    '" title="Copiar ' +
    que +
    '"><i class="bi bi-copy" aria-hidden="true"></i>' +
    (soloIcono ? "" : "<span>Copiar</span>") +
    "</button>"
  );
}

/**
 * Escucha en `caja` los botones de la ficha.
 * onNav(paso) recibe -1 / 1. Copiar funciona solo.
 */
function activar_ficha_det(caja, onNav) {
  caja.addEventListener("click", function (ev) {
    var nav = ev.target.closest("[data-nav]");
    if (nav && !nav.disabled) {
      onNav(Number(nav.getAttribute("data-nav")));
      return;
    }
    var btn = ev.target.closest("[data-copiar]");
    if (!btn) return;
    var valor = btn.getAttribute("data-copiar");
    var listo = function () {
      var txt = btn.querySelector("span");
      var ico = btn.querySelector(".bi");
      btn.classList.add("copiado");
      if (ico) ico.className = "bi bi-check2";
      if (txt) txt.textContent = "Copiado";
      setTimeout(function () {
        btn.classList.remove("copiado");
        if (ico) ico.className = "bi bi-copy";
        if (txt) txt.textContent = "Copiar";
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(valor).then(listo, function () {});
    }
  });
}

/* =========================================================
 * 4) AYUDAS
 * ========================================================= */

function texto_det(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

/** Formato euros (js/formato.js) + escape HTML */
function formato_precio_euros_det(bruto) {
  return escapar_det(formato_precio_euros(bruto));
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
