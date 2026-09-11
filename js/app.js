/**
 * ==========================================================================
 * ¿IMAGEN O CONTEXTO? — Lógica de Participación del Estudiante
 * Basado en 'Ante el dolor de los demás' de Susan Sontag
 * ==========================================================================
 */

// ==========================================
// 1. CONFIGURACIÓN DE CONEXIÓN Y SERVIDOR API
// ==========================================
// La URL de la API se gestiona desde js/config.js
// Para publicar en producción, edita SOLO ese archivo.
const API_URL = APP_CONFIG.API_URL;

// ==========================================
// 2. CONFIGURACIÓN DE IMÁGENES HISTÓRICAS
// Puedes usar rutas relativas en la carpeta 'images/' o URLs públicas de Wikimedia
// ==========================================
const IMAGE_1_URL = "images/photo1.jfif"; // David Seymour (Extremadura, mayo 1936)
const IMAGE_2_URL = "images/photo2.jfif"; // Migrant Mother (Dorothea Lange, 1936)
const IMAGE_3_URL = "images/photo3.jfif"; // Guerra Civil Española (Civiles en conflicto)

// ==========================================
// 3. PREGUNTAS Y CONTENIDO ACADÉMICO
// ==========================================
const QUESTIONS = [
  {
    id: 1,
    imageUrl: IMAGE_1_URL,
    sourceText: "Fotografía: David Seymour (Chim), Extremadura, España (1936). Colección histórica.",
    prompt: "¿Qué está ocurriendo realmente en esta fotografía?",
    options: {
      A: "La mujer está preocupada porque está buscando refugio durante un ataque aéreo.",
      B: "La fotografía fue tomada durante una reunión política antes de que comenzara la guerra."
    },
    // Explicación para la pantalla final (basada en el libro de Susan Sontag)
    explanation: "La respuesta correcta es B. La fotografía puede llevarnos a interpretar que la mujer está buscando aviones o refugio, pero el contexto real cambia su significado. Sontag utiliza este ejemplo para mostrar que una fotografía no siempre tiene un significado evidente por sí sola."
  },
  {
    id: 2,
    imageUrl: IMAGE_2_URL,
    sourceText: "Fotografía histórica documental (1936). Archivo público.",
    prompt: "¿Cuál de estos contextos corresponde a la fotografía?",
    options: {
      A: "Una madre y sus hijos se encuentran en una situación de pobreza durante la Gran Depresión en Estados Unidos.",
      B: "Una familia de refugiados acaba de escapar de una ciudad destruida durante una guerra."
    },
    explanation: "La respuesta correcta es A. La imagen puede parecer compatible con diferentes situaciones de sufrimiento. Sin embargo, conocer el contexto histórico permite interpretarla de una manera diferente. Esto se relaciona con la idea de Sontag de que las fotografías no funcionan completamente aisladas de las palabras, los conocimientos y el contexto que las rodea."
  },
  {
    id: 3,
    imageUrl: IMAGE_3_URL,
    sourceText: "Archivo histórico documental: Guerra Civil Española.",
    prompt: "¿Cuál es el contexto histórico correcto?",
    options: {
      A: "La fotografía muestra las consecuencias de un conflicto armado sobre la población civil.",
      B: "La fotografía muestra una escena preparada para una película y no corresponde a un acontecimiento real."
    },
    explanation: "La respuesta correcta es A. Esta fotografía documenta el impacto real del conflicto sobre la población civil. Sin embargo, ante la ausencia de información fidedigna, una fotografía puede ser objeto de sospecha o interpretarse erróneamente como una escenificación ficticia."
  }
];

// ==========================================
// 4. ESTADO DE LA APLICACIÓN
// ==========================================
let currentQuestionIndex = 0;
let participantId = "";
let questionStartTime = null;
let userAnswers = []; // Guarda las respuestas del participante para la pantalla final

// ==========================================
// 5. INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initParticipantId();
  bindEvents();
});

function initParticipantId() {
  // Generar un identificador anónimo tipo 'P-8F42A1' sin requerir ningún dato personal
  participantId = sessionStorage.getItem("sontag_participant_id");
  if (!participantId) {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    participantId = `P-${randomHex}`;
    sessionStorage.setItem("sontag_participant_id", participantId);
  }
  const badgeEl = document.getElementById("userBadge");
  if (badgeEl) badgeEl.textContent = `ID: ${participantId}`;
}

function bindEvents() {
  const btnStart = document.getElementById("btnStart");
  if (btnStart) {
    btnStart.addEventListener("click", startQuiz);
  }

  const btnOptionA = document.getElementById("btnOptionA");
  const btnOptionB = document.getElementById("btnOptionB");

  if (btnOptionA) {
    btnOptionA.addEventListener("click", () => handleSelectOption("A"));
  }
  if (btnOptionB) {
    btnOptionB.addEventListener("click", () => handleSelectOption("B"));
  }

  const btnRestart = document.getElementById("btnRestart");
  if (btnRestart) {
    btnRestart.addEventListener("click", restartQuiz);
  }
}

// ==========================================
// 6. FLUJO DEL CUESTIONARIO
// ==========================================
function startQuiz() {
  currentQuestionIndex = 0;
  userAnswers = [];
  showScreen("screenQuestion");
  loadQuestion(currentQuestionIndex);
}

