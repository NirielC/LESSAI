import json
import threading
import time
from collections import deque

import cv2
import mediapipe as mp
import numpy as np
from tensorflow.keras.models import load_model

from config import (
    CONFIDENCE_THRESHOLD,
    KEYPOINTS_PER_FRAME,
    LABELS_PATH,
    MAX_SENTENCE_LENGTH,
    MIN_DETECTION_CONFIDENCE,
    MIN_TRACKING_CONFIDENCE,
    MODEL_PATH_H5,
    MODEL_PATH_KERAS,
    PREDICTION_STRIDE,
    SEQUENCE_LENGTH,
)


class ModelService:

    def __init__(self, camera_service, on_prediction=None):

        self.camera = camera_service
        self.on_prediction = on_prediction

        self.model = None
        self.labels = []

        self._running = False
        self._thread = None

        self._sentence = []
        self._last_sign = None

        self._sequence = deque(
            maxlen=SEQUENCE_LENGTH
        )

        self._frames_since_prediction = 0

        self._load_labels()
        self._load_model()

    # ========================================================
    # CARGAR ETIQUETAS
    # ========================================================

    def _load_labels(self):

        if not LABELS_PATH.exists():

            print(
                f"[MODEL] No existe: {LABELS_PATH}"
            )

            return

        with open(
            LABELS_PATH,
            "r",
            encoding="utf-8",
        ) as file:

            labels = json.load(file)

        if all(
            isinstance(value, int)
            for value in labels.values()
        ):

            self.labels = [
                name
                for name, index in sorted(
                    labels.items(),
                    key=lambda item: item[1],
                )
            ]

        elif all(
            str(key).isdigit()
            for key in labels.keys()
        ):

            self.labels = [
                labels[str(index)]
                for index in range(len(labels))
            ]

        else:

            raise ValueError(
                "Formato de labels.json no reconocido."
            )

        print(
            f"[MODEL] Etiquetas cargadas: "
            f"{self.labels}"
        )

    # ========================================================
    # CARGAR MODELO
    # ========================================================

    def _load_model(self):

        model_path = None

        if MODEL_PATH_KERAS.exists():

            model_path = MODEL_PATH_KERAS

        elif MODEL_PATH_H5.exists():

            model_path = MODEL_PATH_H5

        if model_path is None:

            print(
                "[MODEL] Modelo todavía no disponible."
            )

            return

        try:

            self.model = load_model(
                model_path
            )

            print(
                f"[MODEL] Modelo cargado: "
                f"{model_path}"
            )

        except Exception as error:

            print(
                f"[MODEL] Error cargando modelo: "
                f"{error}"
            )

    # ========================================================
    # ESTADO
    # ========================================================

    @property
    def available(self):

        return (
            self.model is not None
            and len(self.labels) > 0
        )

    # ========================================================
    # INICIAR
    # ========================================================

    def start(self):

        if self._running:
            return

        self._running = True

        self._thread = threading.Thread(
            target=self._recognition_loop,
            name="LESSAI-Recognition",
            daemon=True,
        )

        self._thread.start()

        print(
            "[MODEL] Servicio de reconocimiento iniciado."
        )

    # ========================================================
    # DETENER
    # ========================================================

    def stop(self):

        self._running = False

        if self._thread is not None:

            self._thread.join(
                timeout=2
            )

        self._thread = None

        print(
            "[MODEL] Servicio detenido."
        )

    # ========================================================
    # KEYPOINTS
    # ========================================================

    @staticmethod
    def extract_keypoints(results):

        pose = (
            np.array([
                [
                    landmark.x,
                    landmark.y,
                    landmark.z,
                    landmark.visibility,
                ]
                for landmark
                in results.pose_landmarks.landmark
            ]).flatten()
            if results.pose_landmarks
            else np.zeros(33 * 4)
        )

        face = (
            np.array([
                [
                    landmark.x,
                    landmark.y,
                    landmark.z,
                ]
                for landmark
                in results.face_landmarks.landmark
            ]).flatten()
            if results.face_landmarks
            else np.zeros(468 * 3)
        )

        left_hand = (
            np.array([
                [
                    landmark.x,
                    landmark.y,
                    landmark.z,
                ]
                for landmark
                in results.left_hand_landmarks.landmark
            ]).flatten()
            if results.left_hand_landmarks
            else np.zeros(21 * 3)
        )

        right_hand = (
            np.array([
                [
                    landmark.x,
                    landmark.y,
                    landmark.z,
                ]
                for landmark
                in results.right_hand_landmarks.landmark
            ]).flatten()
            if results.right_hand_landmarks
            else np.zeros(21 * 3)
        )

        keypoints = np.concatenate([
            pose,
            face,
            left_hand,
            right_hand,
        ])

        return keypoints.astype(
            np.float32
        )

    # ========================================================
    # RECONOCIMIENTO
    # ========================================================

    def _recognition_loop(self):

        holistic = mp.solutions.holistic

        with holistic.Holistic(
            min_detection_confidence=(
                MIN_DETECTION_CONFIDENCE
            ),
            min_tracking_confidence=(
                MIN_TRACKING_CONFIDENCE
            ),
        ) as processor:

            while self._running:

                frame = (
                    self.camera.get_latest_frame()
                )

                if frame is None:

                    time.sleep(0.01)
                    continue

                image = cv2.cvtColor(
                    frame,
                    cv2.COLOR_BGR2RGB,
                )

                image.flags.writeable = False

                results = processor.process(
                    image
                )

                keypoints = (
                    self.extract_keypoints(
                        results
                    )
                )

                if len(keypoints) != KEYPOINTS_PER_FRAME:

                    print(
                        "[MODEL] Error: "
                        f"{len(keypoints)} keypoints "
                        f"en lugar de "
                        f"{KEYPOINTS_PER_FRAME}."
                    )

                    continue

                self._sequence.append(
                    keypoints
                )

                self._frames_since_prediction += 1

                if len(self._sequence) < SEQUENCE_LENGTH:
                    continue

                if (
                    self._frames_since_prediction
                    < PREDICTION_STRIDE
                ):
                    continue

                self._frames_since_prediction = 0

                self._predict()

    # ========================================================
    # PREDICCIÓN
    # ========================================================

    def _predict(self):

        if not self.available:
            return

        sequence = np.asarray(
            self._sequence,
            dtype=np.float32,
        )

        input_data = np.expand_dims(
            sequence,
            axis=0,
        )

        prediction = self.model.predict(
            input_data,
            verbose=0,
        )[0]

        index = int(
            np.argmax(prediction)
        )

        confidence = float(
            prediction[index]
        )

        if index >= len(self.labels):
            return

        sign = self.labels[index]

        if confidence < CONFIDENCE_THRESHOLD:
            return

        if sign != self._last_sign:

            self._last_sign = sign

            self._sentence.append(
                sign
            )

            self._sentence = (
                self._sentence[
                    -MAX_SENTENCE_LENGTH:
                ]
            )

        message = {
            "type": "prediction",
            "sign": sign,
            "confidence": round(
                confidence,
                3,
            ),
            "sentence": list(
                self._sentence
            ),
        }

        if self.on_prediction is not None:

            self.on_prediction(
                message
            )

    # ========================================================
    # RESET
    # ========================================================

    def reset_sentence(self):

        self._sentence.clear()
        self._last_sign = None