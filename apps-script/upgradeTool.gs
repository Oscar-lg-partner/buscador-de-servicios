/**
 * upgradeTool
 *
 * Lee la pestaña "Upgrade tool" y devuelve solo las columnas que se pintan:
 *   A, J, K, M  → columnas visibles del grid
 *   F           → grupo (QNED, OLED…): no se pinta, separa un grid de otro
 *
 * Se lee por POSICIÓN de columna (no por nombre de cabecera) y con
 * getDisplayValues(), para que precios/fechas lleguen tal cual se ven en el Sheet.
 *
 * Devuelve:
 *   { ok, columnas: ["cab A","cab J","cab K","cab M"],
 *     grupos: [ { nombre: "QNED", filas: [[a,j,k,m], ...] }, ... ] }
 */

var UPGRADE_HOJA = "Upgrade tool";
var UPGRADE_COL_VISIBLES = [0, 9, 10, 12]; // A, J, K, M
var UPGRADE_COL_GRUPO = 5; // F

function upgradeTool(token) {
  if (!sesionValida(token)) {
    return { ok: false, error: "Sesión no válida. Vuelve a entrar." };
  }

  try {
    var hoja = buscarHojaUpgrade_();
    if (!hoja) {
      return { ok: false, error: 'No existe la hoja "' + UPGRADE_HOJA + '"' };
    }

    var datos = hoja.getDataRange().getDisplayValues();
    if (datos.length < 1) {
      return { ok: true, columnas: [], grupos: [] };
    }

    var cab = datos[0];
    var columnas = UPGRADE_COL_VISIBLES.map(function (c) {
      return textoLimpio(cab[c]);
    });

    var grupos = [];
    var porNombre = {};
    var r, fila, valores, vacia, nombre;

    for (r = 1; r < datos.length; r++) {
      fila = datos[r];
      valores = UPGRADE_COL_VISIBLES.map(function (c) {
        return textoLimpio(fila[c]);
      });

      vacia = valores.every(function (v) {
        return v === "";
      });
      if (vacia) continue;

      nombre = textoLimpio(fila[UPGRADE_COL_GRUPO]) || "Sin grupo";
      if (!porNombre[nombre]) {
        porNombre[nombre] = { nombre: nombre, filas: [] };
        grupos.push(porNombre[nombre]);
      }
      porNombre[nombre].filas.push(valores);
    }

    return { ok: true, columnas: columnas, grupos: grupos };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

/** Busca la pestaña sin importar mayúsculas ni espacios de más */
function buscarHojaUpgrade_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(UPGRADE_HOJA);
  if (hoja) return hoja;

  var buscado = UPGRADE_HOJA.toLowerCase().replace(/\s+/g, " ");
  var hojas = libro.getSheets();
  for (var i = 0; i < hojas.length; i++) {
    if (textoLimpio(hojas[i].getName()).toLowerCase().replace(/\s+/g, " ") === buscado) {
      return hojas[i];
    }
  }
  return null;
}
