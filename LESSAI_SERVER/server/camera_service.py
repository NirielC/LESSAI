import threading
import time

import cv2

from config import ESP32_STREAM_URL, RECONNECT_DELAY


class CameraService:

    def __init__(self):
        self.stream_url = ESP32_STREAM_URL

        self._cap = None
        self._latest_frame = None

        self._lock = threading.Lock()
        self._running = False
        self._thread = None

        self._online = False

    # ========================================================
    # INICIAR
    # ========================================================

    def start(self):
        if self._running:
            return

        self._running = True

        self._thread = threading.Thread(
            target=self._capture_loop,
            name="ESP32-Camera",
            daemon=True,
        )

        self._thread.start()

        print("[CAMERA] Servicio iniciado.")

    # ========================================================
    # DETENER
    # ========================================================

    def stop(self):
        self._running = False

        if self._cap is not None:
            self._cap.release()
            self._cap = None

        if self._thread is not None:
            self._thread.join(timeout=2)

        self._thread = None

        print("[CAMERA] Servicio detenido.")

    # ========================================================
    # ESTADO
    # ========================================================

    @property
    def online(self):
        return self._online

    # ========================================================
    # FRAME MÁS RECIENTE
    # ========================================================

    def get_latest_frame(self):
        with self._lock:

            if self._latest_frame is None:
                return None

            return self._latest_frame.copy()

    # ========================================================
    # LOOP DE CAPTURA
    # ========================================================

    def _capture_loop(self):

        while self._running:

            print(
                f"[CAMERA] Conectando a {self.stream_url}..."
            )

            cap = cv2.VideoCapture(self.stream_url)

            self._cap = cap

            if not cap.isOpened():

                print(
                    "[CAMERA] No se pudo conectar con el ESP32."
                )

                self._online = False

                cap.release()
                self._cap = None

                time.sleep(RECONNECT_DELAY)

                continue

            print("[CAMERA] ESP32 conectado.")

            self._online = True

            while self._running:

                ok, frame = cap.read()

                if not ok:

                    print(
                        "[CAMERA] Stream perdido."
                    )

                    break

                # =================================================
                # SOLO CONSERVAMOS EL FRAME MÁS RECIENTE
                # =================================================

                with self._lock:
                    self._latest_frame = frame

            self._online = False

            cap.release()
            self._cap = None

            if self._running:
                time.sleep(RECONNECT_DELAY)

        self._online = False
        