function loadQuestion(index) {
  const q = QUESTIONS[index];
  if (!q) {
    finishQuiz();
    return;
  }

  // Actualizar indicadores de progreso
  const stepPill = document.getElementById("questionStepPill");
  const barFill = document.getElementById("progressBarFill");
  if (stepPill) stepPill.textContent = `Pregunta ${index + 1} de ${QUESTIONS.length}`;
  if (barFill) {
    const pct = ((index + 1) / QUESTIONS.length) * 100;
    barFill.style.width = `${pct}%`;
  }

  // Cargar imagen con soporte de fallback
  const imgEl = document.getElementById("questionImage");
  if (imgEl) {
    imgEl.src = q.imageUrl;
    imgEl.onerror = () => {
      // Si la imagen local falla, intentar imagen alternativa
      if (q.id === 2) {
        imgEl.src = "https://upload.wikimedia.org/wikipedia/commons/5/54/Lange-MigrantMother02.jpg";
      }
    };
  }

  const sourceEl = document.getElementById("photoSource");
  if (sourceEl) sourceEl.textContent = q.sourceText;

  const promptEl = document.getElementById("questionPrompt");
  if (promptEl) promptEl.textContent = q.prompt;

  const textA = document.getElementById("textOptionA");
  const textB = document.getElementById("textOptionB");
  if (textA) textA.textContent = q.options.A;
  if (textB) textB.textContent = q.options.B;

  // Restaurar botones
  const btnA = document.getElementById("btnOptionA");
  const btnB = document.getElementById("btnOptionB");
  [btnA, btnB].forEach(btn => {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("selected");
    }
  });

  // Iniciar cronómetro de tiempo de respuesta
  questionStartTime = Date.now();
}

async function handleSelectOption(selectedOption) {
  const q = QUESTIONS[currentQuestionIndex];
  if (!q) return;

  // Calcular tiempo de respuesta en segundos
  const responseTimeSec = questionStartTime ? ((Date.now() - questionStartTime) / 1000) : 0;

  // Deshabilitar botones para evitar múltiples clics
  const btnA = document.getElementById("btnOptionA");
  const btnB = document.getElementById("btnOptionB");
  [btnA, btnB].forEach(btn => {
    if (btn) btn.disabled = true;
  });

  const selectedBtn = selectedOption === "A" ? btnA : btnB;
  if (selectedBtn) selectedBtn.classList.add("selected");

  // Mostrar mensaje flotante breve "Respuesta registrada"
  showToastFeedback("Respuesta registrada");

  // Enviar respuesta a la API de forma asíncrona
  let serverResult = null;
  try {
    serverResult = await sendResponseToApi({
      participant_id: participantId,
      question: q.id,
      answer: selectedOption,
      response_time: Math.round(responseTimeSec * 10) / 10
    });
  } catch (err) {
    console.warn("No se pudo conectar con la API, se usará evaluación local de contingencia:", err);
  }

  // Determinar si acertó (según respuesta del servidor o evaluación de contingencia)
  const isCorrect = (serverResult && typeof serverResult.correct === "boolean")
    ? serverResult.correct
    : (q.id === 1 ? selectedOption === "B" : selectedOption === "A");

  // Guardar en el historial local del participante
  userAnswers.push({
    questionId: q.id,
    selectedOption: selectedOption,
    isCorrect: isCorrect,
    prompt: q.prompt,
    explanation: q.explanation,
    imageUrl: q.imageUrl,
    userOptionText: q.options[selectedOption]
  });

  // Pausa breve para feedback visual antes de pasar a la siguiente
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < QUESTIONS.length) {
      loadQuestion(currentQuestionIndex);
    } else {
      finishQuiz();
    }
  }, 650);
}

// ==========================================
// 7. ENVÍO A LA API
// ==========================================
async function sendResponseToApi(payload) {
  const url = `${API_URL}/api/responses`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Error en la API: ${response.status}`);
  }
  return await response.json();
}

// ==========================================
// 8. PANTALLA FINAL Y RESULTADOS
// ==========================================
function finishQuiz() {
  showScreen("screenResult");

  const totalQuestions = QUESTIONS.length;
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const scoreNumberEl = document.getElementById("scoreNumber");
  const pctEl = document.getElementById("resultPercentage");

  if (scoreNumberEl) scoreNumberEl.textContent = correctCount;
  if (pctEl) pctEl.textContent = `Porcentaje de aciertos: ${percentage}%`;

  // Renderizar tarjetas de análisis con las explicaciones del libro
  renderReviewCards();
}

function renderReviewCards() {
  const container = document.getElementById("reviewCardsContainer");
  if (!container) return;

  container.innerHTML = "";

  userAnswers.forEach((ans, idx) => {
    const card = document.createElement("div");
    card.className = "review-card";

    const statusBadgeClass = ans.isCorrect ? "correct" : "incorrect";
    const statusText = ans.isCorrect ? "✓ Acertaste" : "✗ Opción seleccionada: " + ans.selectedOption;

    card.innerHTML = `
      <img src="${ans.imageUrl}" alt="Fotografía ${idx + 1}" class="review-thumb">
      <div class="review-content">
        <div class="review-q-title">Fotografía ${idx + 1}: ${ans.prompt}</div>
        <span class="review-status ${statusBadgeClass}">${statusText}</span>
        <div class="review-explanation">
          ${ans.explanation}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function restartQuiz() {
  // Generar un nuevo ID para permitir que el estudiante vuelva a participar si se desea
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
  participantId = `P-${randomHex}`;
  sessionStorage.setItem("sontag_participant_id", participantId);
  const badgeEl = document.getElementById("userBadge");
  if (badgeEl) badgeEl.textContent = `ID: ${participantId}`;

  startQuiz();
}

// ==========================================
// 9. UTILIDADES DE INTERFAZ
// ==========================================
function showScreen(screenId) {
  const screens = ["screenWelcome", "screenQuestion", "screenResult"];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === screenId) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    }
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToastFeedback(msg) {
  const toast = document.getElementById("toastFeedback");
  if (!toast) return;

  const span = toast.querySelector("span");
  if (span) span.textContent = msg;

  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 1200);
}
