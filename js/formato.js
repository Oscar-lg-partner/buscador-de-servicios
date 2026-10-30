/**
 * FORMATO
 * Ayudas de formato compartidas entre páginas (devuelven texto SIN escapar).
 */

/**
 * Formato euros:
 *   1.667 / 1.059 (miles mal leídos) → "1.667 €"
 *   39.99 / "39,99"                   → "39,99 €"
 */
function formato_precio_euros(bruto) {
  if (bruto === null || bruto === undefined || bruto === "") return "";
  var n = parse_precio_numero(bruto);
  if (isNaN(n)) return String(bruto).trim();

  /* Céntimos reales (1–2 decimales): 39,99 € */
  if (precio_trae_centimos(bruto)) {
    var fijo = Math.abs(n).toFixed(2).split(".");
    var parteEntera = fijo[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    var signo = n < 0 ? "-" : "";
    return signo + parteEntera + "," + fijo[1] + " €";
  }

  /* Entero + miles con punto */
  var entero = String(Math.round(n));
  var conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return conMiles + " €";
}

/** true solo si el bruto trae 1–2 decimales (céntimos), no 3 (miles / ruido) */
function precio_trae_centimos(bruto) {
  var s;
  if (typeof bruto === "number" && isFinite(bruto)) {
    if (Math.abs(bruto - Math.round(bruto)) < 1e-9) return false;
    s = String(bruto);
    if (/e/i.test(s)) return false;
  } else {
    s = String(bruto).trim().replace(/\s/g, "").replace(/€/g, "");
  }
  var lastComma = s.lastIndexOf(",");
  var lastDot = s.lastIndexOf(".");
  var sepAt = Math.max(lastComma, lastDot);
  if (sepAt < 0) return false;
  var cola = s.slice(sepAt + 1).replace(/[^\d]/g, "");
  return cola.length === 1 || cola.length === 2;
}

function parse_precio_numero(bruto) {
  if (typeof bruto === "number" && isFinite(bruto)) {
    if (Math.abs(bruto - Math.round(bruto)) < 1e-9) return Math.round(bruto);
    /*
     * Solo X.YYY con |X| < 10 → miles mal leídos (1.667 → 1667).
     * NUNCA 1667.115 → eso ya es ~1667 €.
     */
    var textoNum = String(bruto);
    if (/e/i.test(textoNum)) {
      textoNum = bruto.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    }
    var punto = textoNum.indexOf(".");
    if (punto >= 0) {
      var dec = textoNum.slice(punto + 1);
      if (/^\d{3}$/.test(dec) && Math.abs(bruto) < 10) {
        return Math.round(bruto * 1000);
      }
    }
    return bruto;
  }

  var s = String(bruto).trim().replace(/\s/g, "").replace(/€/g, "");
  if (!s) return NaN;

  var lastComma = s.lastIndexOf(",");
  var lastDot = s.lastIndexOf(".");

  /* Ambos: el último es decimal (1.059,50 o 1,059.50) */
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
    return parse_precio_numero(Number(s));
  }

  /* Solo coma o solo punto */
  if (lastComma >= 0 || lastDot >= 0) {
    var sep = lastComma >= 0 ? "," : ".";
    var parts = s.split(sep);
    var cola = parts[parts.length - 1];
    var izquierda = parts[0].replace(/[^\d-]/g, "");

    /* 3 dígitos y parte entera corta → miles: 1.667 / 1,059 */
    if (
      /^\d{3}$/.test(cola) &&
      parts.length === 2 &&
      izquierda.replace("-", "").length <= 3
    ) {
      return Number(izquierda + cola);
    }
    /* Varios grupos de miles: 1.234.567 */
    if (/^\d{3}$/.test(cola) && parts.length > 2) {
      return Number(parts.join(""));
    }
    /* 1–2 dígitos → céntimos: 39,99 */
    if (parts.length === 2 && /^\d{1,2}$/.test(cola)) {
      return Number(izquierda + "." + cola);
    }
    /* 1667.115 → decimal real */
    if (parts.length === 2 && /^\d+$/.test(cola)) {
      return Number(izquierda + "." + cola);
    }
    return Number(s.replace(/[.,]/g, ""));
  }

  return Number(s);
}
