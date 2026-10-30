/**
 * BUSCADOR HOME
 * Responsabilidad: aplicar TODOS los filtros a la vez (AND).
 *
 *  - texto      → todo lo que se ve en la tarjeta (texto_busqueda de lista_home);
 *                 varias palabras = todas tienen que aparecer.
 *                 Una palabra de 5 cifras que existe en CP Tarifas = código postal:
 *                 solo salen los servicios cuyo SKU está en ese CP.
 *  - stock      → "con" | "sin" | "" (sin filtro)
 *  - renovacion → "con" | "sin" | "" (sin filtro)
 *      renovacion_num → "" (todas) | valor de Renovaciones (solo con "con")
 *  - cp         → "con" | "sin" | "" (sin filtro)
 *  - cp_buscado → código postal del campo pequeño "Código postal" (5 cifras):
 *                 solo los servicios cuyo SKU está en ese CP de CP Tarifas
 *
 * Los filtros se guardan en sessionStorage para no perderlos
 * al ir a detalles y volver.
 */

var CLAVE_FILTROS_HOME = "flatfee_filtros_home";

/** Estado actual de filtros */
var filtros = {
  texto: "",
  stock: "", // "" | "con" | "sin"
  renovacion: "", // "" | "con" | "sin"
  renovacion_num: "", // "" = todas | "1", "2"...
  cp: "", // "" | "con" | "sin"
  cp_buscado: "", // "" | "01009" (campo Código postal)
};

/**
 * Aplica todos los filtros activos sobre la lista (AND).
 */
function aplicar_filtros(items, cps) {
  var out = [];
  var i;
  var item;
  var busqueda = separar_cp_busqueda(filtros.texto, cps);
  var palabras = palabras_busqueda_(busqueda.resto);
  var skusDelCp = busqueda.existe ? cps[busqueda.cp] : null;
  /* Campo Código postal: con 5 cifras filtra (si no existe → {} → 0 resultados) */
  var cpCampo = cp_buscado_completo();
  var skusCampo = cpCampo ? (cps && cps[cpCampo]) || {} : null;
  var stockFiltro = String(filtros.stock || "");
  var renoFiltro = String(filtros.renovacion || "");
  var renoNum = String(filtros.renovacion_num || "");
  var cpFiltro = String(filtros.cp || "");

  for (i = 0; i < items.length; i++) {
    item = items[i];

    if (skusDelCp && !skusDelCp[item.sku_base]) continue;
    if (skusCampo && !skusCampo[item.sku_base]) continue;
    if (palabras.length && !item_coincide_texto_(item, palabras)) continue;

    if (stockFiltro === "con" && !item_tiene_stock_(item)) continue;
    if (stockFiltro === "sin" && item_tiene_stock_(item)) continue;

    if (renoFiltro === "con") {
      if (!item_con_renovacion_(item)) continue;
      if (renoNum && item.renovaciones_valor !== renoNum) continue;
    }
    if (renoFiltro === "sin" && !item.con_renove) continue;

    if (cpFiltro === "con" && !item.cp) continue;
    if (cpFiltro === "sin" && item.cp) continue;

    out.push(item);
  }

  return out;
}

/**
 * Separa el código postal del resto de la búsqueda.
 * "01009 oled" → { cp: "01009", existe: true, resto: "oled" }
 * 5 cifras que NO están en CP Tarifas → se buscan como texto normal (existe: false).
 * Con 4 cifras o menos nunca es CP (así 1099 o 2023 siguen buscando precio/año).
 */
function separar_cp_busqueda(textoBuscado, cps) {
  var trozos = String(textoBuscado || "").trim().split(/\s+/);
  var i;
  for (i = 0; i < trozos.length; i++) {
    if (!/^\d{5}$/.test(trozos[i])) continue;
    if (cps && cps[trozos[i]]) {
      var resto = trozos.slice(0, i).concat(trozos.slice(i + 1));
      return { cp: trozos[i], existe: true, resto: resto.join(" ") };
    }
    return { cp: trozos[i], existe: false, resto: textoBuscado };
  }
  return { cp: "", existe: false, resto: textoBuscado };
}

/** CP del campo pequeño solo cuenta con las 5 cifras */
function cp_buscado_completo() {
  return /^\d{5}$/.test(filtros.cp_buscado || "") ? filtros.cp_buscado : "";
}

/**
 * Para los avisos bajo la búsqueda: lista de
 * { cp, existe, total_skus, servicios, desde: "campo" | "texto" }.
 * Vacía si no se busca ningún CP.
 */
function info_cp_busqueda(bolsa) {
  var out = [];
  var cpCampo = cp_buscado_completo();
  if (cpCampo) out.push(info_un_cp_(bolsa, cpCampo, "campo"));

  var b = separar_cp_busqueda(filtros.texto, bolsa.cps);
  if (b.cp && b.cp !== cpCampo) {
    out.push(
      b.existe ? info_un_cp_(bolsa, b.cp, "texto") : { cp: b.cp, existe: false, desde: "texto" }
    );
  }
  return out;
}

function info_un_cp_(bolsa, cp, desde) {
  var skus = bolsa.cps[cp];
  if (!skus) return { cp: cp, existe: false, desde: desde };
  var servicios = 0;
  for (var i = 0; i < bolsa.items.length; i++) {
    if (skus[bolsa.items[i].sku_base]) servicios++;
  }
  return {
    cp: cp,
    existe: true,
    total_skus: Object.keys(skus).length,
    servicios: servicios,
    desde: desde,
  };
}

