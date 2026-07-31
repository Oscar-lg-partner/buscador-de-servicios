/**
 * sendAllData
 *
 * Junta SearchDatabase + Ventas lg rangos en UN solo listado.
 * Manda SearchDatabase (lo que busca el usuario).
 *
 * Cruce: Modelo (Tech. Name) ↔ Model
 *
 * Dos casos (en ambos: de Ventas solo 1 fila = año MÁS ANTIGUO):
 *
 * 1) Exacto
 *    Search: F4J7TY1W.ABWQPES
 *    Ventas: varias F4J7TY1W.ABWQPES → nos quedamos con la de menor Año
 *
 * 2) Search corto / Ventas con sufijo
 *    Search: OLED55C7V
 *    Ventas: OLED55C7V.AEU, OLED55C7V.AEE, … → de todas las que
 *            empiezan por "OLED55C7V." (o igual exacto), solo la de menor Año
 *
 * Prioridad: si hay match exacto, solo se usan esas filas.
 * Si no hay exacto, se usan las de sufijo (tech + ".").
 *
 * Si no hay match → columnas de Ventas vacías
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

  var indices = armarIndicesVentas_(ventas);
  var columnasVentas = ventas.columnas;
  var resultado = [];

  for (var i = 0; i < search.filas.length; i++) {
    var filaSearch = search.filas[i];
    var tech = textoLimpio(filaSearch["Modelo (Tech. Name)"]);

    if (!tech) {
      continue;
    }

    var filaVentas = elegirVentaMasAntiguaParaTech_(tech, indices);
    resultado.push(mezclarFilas_(filaSearch, filaVentas, columnasVentas));
  }

  return resultado;
}

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
 * Índices de Ventas:
 * - exacto[Model] = [filas...]
 * - porPrefijo[tech] = filas cuyo Model empieza por tech + "."
 */
function armarIndicesVentas_(ventas) {
  var exacto = {};
  var porPrefijo = {};
  var i, fila, model, punto, prefijo;

  for (i = 0; i < ventas.filas.length; i++) {
    fila = ventas.filas[i];
    model = textoLimpio(fila["Model"]);
    if (!model) continue;

    if (!exacto[model]) exacto[model] = [];
    exacto[model].push(fila);

    punto = model.indexOf(".");
    if (punto > 0) {
      prefijo = model.substring(0, punto);
      if (!porPrefijo[prefijo]) porPrefijo[prefijo] = [];
      porPrefijo[prefijo].push(fila);
    }
  }

  return { exacto: exacto, porPrefijo: porPrefijo };
}

/**
 * Elige UNA fila de Ventas para el tech:
 * 1) Si hay Model == tech → la de año más antiguo entre esas
 * 2) Si no → entre Model que empiezan por tech + "." → la de año más antiguo
 * 3) Si no hay ninguna → null
 */
function elegirVentaMasAntiguaParaTech_(tech, indices) {
  var candidatas = indices.exacto[tech];

  if (candidatas && candidatas.length) {
    return filaAnioMasAntiguo_(candidatas);
  }

  candidatas = indices.porPrefijo[tech];
  if (candidatas && candidatas.length) {
    /* Solo las que empiezan por tech + "." (porPrefijo ya las agrupa así) */
    return filaAnioMasAntiguo_(candidatas);
  }

  return null;
}

/** De una lista de filas Ventas, la del Año más pequeño */
function filaAnioMasAntiguo_(filas) {
  if (!filas || !filas.length) return null;

  var mejor = null;
  var mejorAnio = null;
  var i, fila, anio;

  for (i = 0; i < filas.length; i++) {
    fila = filas[i];
    anio = anioNumero_(fila["Año"]);

    if (!mejor) {
      mejor = fila;
      mejorAnio = anio;
      continue;
    }

    if (anio !== null && (mejorAnio === null || anio < mejorAnio)) {
      mejor = fila;
      mejorAnio = anio;
    }
  }

  return mejor;
}

function anioNumero_(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  var n = Number(String(valor).trim().replace(",", "."));
  if (isNaN(n)) return null;
  return n;
}

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
