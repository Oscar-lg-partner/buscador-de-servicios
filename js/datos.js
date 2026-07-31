/**
 * DATOS
 * Trae del .gs, guarda en el navegador (IndexedDB) y en memoria.
 *
 * - Tras login OK → traerYGuardarDatos()
 * - Botón Actualizar → borra lo viejo y vuelve a traer
 * - Cerrar sesión → borra todo
 */

var DB_NOMBRE = "FlatFeeDB";
var DB_STORE = "datos";
var DB_CLAVE = "all";

/** Copia en memoria para leer rápido sin async en la lista */
var datosEnMemoria = null;
var cpTarifasEnMemoria = null;

function abrirDB() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(DB_NOMBRE, 1);
    req.onupgradeneeded = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = function () {
      resolve(req.result);
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

/** Llama a sendAllData, borra lo anterior y guarda lo nuevo */
async function traerYGuardarDatos() {
  var data = await apiCall({
    action: "sendAllData",
    token: obtenerToken(),
  });

  if (!data || !data.ok) {
    var msg = (data && data.error) || "No se pudieron cargar los datos";
    if (String(msg).toLowerCase().indexOf("sesión") >= 0) {
      cerrarSesion();
      window.location.href = APP_CONFIG.routes.login;
    }
    throw new Error(msg);
  }

  var items = data.items || [];
  var cpTarifas = data.cpTarifas || [];
  await borrarDatosGuardados();
  await guardarDatos(items, cpTarifas);
  datosEnMemoria = items;
  cpTarifasEnMemoria = cpTarifas;
  return items;
}

async function guardarDatos(items, cpTarifas) {
  var db = await abrirDB();
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(
      {
        items: items || [],
        cpTarifas: cpTarifas || [],
        ts: Date.now(),
      },
      DB_CLAVE
    );
    tx.oncomplete = function () {
      db.close();
      resolve();
    };
    tx.onerror = function () {
      db.close();
      reject(tx.error);
    };
  });
}

/** Borra IndexedDB + memoria */
async function borrarDatosGuardados() {
  datosEnMemoria = null;
  cpTarifasEnMemoria = null;
  try {
    var db = await abrirDB();
    await new Promise(function (resolve, reject) {
      var tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(DB_CLAVE);
      tx.oncomplete = function () {
        db.close();
        resolve();
      };
      tx.onerror = function () {
        db.close();
        reject(tx.error);
      };
    });
  } catch (e) {
    console.warn("No se pudieron borrar datos", e);
  }
  try {
    sessionStorage.removeItem("flatfee_all_data");
  } catch (e2) {}
}

/** Carga IndexedDB → memoria (llamar al abrir home) */
async function cargarDatosEnMemoria() {
  if (datosEnMemoria) return datosEnMemoria;

  var db = await abrirDB();
  var guardado = await new Promise(function (resolve, reject) {
    var tx = db.transaction(DB_STORE, "readonly");
    var req = tx.objectStore(DB_STORE).get(DB_CLAVE);
    req.onsuccess = function () {
      resolve(req.result || null);
    };
    req.onerror = function () {
      reject(req.error);
    };
    tx.oncomplete = function () {
      db.close();
    };
  });

  datosEnMemoria =
    guardado && guardado.items ? guardado.items : [];
  cpTarifasEnMemoria =
    guardado && guardado.cpTarifas ? guardado.cpTarifas : [];
  return datosEnMemoria;
}

/** Lectura síncrona para la lista (usa la memoria) */
function leerDatos() {
  return datosEnMemoria || [];
}

/** Filas de CP Tarifas guardadas (Tarifa 1 + SKU) */
function leerCpTarifas() {
  return cpTarifasEnMemoria || [];
}

function hayDatosGuardados() {
  return !!(datosEnMemoria && datosEnMemoria.length);
}

async function hayDatosEnNavegador() {
  var items = await cargarDatosEnMemoria();
  return items.length > 0;
}
