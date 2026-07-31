/**
 * BUSCADOR HOME
 * Responsabilidad: aplicar TODOS los filtros a la vez (AND).
 *
 *  - texto → Modelo_Tech_Name o Model (modelo)
 *  - stock → "con" | "sin" | "" (sin filtro)
 *
 * Los filtros se guardan en sessionStorage para no perderlos
 * al ir a detalles y volver.
 */

var CLAVE_FILTROS_HOME = "flatfee_filtros_home";

/** Estado actual de filtros */
var filtros = {
  texto: "",
  stock: "", // "" | "con" | "sin"
};

/**
 * Aplica todos los filtros activos sobre la lista (AND).
 */
function aplicar_filtros(items) {
  var out = [];
  var i;
  var item;
  var q = String(filtros.texto || "")
    .trim()
    .toLowerCase();
  var stockFiltro = String(filtros.stock || "");

  for (i = 0; i < items.length; i++) {
    item = items[i];

    if (q && !item_coincide_texto_(item, q)) continue;

    if (stockFiltro === "con" && !item_tiene_stock_(item)) continue;
    if (stockFiltro === "sin" && item_tiene_stock_(item)) continue;

    out.push(item);
  }

  return out;
}

function item_coincide_texto_(item, q) {
  var tech = String(item.Modelo_Tech_Name || "").toLowerCase();
  var model = String(item.modelo || "").toLowerCase();
  return tech.indexOf(q) !== -1 || model.indexOf(q) !== -1;
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

function poner_texto_busqueda(texto) {
  filtros.texto = texto || "";
}

function poner_filtro_stock(valor) {
  if (valor === "con" || valor === "sin") {
    filtros.stock = valor;
  } else {
    filtros.stock = "";
  }
}

function limpiar_filtros() {
  filtros.texto = "";
  filtros.stock = "";
  guardar_filtros_home();
}

function texto_chip_stock() {
  if (filtros.stock === "con") return "Stock Estado: Con Stock";
  if (filtros.stock === "sin") return "Stock Estado: Sin Stock";
  return "";
}

/** Guarda texto, stock y scroll para volver desde detalles */
function guardar_filtros_home() {
  try {
    sessionStorage.setItem(
      CLAVE_FILTROS_HOME,
      JSON.stringify({
        texto: filtros.texto || "",
        stock: filtros.stock || "",
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
    filtros.stock =
      data.stock === "con" || data.stock === "sin" ? data.stock : "";
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
