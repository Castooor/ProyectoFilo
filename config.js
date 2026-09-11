/**
 * ============================================================
 * CONFIGURACIÓN DE DESPLIEGUE — ¿Imagen o contexto?
 * ============================================================
 *
 * Este es el ÚNICO archivo que debes modificar al publicar la API.
 *
 * ► PASOS:
 *   1. Publica la API en Render (ver README.md, Sección 5)
 *   2. Copia la URL que Render te asigna (ej: https://mi-api.onrender.com)
 *   3. Reemplaza el valor de API_URL_PRODUCCION abajo con tu URL real
 *   4. Sube los cambios a GitHub → GitHub Pages se actualizará sólo
 *
 * ============================================================
 */

const APP_CONFIG = (() => {
  // ── URL de la API en producción (Render) ─────────────────────────
  // Reemplaza esta cadena con la URL real que Render te asignó:
  const API_URL_PRODUCCION = "https://proyectofilo-1.onrender.com/";

  // ─────────────────────────────────────────────────────────────────

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const apiUrl = isLocal ? "http://localhost:5000" : API_URL_PRODUCCION;

  return {
    API_URL: apiUrl,
    IS_LOCAL: isLocal,
    VERSION: "1.0.0"
  };
})();
