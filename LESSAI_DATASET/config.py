# config.py

from pathlib import Path

# ============================================================
# RUTAS
# ============================================================

ROOT_DIR = Path(__file__).resolve().parent

DATASET_DIR = ROOT_DIR / "dataset"
VIDEOS_DIR = DATASET_DIR / "videos"
SEQUENCES_DIR = DATASET_DIR / "sequences"
PROCESSED_DIR = DATASET_DIR / "processed"

MODELS_DIR = ROOT_DIR / "models"


# ============================================================
# CLASES
# ============================================================

CLASSES = [
    "hola",
    "como_estas",
    "estoy_bien",
    "estoy_mas_o_menos",
    "estoy_mal",
    "te_veo_el_proximo_lunes",
    "si_llegare_a_tiempo",
    "a_que_hora_es",
    "por_la_tarde",
    "ok_adios",
]

# ============================================================
# CAPTURA
# ============================================================

PERSONAS = 4

VIDEOS_POR_PERSONA = 100

FPS = 20

FRAMES_POR_VIDEO = 30

DURACION_VIDEO = FRAMES_POR_VIDEO / FPS

ANCHO = 640
ALTO = 480

COUNTDOWN_SEGUNDOS = 3


# ============================================================
# RANGOS DE PERSONAS
# ============================================================

def obtener_rango_persona(persona: int):

    inicio = ((persona - 1) * VIDEOS_POR_PERSONA) + 1
    fin = persona * VIDEOS_POR_PERSONA

    return inicio, fin


# ============================================================
# CREAR DIRECTORIOS
# ============================================================

def crear_directorios():

    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    SEQUENCES_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    for clase in CLASSES:
        (VIDEOS_DIR / clase).mkdir(parents=True, exist_ok=True)


if __name__ == "__main__":
    crear_directorios()

    print("Estructura creada correctamente.")