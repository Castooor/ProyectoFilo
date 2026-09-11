/**
 * ==========================================================================
 * ¿IMAGEN O CONTEXTO? — Lógica del Panel de Expositor (Admin)
 * Consulta en tiempo real de estadísticas y gráficos de respuestas
 * ==========================================================================
 */

// ==========================================
// 1. CONFIGURACIÓN DE CONEXIÓN
// ==========================================
// La URL de la API se gestiona desde js/config.js
// Para publicar en producción, edita SOLO ese archivo.
const API_URL = APP_CONFIG.API_URL;

const POLLING_INTERVAL_MS = 3000; // Sondeo cada 3 segundos durante la clase
let pollingTimer = null;
let isPollingActive = true;

// ==========================================
// 2. INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  bindAdminEvents();
  fetchStatistics();
  startLivePolling();
});

function bindAdminEvents() {
  const btnRefresh = document.getElementById("btnRefreshNow");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      fetchStatistics();
      flashRefreshFeedback();
    });
  }

  const btnReset = document.getElementById("btnResetSession");
  if (btnReset) {
    btnReset.addEventListener("click", handleResetSession);
  }

  const liveBadge = document.getElementById("liveBadge");
  if (liveBadge) {
    liveBadge.addEventListener("click", togglePolling);
    liveBadge.style.cursor = "pointer";
  }
}

// ==========================================
// 3. CONSULTA DE ESTADÍSTICAS A LA API
// ==========================================
async function fetchStatistics() {
  try {
    const response = await fetch(`${API_URL}/api/results`);
    if (!response.ok) {
      throw new Error(`Error en servidor: ${response.status}`);
    }
    const data = await response.json();
    updateDashboardUI(data);
    setConnectionStatus(true);
  } catch (err) {
    console.error("Error al consultar estadísticas:", err);
    setConnectionStatus(false);
  }
}

// ==========================================
// 4. ACTUALIZACIÓN VISUAL DEL DASHBOARD
// ==========================================
function updateDashboardUI(data) {
  // 1. Métricas superiores
  const participantsEl = document.getElementById("statTotalParticipants");
  const responsesEl = document.getElementById("statTotalResponses");
  const globalAccEl = document.getElementById("statGlobalAccuracy");

  const participants = data.participants || 0;
  const totalResponses = data.total_responses || 0;

  if (participantsEl) participantsEl.textContent = participants;
  if (responsesEl) responsesEl.textContent = totalResponses;

  // Calcular acierto global
  let totalCorrect = 0;
  const questions = data.questions || {};
  Object.values(questions).forEach(q => {
    totalCorrect += (q.correct || 0);
  });

  const globalPct = totalResponses > 0 ? Math.round((totalCorrect / totalResponses) * 100) : 0;
  if (globalAccEl) globalAccEl.textContent = `${globalPct}%`;

  // 2. Actualizar preguntas individuales
  updateQuestionStats(1, questions["1"]);
  updateQuestionStats(2, questions["2"]);
  updateQuestionStats(3, questions["3"]);
}

function updateQuestionStats(qNum, qData) {
  if (!qData) return;

  const total = qData.total || 0;
  const votesA = qData.A || 0;
  const votesB = qData.B || 0;
  const pctA = qData.pct_A || 0;
  const pctB = qData.pct_B || 0;
  const pctCorrect = qData.pct_correct || 0;

  // Etiquetas
  const labelA = document.getElementById(`labelQ${qNum}A`);
  const labelB = document.getElementById(`labelQ${qNum}B`);
  const pctCorrectEl = document.getElementById(`pctCorrectQ${qNum}`);

  if (labelA) labelA.textContent = `${pctA}% (${votesA} ${votesA === 1 ? 'voto' : 'votos'})`;
  if (labelB) labelB.textContent = `${pctB}% (${votesB} ${votesB === 1 ? 'voto' : 'votos'})`;
  if (pctCorrectEl) pctCorrectEl.textContent = `${pctCorrect}%`;

  // Barras animadas
  const barA = document.getElementById(`barQ${qNum}A`);
  const barB = document.getElementById(`barQ${qNum}B`);

  if (barA) {
    barA.style.width = `${pctA}%`;
    barA.textContent = pctA > 10 ? `${pctA}%` : "";
  }
  if (barB) {
    barB.style.width = `${pctB}%`;
    barB.textContent = pctB > 10 ? `${pctB}%` : "";
  }
}

// ==========================================
// 5. SONDEO EN TIEMPO REAL (POLLING)
// ==========================================
function startLivePolling() {
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = setInterval(fetchStatistics, POLLING_INTERVAL_MS);
}

function togglePolling() {
  isPollingActive = !isPollingActive;
  const statusText = document.getElementById("liveStatusText");
  const dot = document.querySelector(".live-dot");

  if (isPollingActive) {
    startLivePolling();
    if (statusText) statusText.textContent = "En vivo (cada 3s)";
    if (dot) dot.style.animationPlayState = "running";
  } else {
    clearInterval(pollingTimer);
    if (statusText) statusText.textContent = "Pausado (clic para reanudar)";
    if (dot) dot.style.animationPlayState = "paused";
  }
}

function setConnectionStatus(isConnected) {
  const badge = document.getElementById("liveBadge");
  const text = document.getElementById("liveStatusText");
  if (!badge || !text) return;

  if (isConnected) {
    badge.style.borderColor = "rgba(16, 185, 129, 0.3)";
    badge.style.color = "var(--accent-emerald)";
    if (isPollingActive) text.textContent = "En vivo (cada 3s)";
  } else {
    badge.style.borderColor = "rgba(244, 63, 94, 0.4)";
    badge.style.color = "var(--accent-rose)";
    text.textContent = "Desconectado de la API";
  }
}

function flashRefreshFeedback() {
  const btn = document.getElementById("btnRefreshNow");
  if (btn) {
    btn.style.transform = "scale(0.95)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 150);
  }
}

// ==========================================
// 6. REINICIO DE DATOS PARA LA EXPOSICIÓN
// ==========================================
async function handleResetSession() {
  const confirmed = confirm(
    "⚠️ ¿Deseas eliminar todas las respuestas acumuladas?\n\nEsta acción vaciará las estadísticas de la base de datos para comenzar una nueva exposición en clase."
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/api/admin/reset`, {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error(`Error en servidor: ${response.status}`);
    }
    alert("✓ Base de datos reiniciada con éxito. Lista para la nueva clase.");
    fetchStatistics();
  } catch (err) {
    alert("Error al intentar reiniciar las respuestas: " + err.message);
  }
}