/** Cada palabra escrita tiene que aparecer en lo que se ve en la tarjeta */
function item_coincide_texto_(item, palabras) {
  var bolsaTexto = item.texto_busqueda || "";
  for (var i = 0; i < palabras.length; i++) {
    if (bolsaTexto.indexOf(palabras[i]) === -1) return false;
  }
  return true;
}

/** "OLED 2023" → ["oled", "2023"] (ya normalizadas) */
function palabras_busqueda_(textoBuscado) {
  var trozos = String(textoBuscado || "").split(/\s+/);
  var out = [];
  for (var i = 0; i < trozos.length; i++) {
    var p = normalizar_busqueda(trozos[i]);
    if (p) out.push(p);
  }
  return out;
}

/**
 * Minúsculas, sin tildes, sin puntos, € ni espacios:
 * "1.099 €" y "1099" coinciden; "Año" y "ano" también.
 */
function normalizar_busqueda(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\s€]/g, "");
}

/** true = tiene stock (Stock > 5) */
function item_tiene_stock_(item) {
  if (!item) return false;

  if (typeof item.con_stock === "boolean") {
    return item.con_stock;
  }

  if (item.stock_raw !== undefined && item.stock_raw !== null && item.stock_raw !== "") {
    return tiene_stock_filtro_(item.stock_raw);
  }

  return tiene_stock_filtro_(item.stock);
}

function tiene_stock_filtro_(valor) {
  if (valor === null || valor === undefined) return false;
  var s = String(valor).trim();
  if (!s) return false;
  var n = Number(s.replace(/\s/g, "").replace(",", "."));
  return !isNaN(n) && n > 5;
}

/**
 * Con renovación = la tarjeta muestra "Renovación: N"
 * (Modelo Renove vacía y Renovaciones con valor).
 */
function item_con_renovacion_(item) {
  return !item.con_renove && item.renovaciones_valor !== "";
}

/**
 * Números de renovación que existen en los datos (para el desplegable).
 * Ordenados de menor a mayor.
 */
function opciones_renovacion(items) {
  var vistos = {};
  var out = [];
  var i, v;

  for (i = 0; i < items.length; i++) {
    if (!item_con_renovacion_(items[i])) continue;
    v = items[i].renovaciones_valor;
    if (vistos[v]) continue;
    vistos[v] = true;
    out.push(v);
  }

  out.sort(function (a, b) {
    var na = Number(a);
    var nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
  return out;
}

function poner_texto_busqueda(texto) {
  filtros.texto = texto || "";
}

function valor_con_sin_(valor) {
  return valor === "con" || valor === "sin" ? valor : "";
}

function poner_filtro_stock(valor) {
  filtros.stock = valor_con_sin_(valor);
}

/** num solo cuenta con "con"; "" = todas */
function poner_filtro_renovacion(valor, num) {
  filtros.renovacion = valor_con_sin_(valor);
  filtros.renovacion_num =
    filtros.renovacion === "con" ? String(num || "") : "";
}

/** Solo cifras, máximo 5 */
function poner_cp_buscado(valor) {
  filtros.cp_buscado = String(valor || "").replace(/\D/g, "").slice(0, 5);
}

function poner_filtro_cp(valor) {
  filtros.cp = valor_con_sin_(valor);
}

function limpiar_filtros() {
  filtros.texto = "";
  filtros.stock = "";
  filtros.renovacion = "";
  filtros.renovacion_num = "";
  filtros.cp = "";
  filtros.cp_buscado = "";
  guardar_filtros_home();
}

/** true si hay texto o algún filtro puesto */
function hay_filtros_activos() {
  return !!(
    String(filtros.texto || "").trim() ||
    filtros.stock ||
    filtros.renovacion ||
    filtros.cp ||
    filtros.cp_buscado
  );
}

/** Guarda texto, filtros y scroll para volver desde detalles */
function guardar_filtros_home() {
  try {
    sessionStorage.setItem(
      CLAVE_FILTROS_HOME,
      JSON.stringify({
        texto: filtros.texto || "",
        stock: filtros.stock || "",
        renovacion: filtros.renovacion || "",
        renovacion_num: filtros.renovacion_num || "",
        cp: filtros.cp || "",
        cp_buscado: filtros.cp_buscado || "",
        scrollY: window.scrollY || 0,
      })
    );
  } catch (e) {}
}

/**
 * Restaura filtros desde sessionStorage.
 * @returns {number} scrollY guardado
 */
function restaurar_filtros_home() {
  try {
    var raw = sessionStorage.getItem(CLAVE_FILTROS_HOME);
    if (!raw) return 0;
    var data = JSON.parse(raw);
    filtros.texto = data.texto || "";
    poner_filtro_stock(data.stock);
    poner_filtro_renovacion(data.renovacion, data.renovacion_num);
    poner_filtro_cp(data.cp);
    poner_cp_buscado(data.cp_buscado);
    return Number(data.scrollY) || 0;
  } catch (e) {
    return 0;
  }
}

function borrar_filtros_home_guardados() {
  try {
    sessionStorage.removeItem(CLAVE_FILTROS_HOME);
  } catch (e) {}
}
