/**
 * SERVICIO UPGRADE
 *
 * Pide al .gs la pestaña "Upgrade tool" (columnas A, J, K, M) y pinta
 * un panel por cada grupo de la columna F (QNED, OLED…).
 * La columna F no se pinta: solo sirve para separar los paneles.
 *
 * Cada fila llega como [A, J, K, M] = [group, modelsuffix, available_qty, COGS_price].
 * Las cabeceras del Sheet no se muestran: se usan las etiquetas de UP_COLUMNAS.
 *
 * No se guarda en IndexedDB: se pide cada vez que se abre la pestaña.
 */

/* Orden = orden en que llegan del .gs (A, J, K, M) */
var UP_COLUMNAS = [
  { etiqueta: "Grupo", clase: "up-c-grupo" },
  { etiqueta: "Modelo", clase: "up-c-modelo" },
  { etiqueta: "Cantidad", clase: "up-c-cant c-num" },
  { etiqueta: "Precio", clase: "up-c-precio c-num" },
];

/** Llama a upgradeTool. Si la sesión caducó → login */
async function traer_upgrade() {
  var data = await apiCall({
    action: "upgradeTool",
    token: obtenerToken(),
  });

  if (!data || !data.ok) {
    var msg = (data && data.error) || "No se pudieron cargar los datos de Upgrade";
    if (String(msg).toLowerCase().indexOf("sesión") >= 0) {
      await cerrarSesion();
      window.location.href = APP_CONFIG.routes.login;
    }
    throw new Error(msg);
  }

  return { grupos: data.grupos || [] };
}

/* ================= CAMPOS (leen la fila, formatean y escapan) ================= */

function campo_up_grupo(fila) {
  return escapar_up(fila[0]);
}

function campo_up_modelo(fila) {
  return escapar_up(fila[1]);
}

/** Cantidad como número; 0 o vacío en gris */
function campo_up_cantidad(fila) {
  var txt = escapar_up(fila[2]);
  if (String(fila[2] == null ? "" : fila[2]).trim() === "") return txt;
  return numero_up(fila[2]) <= 0 ? '<span class="up-cero">' + txt + "</span>" : txt;
}

/** Precio en euros: 148,92 → "148,92 €" */
function campo_up_precio(fila) {
  return escapar_up(formato_precio_euros(fila[3]));
}

function numero_up(v) {
  var n = Number(String(v == null ? "" : v).replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

/* ================= PINTAR ================= */

/** HTML de todos los grupos: un panel con cabecera + tabla por grupo */
function pintar_upgrade(datos, caja) {
  if (!datos.grupos.length) {
    caja.innerHTML =
      '<div class="estado"><p class="estado-titulo">No hay datos en la pestaña Upgrade tool</p></div>';
    return;
  }

  var html = "";
  for (var i = 0; i < datos.grupos.length; i++) {
    html += html_grupo_upgrade(datos.grupos[i]);
  }
  caja.innerHTML = html;
}

function html_grupo_upgrade(grupo) {
  var filas = grupo.filas || [];
  var n = filas.length;
  var unidades = 0;
  var c, r;

  var cab = "";
  for (c = 0; c < UP_COLUMNAS.length; c++) {
    cab += '<th class="' + UP_COLUMNAS[c].clase + '">' + UP_COLUMNAS[c].etiqueta + "</th>";
  }

  var cuerpo = "";
  for (r = 0; r < n; r++) {
    var fila = filas[r];
    unidades += numero_up(fila[2]);
    cuerpo +=
      "<tr>" +
      '<td class="up-c-grupo">' + campo_up_grupo(fila) + "</td>" +
      '<td class="up-c-modelo">' + campo_up_modelo(fila) + "</td>" +
      '<td class="up-c-cant c-num">' + campo_up_cantidad(fila) + "</td>" +
      '<td class="up-c-precio c-num">' + campo_up_precio(fila) + "</td>" +
      "</tr>";
  }

  return (
    '<section class="up-grupo" aria-label="' + escapar_up(grupo.nombre) + '">' +
    '<header class="up-grupo-cab">' +
    '<h2 class="up-grupo-titulo">' + escapar_up(grupo.nombre) + "</h2>" +
    '<span class="up-grupo-info"><strong>' + n + "</strong> " + (n === 1 ? "modelo" : "modelos") +
    " · <strong>" + unidades.toLocaleString("es-ES") + "</strong> uds</span>" +
    "</header>" +
    '<div class="up-tabla-caja"><table class="up-tabla">' +
    "<thead><tr>" + cab + "</tr></thead>" +
    "<tbody>" + cuerpo + "</tbody>" +
    "</table></div>" +
    "</section>"
  );
}

/* ================= AYUDAS ================= */

function escapar_up(t) {
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
