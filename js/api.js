/**
 * Comunicación con Google Apps Script (JSONP).
 * A veces Chrome falla con ERR_QUIC_PROTOCOL_ERROR:
 * reintentamos unas veces antes de rendirnos.
 */
function apiCall(payload) {
  return apiCallUnaVez(payload).catch(function (err1) {
    return esperar(800)
      .then(function () {
        return apiCallUnaVez(payload);
      })
      .catch(function (err2) {
        return esperar(1500).then(function () {
          return apiCallUnaVez(payload);
        });
      });
  });
}

function esperar(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function apiCallUnaVez(payload) {
  return new Promise(function (resolve, reject) {
    var callbackName =
      "_ffCb_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
    var timeoutId;
    var script = document.createElement("script");

    function limpiar() {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    window[callbackName] = function (data) {
      limpiar();
      resolve(data);
    };

    timeoutId = setTimeout(function () {
      limpiar();
      reject(new Error("Tiempo de espera agotado con Apps Script"));
    }, 180000);

    var params = Object.assign({}, payload, { callback: callbackName });
    var query = Object.keys(params)
      .map(function (key) {
        var value = params[key];
        if (value === undefined || value === null) value = "";
        return encodeURIComponent(key) + "=" + encodeURIComponent(String(value));
      })
      .join("&");

    script.src = APP_CONFIG.appsScriptUrl + "?" + query;
    script.onerror = function () {
      limpiar();
      reject(
        new Error(
          "No se pudo cargar Apps Script (red o respuesta muy grande). Reintenta."
        )
      );
    };

    document.head.appendChild(script);
  });
}
