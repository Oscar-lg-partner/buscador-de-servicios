/**
 * LOGIN
 *
 * Recibe usuario y contraseña.
 * Devuelve:
 *   - ok: true  + token (para pedir luego la lista)
 *   - ok: false + error (mensaje claro)
 */

function Login(user, pass) {
  user = textoLimpio(user);
  pass = String(pass || "");

  if (!user) {
    return { ok: false, error: "Falta el usuario" };
  }
  if (!pass) {
    return { ok: false, error: "Falta la contraseña" };
  }

  if (!usuarioCorrecto(user, pass)) {
    return { ok: false, error: "Usuario o contraseña incorrectos" };
  }

  // Si entra bien, le damos un token para poder pedir sendAllData
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put("session_" + token, user, 21600);

  return { ok: true, token: token };
}

function usuarioCorrecto(user, pass) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("users");

  if (hoja) {
    var filas = hoja.getDataRange().getValues();
    for (var i = 1; i < filas.length; i++) {
      if (textoLimpio(filas[i][0]) === user && String(filas[i][1] || "") === pass) {
        return true;
      }
    }
  }

  // Prueba temporal
  if (user === "adnin" && pass === "12334") {
    return true;
  }

  return false;
}

function sesionValida(token) {
  if (!token) return false;
  return !!CacheService.getScriptCache().get("session_" + token);
}
