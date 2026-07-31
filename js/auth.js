/**
 * Login y sesión del buscador.
 * La validación real la hace Apps Script (no el HTML).
 */

function guardarSesion(token, user) {
  sessionStorage.setItem(APP_CONFIG.sessionKey, token);
  sessionStorage.setItem(APP_CONFIG.sessionUserKey, user || "");
}

function obtenerToken() {
  return sessionStorage.getItem(APP_CONFIG.sessionKey) || "";
}

function obtenerUsuarioSesion() {
  return sessionStorage.getItem(APP_CONFIG.sessionUserKey) || "";
}

/** Cierra sesión y borra los datos guardados del navegador */
async function cerrarSesion() {
  sessionStorage.removeItem(APP_CONFIG.sessionKey);
  sessionStorage.removeItem(APP_CONFIG.sessionUserKey);
  if (typeof borrarDatosGuardados === "function") {
    await borrarDatosGuardados();
  }
}

function haySesion() {
  return Boolean(obtenerToken());
}

/** Si no hay sesión, manda al login */
function exigirSesion() {
  if (!haySesion()) {
    window.location.href = APP_CONFIG.routes.login;
    return false;
  }
  return true;
}

/**
 * Llama a Apps Script para validar user/pass.
 */
async function login(user, pass) {
  const data = await apiCall({
    action: "Login",
    user: String(user || "").trim(),
    pass: String(pass || ""),
  });

  if (data && data.ok && data.token) {
    guardarSesion(data.token, user);
  }

  return data;
}
