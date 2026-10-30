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
      renovaciones_valor: campo_renovaciones_valor(fila),
      fin_ofrecimiento: campo_fin_ofrecimiento(fila),
      anio: campo_anio(fila),
      stock: campo_stock(fila),
      stock_raw: texto(fila["Stock"]),
      con_stock: campo_con_stock(fila),
      cp: campo_cp(fila, skusCp),
      sku_base: campo_sku_base(fila),
      precios: campo_precios(fila),
      texto_busqueda: campo_texto_busqueda(fila, skusCp),
    });

    contadores[techKey] = contadores[techKey] + 1;
  }

  return {
    items: data,
    total_datos: data.length,
    /* Código postal → SKUs (para buscar por CP) */
    cps: mapa_cp_a_skus(),
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
  return escapar(formato_precio_euros(valor));
}

/**
 * Renove con valor ≠ "1" → columna Precio (SearchDatabase)
 * Renove vacía o "1" → Precio de coste 2 (precio2)
 */
function campo_precio_lista(fila) {
  if (campo_mostrar_precio_search(fila)) {
    var valor = fila["Precio"];
    if (valor === null || valor === undefined || valor === "") return "";
    return escapar(formato_precio_euros(valor));
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

/**
 * Para el filtro de renovación (no se pinta; no lleva escapar).
 * Número de Renovaciones solo si Modelo Renove está VACÍA; si no, "".
 */
function campo_renovaciones_valor(fila) {
  if (campo_con_renove(fila)) return "";
  return texto(fila["Renovaciones"]);
}

/** Año debajo de renovación — siempre se muestra si hay valor */
/* Año fin de ofrecimiento (columna "Período ofrecimiento (años)" del Sheet) */
function campo_fin_ofrecimiento(fila) {
  var valor = primer_valor(fila, ["Período ofrecimiento (años)", "Periodo ofrecimiento (años)"]);
  if (!valor) return "";
  return escapar(valor);
}

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
/* "RXMUKMN.AO5051WA" cuenta como "RXMUKMN" (en CP Tarifas van sin sufijo) */
function campo_cp(fila, skusCp) {
  var ref = campo_sku_base(fila);
  if (!ref) return "";
  if (skusCp && skusCp[ref]) return escapar("SI");
  return "";
}

/**
 * Para la búsqueda por código postal (no se pinta).
 * SKU del sistema sin sufijo: "RFBFRX01.AO05EW01" → "RFBFRX01"
 * (en CP Tarifas los SKU vienen sin sufijo).
 */
function campo_sku_base(fila) {
  return texto_antes_punto(texto(fila["Referencia n 2"])).toUpperCase();
}

function campo_precios(fila) {
  /* Modelo Renove LLENA → no mostrar Precio 1 año de garantía (P:) */
  if (campo_con_renove(fila)) return "";
  var valor = fila["Precios"];
  if (valor === null || valor === undefined || valor === "") return "";
  return escapar(formato_precio_euros(valor));
}

/**
 * Para el buscador (no se pinta; no lleva escapar).
 * Junta lo que se ve en la tarjeta Y en la ficha, con las mismas reglas
 * que esos campos (p. ej. con Modelo Renove llena no entra el SKU Garantía).
 * Los precios entran en bruto y con formato (1099 y "1.099 €", 19.99 y "19,99 €").
 */
function campo_texto_busqueda(fila, skusCp) {
  var partes = [];
  var renove = texto(leer_modelo_renove_home(fila));
  var conRenove = renove !== "";
  var planRenove = renove !== "" && renove !== "1";
  var anio = texto(fila["Año"]) || texto(fila["Ano"]);

  /* Tarjeta */
  partes.push(texto(fila["Modelo (Tech. Name)"]));
  partes.push(texto(fila["Model"]));
  partes.push(texto(fila["Resumen 2"]));
  partes.push(precio_para_busqueda(planRenove ? fila["Precio"] : fila["Precio de coste 2"]));
  partes.push(conRenove ? "Sin renovación" : texto(fila["Renovaciones"]));
  partes.push(anio);
  partes.push(campo_con_stock(fila) ? "Con stock " + texto(fila["Stock"]) : "Sin stock");
  if (campo_cp(fila, skusCp)) partes.push("CP");
  if (!conRenove) partes.push(precio_para_busqueda(fila["Precios"]));

  /* Ficha */
  partes.push(primer_valor(fila, ["Modelo (Pet Name)"]));
  partes.push(precio_para_busqueda(primer_valor(fila, ["PVP"])));
  partes.push(primer_valor(fila, ["Período ofrecimiento (años)", "Periodo ofrecimiento (años)"]));
  if (planRenove) {
    partes.push(renove); /* Modelo Renove */
  } else {
    partes.push(primer_valor(fila, ["Referencia n 2", "SKU"])); /* SKU */
  }
  if (!conRenove) {
    partes.push(primer_valor(fila, ["SKU Garantía", "SKU Garantia"]));
  }

  return normalizar_busqueda(partes.join("|"));
}

/** Primer valor no vacío entre varios nombres de columna (texto, sin escapar) */
function primer_valor(fila, claves) {
  for (var i = 0; i < claves.length; i++) {
    var v = texto(fila[claves[i]]);
    if (v) return v;
  }
  return "";
}

/** Precio en bruto + con formato, para encontrarlo se escriba como se escriba */
function precio_para_busqueda(valor) {
  var bruto = texto(valor);
  if (!bruto) return "";
  return bruto + " " + formato_precio_euros(valor);
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
/* Bolsa ya calculada: solo se rehace si llegan datos nuevos (login / Actualizar) */
var bolsa_home_cache = null;
var bolsa_home_fuente = null;

/* Alias: el buscador / home ya llaman datos_necesarios() */
function datos_necesarios() {
  var filas = leerDatos();
  if (!bolsa_home_cache || bolsa_home_fuente !== filas) {
    bolsa_home_cache = crear_bolsa_datos();
    bolsa_home_fuente = filas;
  }
  return bolsa_home_cache;
}

/* =========================================================
 * 3) HTML — solo pinta (sin validar)
 * ========================================================= */

/**
 * Pinta las filas filtradas en #lista-buscador.
 * La misma fila se ve como tabla en PC y como tarjeta en móvil (CSS).
 * @returns {number} cuántas filas se pintaron
 */
function listar_datos_home() {
  var caja = document.getElementById("lista-buscador");
  if (!caja) return 0;

  /* Bolsa completa → filtros → pintar */
  var base = datos_necesarios();
  var items =
    typeof aplicar_filtros === "function" ? aplicar_filtros(base.items, base.cps) : base.items;
  /* El código postal no se resalta: no aparece en la tarjeta */
  var palabras =
    typeof palabras_busqueda_ === "function"
      ? palabras_busqueda_(separar_cp_busqueda(filtros.texto, base.cps).resto)
      : [];

  if (!items.length) {
    caja.innerHTML = html_sin_resultados(filtros.texto);
    return 0;
  }

  var html = "";
  var i;
  var item;
  var anterior = null;
  var vacio = '<span class="vacio">—</span>';

  for (i = 0; i < items.length; i++) {
    item = items[i];
    if (!item.Modelo_Tech_Name) continue;

    html +=
      '<div class="fila' +
      (anterior === item.tech_key ? " fila-sigue" : "") +
      '" tabindex="0" aria-selected="false" data-tech="' +
      escapar(item.tech_key) +
      '" data-pos="' +
      item.pos_en_modelo +
      '">' +
      /* Modelo + Model (Ventas) */
      '<div class="c-modelo">' +
      '<div class="modelo-nombre">' +
      resaltar(texto_antes_punto(item.Modelo_Tech_Name), palabras) +
      "</div>" +
      (item.modelo
        ? '<div class="modelo-ventas">' + resaltar(item.modelo, palabras) + "</div>"
        : "") +
      "</div>" +
      '<div class="c-servicio">' +
      (item.resumen2 ? resaltar(item.resumen2, palabras) : vacio) +
      "</div>" +
      '<div class="c-precio">' +
      (item.precio_lista ? resaltar(item.precio_lista, palabras) : vacio) +
      "</div>" +
      /* Renovación, fin de ofrecimiento, año, stock, CP y garantía (cada uno en su columna) */
      '<div class="c-meta">' +
      '<div class="c-reno">' +
      /* Etiqueta, como el stock */
      (item.con_renove
        ? '<span class="pill pill-no">Sin renovación</span>'
        : item.renovacion
          ? /* La cabecera ya dice "Renovación"; en móvil (sin cabecera) se mantiene la palabra */
          '<span class="pill pill-reno"><span class="etq-movil">Renovación </span>' +
            item.renovacion +
            "</span>"
          : vacio) +
      "</div>" +
      '<div class="c-fin">' +
      (item.fin_ofrecimiento
        ? '<span class="etq-movil">Año fin de ofrecimiento: </span>' + item.fin_ofrecimiento
        : vacio) +
      "</div>" +
      '<div class="c-anio">' +
      (item.anio ? '<span class="etq-movil">Año venta producto: </span>' + item.anio : vacio) +
      "</div>" +
      /* En móvil estas 3 van juntas en una línea */
      '<div class="extras-movil">' +
      '<div class="c-stock">' +
      (item.con_stock
        ? '<span class="pill pill-ok">Con stock (' + item.stock + ")</span>"
        : '<span class="pill pill-no">Sin stock</span>') +
      "</div>" +
      '<div class="c-cp">' +
      (item.cp
        ? '<span class="pill pill-cp" title="Tiene código postal (CP Tarifas)">CP</span>'
        : '<span class="pill pill-no pill-sin-cp">Sin CP</span>') +
      "</div>" +
      '<div class="c-garantia">' +
      (item.precios
        ? '<span class="etq-movil">Garantía 1 año: </span>' + item.precios
        : vacio) +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>";

    anterior = item.tech_key;
  }

  caja.innerHTML = html;
  return items.length;
}

/** Estado vacío: explica qué pasó y qué hacer */
function html_sin_resultados(textoBuscado) {
  var t = String(textoBuscado || "").trim();
  return (
    '<div class="estado">' +
    '<p class="estado-titulo">' +
    (t ? "Sin resultados para «" + escapar(t) + "»" : "Sin resultados con estos filtros") +
    "</p>" +
    "<p>Prueba con menos caracteres o quita algún filtro.</p>" +
    '<button type="button" class="btn" data-accion="limpiar">Limpiar búsqueda y filtros</button>' +
    "</div>"
  );
}

/**
 * Marca en amarillo las palabras buscadas dentro de un texto YA escapado.
 * Compara igual que el buscador: sin mayúsculas, tildes, puntos, espacios ni €.
 */
function resaltar(textoEscapado, palabras) {
  if (!palabras || !palabras.length || !textoEscapado) return textoEscapado;

  var original = desescapar(textoEscapado);
  var norm = "";
  var mapa = []; /* posición en norm → posición en original */
  var i, c, n;

  for (i = 0; i < original.length; i++) {
    c = original.charAt(i);
    if (/[.\s€]/.test(c)) continue;
    n = c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (n.length !== 1) n = c.toLowerCase();
    norm += n;
    mapa.push(i);
  }

  var marcado = [];
  var p, desde, pos;
  for (p = 0; p < palabras.length; p++) {
    desde = 0;
    while ((pos = norm.indexOf(palabras[p], desde)) !== -1) {
      for (i = mapa[pos]; i <= mapa[pos + palabras[p].length - 1]; i++) marcado[i] = true;
      desde = pos + 1;
    }
  }
  if (!marcado.length) return textoEscapado;

  var out = "";
  var dentro = false;
  for (i = 0; i < original.length; i++) {
    if (marcado[i] && !dentro) {
      out += "<mark>";
      dentro = true;
    } else if (!marcado[i] && dentro) {
      out += "</mark>";
      dentro = false;
    }
    out += escapar(original.charAt(i));
  }
  if (dentro) out += "</mark>";
  return out;
}

function desescapar(t) {
  return String(t)
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
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
 * Parte cada celda SKU por comas y guarda la parte antes del punto
 * (se compara con campo_sku_base).
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
      codigo = texto_antes_punto(texto(partes[p])).toUpperCase();
      if (codigo) mapa[codigo] = true;
    }
  }

  return mapa;
}

/**
 * Mapa de CP Tarifas: { "01009": { "RFBFRX01": true, ... }, ... }
 * - Columna "Tarifa 1" = código postal (se normaliza a 5 cifras: 1009 → "01009")
 * - Columna "SKU" = lista separada por comas
 * Si un CP aparece en varias filas, se juntan sus SKU.
 */
function mapa_cp_a_skus() {
  var filas = typeof leerCpTarifas === "function" ? leerCpTarifas() : [];
  var mapa = {};
  var i, p, cp, partes, codigo;

  for (i = 0; i < filas.length; i++) {
    cp = normalizar_cp(leer_columna_tarifa_1(filas[i]));
    if (!cp) continue;
    if (!mapa[cp]) mapa[cp] = {};
    partes = texto(filas[i]["SKU"]).split(",");
    for (p = 0; p < partes.length; p++) {
      codigo = texto_antes_punto(texto(partes[p])).toUpperCase();
      if (codigo) mapa[cp][codigo] = true;
    }
  }

  return mapa;
}

/** Lee "Tarifa 1" aunque la cabecera tenga espacios de más */
function leer_columna_tarifa_1(fila) {
  if (fila["Tarifa 1"] !== undefined) return fila["Tarifa 1"];
  for (var k in fila) {
    if (!Object.prototype.hasOwnProperty.call(fila, k)) continue;
    if (String(k).replace(/\s+/g, " ").trim().toLowerCase() === "tarifa 1") return fila[k];
  }
  return "";
}

/** "1009" / 1009 / " 01009 " → "01009"; si no son cifras → "" */
function normalizar_cp(valor) {
  var s = texto(valor).replace(/\s/g, "");
  if (!/^\d{1,5}$/.test(s)) return "";
  while (s.length < 5) s = "0" + s;
  return s;
}
