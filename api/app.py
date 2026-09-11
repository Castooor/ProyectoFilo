"""
API REST para '¿Imagen o contexto?' (Susan Sontag)
Permite registrar respuestas anónimas y consultar estadísticas agregadas en tiempo real.
"""

import os
import sys
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Agregar la ruta de api para importar database
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import init_db, save_response, get_statistics, reset_db

# Determinar la carpeta raíz del proyecto (un nivel arriba de /api)
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

app = Flask(__name__, static_folder=ROOT_DIR)
# Permitir peticiones CORS desde cualquier origen (necesario para GitHub Pages)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Clave de respuestas correctas (determinada en el servidor por seguridad)
CORRECT_ANSWERS = {
    1: "B",
    2: "A",
    3: "A"
}

# Inicializar base de datos al arrancar
with app.app_context():
    init_db()

@app.route("/api/health", methods=["GET"])
def health_check():
    """Verificación de estado de la API."""
    return jsonify({"status": "ok", "app": "Imagen o contexto", "author": "Susan Sontag Project"}), 200

@app.route("/api/responses", methods=["POST"])
def register_response():
    """
    Registra la respuesta de un estudiante.
    El servidor evalúa si la respuesta es correcta para evitar alteraciones en el cliente.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No se recibieron datos JSON válidos"}), 400

    participant_id = data.get("participant_id")
    question = data.get("question")
    answer = data.get("answer")
    response_time = data.get("response_time", 0.0)

    # Validaciones básicas
    if not participant_id or not isinstance(participant_id, str):
        return jsonify({"error": "participant_id es requerido"}), 400

    try:
        question = int(question)
    except (ValueError, TypeError):
        return jsonify({"error": "question debe ser un número entero (1, 2 o 3)"}), 400

    if question not in CORRECT_ANSWERS:
        return jsonify({"error": f"Pregunta inválida: {question}"}), 400

    if not answer or str(answer).strip().upper() not in ["A", "B"]:
        return jsonify({"error": "answer debe ser 'A' o 'B'"}), 400

    clean_answer = str(answer).strip().upper()
    try:
        response_time = float(response_time)
    except (ValueError, TypeError):
        response_time = 0.0

    # Evaluación de corrección en el servidor
    expected_answer = CORRECT_ANSWERS[question]
    is_correct = (clean_answer == expected_answer)

    # Guardar en base de datos
    try:
        save_response(participant_id, question, clean_answer, is_correct, response_time)
    except Exception as e:
        return jsonify({"error": f"Error al guardar respuesta: {str(e)}"}), 500

    return jsonify({
        "status": "ok",
        "message": "Respuesta registrada",
        "question": question,
        "correct": is_correct
    }), 201

@app.route("/api/results", methods=["GET"])
def get_results():
    """Devuelve las estadísticas acumuladas para la pantalla del expositor."""
    try:
        stats = get_statistics()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener estadísticas: {str(e)}"}), 500

@app.route("/api/admin/reset", methods=["POST"])
def admin_reset():
    """Permite al expositor limpiar las respuestas antes de la clase."""
    try:
        reset_db()
        return jsonify({"status": "ok", "message": "Todas las respuestas han sido eliminadas"}), 200
    except Exception as e:
        return jsonify({"error": f"Error al resetear base de datos: {str(e)}"}), 500

# ==========================================
# RUTAS DE SERVICIO WEB (LOCAL Y PRESENTACIÓN)
# ==========================================

@app.route("/")
def serve_index():
    """Sirve la pantalla principal de los estudiantes."""
    return send_from_directory(ROOT_DIR, "index.html")

@app.route("/admin")
def serve_admin():
    """Sirve la pantalla del expositor."""
    return send_from_directory(ROOT_DIR, "admin.html")

@app.route("/<path:path>")
def serve_static_files(path):
    """Sirve archivos estáticos (css, js, images)."""
    return send_from_directory(ROOT_DIR, path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n==========================================")
    print(f" Servidor iniciado en http://localhost:{port}")
    print(f" Estudiantes: http://localhost:{port}/")
    print(f" Expositor:   http://localhost:{port}/admin")
    print(f"==========================================\n")
    app.run(host="0.0.0.0", port=port, debug=True)
