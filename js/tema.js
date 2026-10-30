/**
 * TEMA claro / oscuro
 * Se carga en el <head> (antes de pintar) para que no parpadee en blanco.
 * - Guarda la elección en localStorage ("flatfee_tema": "claro" | "oscuro")
 * - Si no hay elección guardada (primera vez), tema claro
 * - Un botón con data-accion-tema="alternar" cambia entre los dos
 */

var CLAVE_TEMA = "flatfee_tema";

function tema_guardado() {
  try {
    return localStorage.getItem(CLAVE_TEMA) || "";
  } catch (e) {
    return "";
  }
}

function tema_actual() {
  var t = tema_guardado();
  if (t === "claro" || t === "oscuro") return t;
  return "claro";
}

function aplicar_tema(t) {
  document.documentElement.setAttribute("data-tema", t);
  var botones = document.querySelectorAll("[data-accion-tema]");
  for (var i = 0; i < botones.length; i++) {
    var oscuro = t === "oscuro";
    botones[i].setAttribute("aria-pressed", oscuro ? "true" : "false");
    botones[i].title = oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
    botones[i].innerHTML = oscuro
      ? '<i class="bi bi-sun" aria-hidden="true"></i>'
      : '<i class="bi bi-moon-stars" aria-hidden="true"></i>';
  }
}

function alternar_tema() {
  var nuevo = tema_actual() === "oscuro" ? "claro" : "oscuro";
  try {
    localStorage.setItem(CLAVE_TEMA, nuevo);
  } catch (e) {}
  aplicar_tema(nuevo);
}

/* Antes de pintar */
aplicar_tema(tema_actual());

document.addEventListener("DOMContentLoaded", function () {
  aplicar_tema(tema_actual());
  document.addEventListener("click", function (ev) {
    if (ev.target.closest && ev.target.closest("[data-accion-tema]")) alternar_tema();
  });
});
