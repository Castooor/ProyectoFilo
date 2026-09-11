"""
Módulo de Base de Datos para '¿Imagen o contexto?'
Soporta SQLite para desarrollo local y PostgreSQL para despliegues en producción (Render) mediante DATABASE_URL.
"""

import os
import sqlite3
from datetime import datetime

DATABASE_URL = os.environ.get("DATABASE_URL")
LOCAL_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "responses.db")

def get_db_connection():
    """Retorna una conexión a la base de datos (SQLite o PostgreSQL si está configurado)."""
    if DATABASE_URL and DATABASE_URL.startswith("postgres"):
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            # Render a veces proporciona URLs con 'postgres://', corregir a 'postgresql://' si es necesario
            url = DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            conn = psycopg2.connect(url, cursor_factory=RealDictCursor)
            return conn, "postgres"
        except ImportError:
            print("[ADVERTENCIA] psycopg2 no está instalado. Usando SQLite local.")
        except Exception as e:
            print(f"[ERROR] No se pudo conectar a PostgreSQL ({e}). Usando SQLite local.")
    
    conn = sqlite3.connect(LOCAL_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn, "sqlite"

def init_db():
    """Inicializa las tablas necesarias en la base de datos."""
    conn, engine = get_db_connection()
    try:
        cur = conn.cursor()
        if engine == "postgres":
            cur.execute("""
                CREATE TABLE IF NOT EXISTS responses (
                    id SERIAL PRIMARY KEY,
                    participant_id VARCHAR(64) NOT NULL,
                    question INTEGER NOT NULL,
                    answer VARCHAR(4) NOT NULL,
                    is_correct BOOLEAN NOT NULL,
                    response_time REAL NOT NULL DEFAULT 0.0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
        else:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS responses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    participant_id TEXT NOT NULL,
                    question INTEGER NOT NULL,
                    answer TEXT NOT NULL,
                    is_correct INTEGER NOT NULL,
                    response_time REAL NOT NULL DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        conn.commit()
    finally:
        conn.close()

def save_response(participant_id: str, question: int, answer: str, is_correct: bool, response_time: float):
    """Registra la respuesta anónima de un participante."""
    conn, engine = get_db_connection()
    try:
        cur = conn.cursor()
        correct_val = is_correct if engine == "postgres" else (1 if is_correct else 0)
        
        if engine == "postgres":
            cur.execute("""
                INSERT INTO responses (participant_id, question, answer, is_correct, response_time)
                VALUES (%s, %s, %s, %s, %s)
            """, (participant_id, question, answer, correct_val, response_time))
        else:
            cur.execute("""
                INSERT INTO responses (participant_id, question, answer, is_correct, response_time)
                VALUES (?, ?, ?, ?, ?)
            """, (participant_id, question, answer, correct_val, response_time))
        conn.commit()
    finally:
        conn.close()

def get_statistics():
    """
    Calcula y devuelve las estadísticas agregadas de la actividad:
    - Total de participantes únicos
    - Total de respuestas
    - Desglose por pregunta: votos A, votos B, total aciertos y porcentajes
    """
    conn, engine = get_db_connection()
    stats = {
        "participants": 0,
        "total_responses": 0,
        "questions": {
            "1": {"A": 0, "B": 0, "total": 0, "correct": 0, "pct_A": 0.0, "pct_B": 0.0, "pct_correct": 0.0},
            "2": {"A": 0, "B": 0, "total": 0, "correct": 0, "pct_A": 0.0, "pct_B": 0.0, "pct_correct": 0.0},
            "3": {"A": 0, "B": 0, "total": 0, "correct": 0, "pct_A": 0.0, "pct_B": 0.0, "pct_correct": 0.0}
        }
    }
    
    try:
        cur = conn.cursor()
        
        # Participantes únicos
        cur.execute("SELECT COUNT(DISTINCT participant_id) as total_participants FROM responses;")
        row = cur.fetchone()
        if row:
            stats["participants"] = row[0] if isinstance(row, tuple) else row["total_participants"]
            
        # Total respuestas
        cur.execute("SELECT COUNT(*) as total_count FROM responses;")
        row = cur.fetchone()
        if row:
            stats["total_responses"] = row[0] if isinstance(row, tuple) else row["total_count"]
            
        # Conteo agrupado por pregunta, respuesta e is_correct
        cur.execute("""
            SELECT question, answer, is_correct, COUNT(*) as cnt
            FROM responses
            GROUP BY question, answer, is_correct;
        """)
        rows = cur.fetchall()
        for r in rows:
            q = str(r[0] if isinstance(r, tuple) else r["question"])
            ans = (r[1] if isinstance(r, tuple) else r["answer"]).strip().upper()
            corr = bool(r[2] if isinstance(r, tuple) else r["is_correct"])
            cnt = int(r[3] if isinstance(r, tuple) else r["cnt"])
            
            if q in stats["questions"]:
                if ans in ["A", "B"]:
                    stats["questions"][q][ans] += cnt
                stats["questions"][q]["total"] += cnt
                if corr:
                    stats["questions"][q]["correct"] += cnt
                    
        # Calcular porcentajes
        for q_id, q_data in stats["questions"].items():
            tot = q_data["total"]
            if tot > 0:
                q_data["pct_A"] = round((q_data["A"] / tot) * 100, 1)
                q_data["pct_B"] = round((q_data["B"] / tot) * 100, 1)
                q_data["pct_correct"] = round((q_data["correct"] / tot) * 100, 1)
                
    finally:
        conn.close()
        
    return stats

def reset_db():
    """Elimina todas las respuestas registradas (útil para reiniciar antes de la clase)."""
    conn, _ = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM responses;")
        conn.commit()
    finally:
        conn.close()
