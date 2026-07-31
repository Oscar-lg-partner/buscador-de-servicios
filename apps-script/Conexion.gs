/**
 * CONEXIÓN
 * Google necesita doGet para la URL /exec.
 * Solo reenvía a Login o sendAllData.
 */

function doGet(e) {
  var p = e.parameter || {};
  var que = p.action || "";
  var salida;

  if (que === "Login") {
    salida = Login(p.user, p.pass);
  } else if (que === "sendAllData") {
    salida = sendAllData(p.token);
  } else {
    salida = { ok: false, error: "Pedido desconocido" };
  }

  return enviarAlNavegador(salida, p.callback);
}

/* ---- ayudas (al final, fáciles de ver) ---- */

function textoLimpio(valor) {
  return String(valor || "").trim();
}

function enviarAlNavegador(datos, callback) {
  var texto = JSON.stringify(datos);
  var nombre = String(callback || "").replace(/[^\w.$]/g, "");

  if (nombre) {
    return ContentService.createTextOutput(nombre + "(" + texto + ")").setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }

  return ContentService.createTextOutput(texto).setMimeType(
    ContentService.MimeType.JSON
  );
}
