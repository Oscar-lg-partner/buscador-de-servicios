/**
 * sendAllData
 *
 * Junta SearchDatabase + Ventas lg rangos en UN solo listado.
 * Manda SearchDatabase (lo que busca el usuario).
 *
 * Cruce:
 *   Modelo (Tech. Name)  ↔  Model
 *
 * Regla (única): misma BASE
 *   - Base = texto antes del primer "." (si no hay ".", el texto entero)
 *   - Ej: F4WV308S3BW.ABWQPES y F4WV308S3BW.ABWQWES → base F4WV308S3BW → unen
 *   - Ej: OLED77G36LA y OLED77G36LA.AEU → base OLED77G36LA → unen
 *
 * Si no hay match en Ventas → columnas de Ventas vacías
 * Lo que solo está en Ventas se ignora
 */

function sendAllData(token) {
  if (!sesionValida(token)) {
    return { ok: false, error: "Sesión no válida. Vuelve a entrar." };
  }

  try {
    var items = concatenarSearchYVentas();
    var cpTarifas = leerCpTarifas_();
    return {
      ok: true,
      items: items,
      total: items.length,
      cpTarifas: cpTarifas,
    };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

/**
 * Lee la hoja CP Tarifas (Tarifa 1 + SKU).
 * SKU puede ser una lista separada por comas en la celda.
 */
function leerCpTarifas_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var nombres = ["CP Tarifas", "CP Tarifasuser"];
  var i;
  var hoja;
  var datos;

  for (i = 0; i < nombres.length; i++) {
    hoja = libro.getSheetByName(nombres[i]);
    if (hoja) break;
  }

  if (!hoja) {
    return [];
  }

  datos = leerHojaComoObjetos_(libro, hoja.getName());
  return datos.filas || [];
}

function concatenarSearchYVentas() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();

  var search = leerHojaComoObjetos_(libro, "SearchDatabase");
  var ventas = leerHojaComoObjetos_(libro, "Ventas lg rangos");

  var porBase = armarIndiceVentasPorBase_(ventas);
  var columnasVentas = ventas.columnas;
  var resultado = [];

  for (var i = 0; i < search.filas.length; i++) {
    var filaSearch = search.filas[i];
    var tech = textoLimpio(filaSearch["Modelo (Tech. Name)"]);

    if (!tech) {
      continue;
    }

    var matches = buscarVentasPorBase_(tech, porBase);

    if (!matches.length) {
      resultado.push(mezclarFilas_(filaSearch, null, columnasVentas));
    } else {
      for (var j = 0; j < matches.length; j++) {
        resultado.push(mezclarFilas_(filaSearch, matches[j], columnasVentas));
      }
    }
  }

  return resultado;
}

/**
 * Lee una hoja y la deja como:
 *   { columnas: [...], filas: [ {col: valor}, ... ] }
 */
function leerHojaComoObjetos_(libro, nombreHoja) {
  var hoja = libro.getSheetByName(nombreHoja);
  if (!hoja) {
    throw new Error('No existe la hoja "' + nombreHoja + '"');
  }

  var datos = hoja.getDataRange().getValues();
  if (datos.length < 2) {
    return { columnas: [], filas: [] };
  }

  var columnas = [];
  var c;
  for (c = 0; c < datos[0].length; c++) {
    columnas.push(textoLimpio(datos[0][c]));
  }

  var filas = [];
  var r, obj, valor;

  for (r = 1; r < datos.length; r++) {
    obj = {};
    for (c = 0; c < columnas.length; c++) {
      if (!columnas[c]) continue;
      valor = datos[r][c];
      if (valor === null || valor === undefined) {
        obj[columnas[c]] = "";
      } else {
        obj[columnas[c]] = valor;
      }
    }
    filas.push(obj);
  }

  return { columnas: columnas, filas: filas };
}

/**
 * Base = texto antes del primer "." (si no hay ".", el texto entero).
 * El punto solo separa; no cuenta para el cruce.
 */
function baseModelo_(texto) {
  var t = textoLimpio(texto);
  if (!t) return "";
  var punto = t.indexOf(".");
  if (punto === -1) return t;
  return t.substring(0, punto);
}

/**
 * Índice de Ventas por base de Model.
 * "F4WV308S3BW.ABWQWES" → clave "F4WV308S3BW"
 */
function armarIndiceVentasPorBase_(ventas) {
  var porBase = {};
  var i, model, base, fila;

  for (i = 0; i < ventas.filas.length; i++) {
    fila = ventas.filas[i];
    model = textoLimpio(fila["Model"]);
    if (!model) continue;

    base = baseModelo_(model);
    if (!base) continue;

    if (!porBase[base]) porBase[base] = [];
    porBase[base].push(fila);
  }

  return porBase;
}

/**
 * Ventas cuya base de Model = base del tech.
 */
function buscarVentasPorBase_(tech, porBase) {
  var base = baseModelo_(tech);
  if (!base || !porBase[base]) return [];

  var lista = [];
  var ya = {};
  var arr = porBase[base];
  var i, fila, id, m;

  for (i = 0; i < arr.length; i++) {
    fila = arr[i];
    m = textoLimpio(fila["Model"]);

    id =
      m +
      "||" +
      String(fila["Año"]) +
      "||" +
      String(fila["Code"]) +
      "||" +
      String(fila["Precios"]);
    if (ya[id]) continue;
    ya[id] = true;
    lista.push(fila);
  }

  return lista;
}

/**
 * Una fila final = columnas SearchDatabase + columnas Ventas
 */
function mezclarFilas_(filaSearch, filaVentas, columnasVentas) {
  var out = {};
  var k, c;

  for (k in filaSearch) {
    if (Object.prototype.hasOwnProperty.call(filaSearch, k)) {
      out[k] = filaSearch[k];
    }
  }

  for (c = 0; c < columnasVentas.length; c++) {
    k = columnasVentas[c];
    if (!k) continue;
    if (filaVentas) {
      out[k] = filaVentas[k];
    } else {
      out[k] = "";
    }
  }

  return out;
}
