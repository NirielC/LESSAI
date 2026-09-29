from pathlib import Path


# ============================================================
# RUTAS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

SERVER_DIR = BASE_DIR / "server"
MODELS_DIR = BASE_DIR / "models"


# ============================================================
# ESP32-CAM
# ============================================================

ESP32_IP = "192.168.4.1"

ESP32_STREAM_URL = (
    f"http://{ESP32_IP}:81/stream"
)


# ============================================================
# SERVIDOR
# ============================================================

SERVER_HOST = "0.0.0.0"
SERVER_PORT = 8000

WEBSOCKET_PATH = "/app"


# ============================================================
# MODELO
# ============================================================

SEQUENCE_LENGTH = 30

KEYPOINTS_PER_FRAME = 1662

CONFIDENCE_THRESHOLD = 0.70

MAX_SENTENCE_LENGTH = 8


# ============================================================
# MEDIAPIPE
# ============================================================

MIN_DETECTION_CONFIDENCE = 0.5

MIN_TRACKING_CONFIDENCE = 0.5


# ============================================================
# PROCESAMIENTO
# ============================================================

PREDICTION_STRIDE = 5

RECONNECT_DELAY = 2.0


# ============================================================
# MODELO / ETIQUETAS
# ============================================================

MODEL_PATH_KERAS = (
    MODELS_DIR / "modelo_lessa_v2.keras"
)

MODEL_PATH_H5 = (
    MODELS_DIR / "modelo_lessa.h5"
)

LABELS_PATH = (
    MODELS_DIR / "labels.json"
)