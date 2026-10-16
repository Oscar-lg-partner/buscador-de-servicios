/**
 * BUSCADOR HOME
 * Responsabilidad: aplicar TODOS los filtros a la vez (AND).
 *
 *  - texto      → todo lo que se ve en la tarjeta (texto_busqueda de lista_home);
 *                 varias palabras = todas tienen que aparecer
 *  - stock      → "con" | "sin" | "" (sin filtro)
 *  - renovacion → "con" | "sin" | "" (sin filtro)
 *      renovacion_num → "" (todas) | valor de Renovaciones (solo con "con")
 *  - cp         → "con" | "sin" | "" (sin filtro)
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
};

/**
 * Aplica todos los filtros activos sobre la lista (AND).
 */
function aplicar_filtros(items) {
  var out = [];
  var i;
  var item;
  var palabras = palabras_busqueda_(filtros.texto);
  var stockFiltro = String(filtros.stock || "");
  var renoFiltro = String(filtros.renovacion || "");
  var renoNum = String(filtros.renovacion_num || "");
  var cpFiltro = String(filtros.cp || "");

  for (i = 0; i < items.length; i++) {
    item = items[i];

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
    .replace(/[̀-ͯ]/g, "")
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

function poner_filtro_cp(valor) {
  filtros.cp = valor_con_sin_(valor);
}

function limpiar_filtros() {
  filtros.texto = "";
  filtros.stock = "";
  filtros.renovacion = "";
  filtros.renovacion_num = "";
  filtros.cp = "";
  guardar_filtros_home();
}

function texto_chip_stock() {
  if (filtros.stock === "con") return "Stock Estado: Con Stock";
  if (filtros.stock === "sin") return "Stock Estado: Sin Stock";
  return "";
}

function texto_chip_renovacion() {
  if (filtros.renovacion === "con") {
    return filtros.renovacion_num
      ? "Renovación: " + filtros.renovacion_num
      : "Renovación: Con renovación";
  }
  if (filtros.renovacion === "sin") return "Renovación: Sin renovación";
  return "";
}

function texto_chip_cp() {
  if (filtros.cp === "con") return "CP: Con Código Postal";
  if (filtros.cp === "sin") return "CP: Sin Código Postal";
  return "";
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
