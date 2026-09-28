import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from config import (
    CLASSES,
    FRAMES_POR_VIDEO,
    SEQUENCES_DIR,
    VIDEOS_DIR,
)


mp_holistic = mp.solutions.holistic


def extraer_landmarks(resultados):
    """
    Convierte los resultados de MediaPipe Holistic
    en un vector de 1662 valores.
    """

    pose = (
        np.array(
            [[lm.x, lm.y, lm.z, lm.visibility]
             for lm in resultados.pose_landmarks.landmark],
            dtype=np.float32,
        ).flatten()
        if resultados.pose_landmarks
        else np.zeros(33 * 4, dtype=np.float32)
    )

    cara = (
        np.array(
            [[lm.x, lm.y, lm.z]
             for lm in resultados.face_landmarks.landmark],
            dtype=np.float32,
        ).flatten()
        if resultados.face_landmarks
        else np.zeros(468 * 3, dtype=np.float32)
    )

    mano_izquierda = (
        np.array(
            [[lm.x, lm.y, lm.z]
             for lm in resultados.left_hand_landmarks.landmark],
            dtype=np.float32,
        ).flatten()
        if resultados.left_hand_landmarks
        else np.zeros(21 * 3, dtype=np.float32)
    )

    mano_derecha = (
        np.array(
            [[lm.x, lm.y, lm.z]
             for lm in resultados.right_hand_landmarks.landmark],
            dtype=np.float32,
        ).flatten()
        if resultados.right_hand_landmarks
        else np.zeros(21 * 3, dtype=np.float32)
    )

    return np.concatenate(
        [
            pose,
            cara,
            mano_izquierda,
            mano_derecha,
        ]
    )


def procesar_video(video_path, holistic):
    """
    Procesa un video y devuelve una secuencia
    con forma (FRAMES_POR_VIDEO, 1662).
    """

    captura = cv2.VideoCapture(str(video_path))

    if not captura.isOpened():
        print(f"[ERROR] No se pudo abrir: {video_path}")
        return None

    secuencia = []

    while len(secuencia) < FRAMES_POR_VIDEO:
        correcto, frame = captura.read()

        if not correcto:
            break

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        resultados = holistic.process(frame_rgb)

        keypoints = extraer_landmarks(resultados)

        secuencia.append(keypoints)

    captura.release()

    if len(secuencia) != FRAMES_POR_VIDEO:
        print(
            f"[ADVERTENCIA] {video_path.name}: "
            f"se esperaban {FRAMES_POR_VIDEO} frames, "
            f"pero se obtuvieron {len(secuencia)}."
        )
        return None

    secuencia = np.array(secuencia, dtype=np.float32)

    if secuencia.shape != (FRAMES_POR_VIDEO, 1662):
        print(
            f"[ERROR] Forma incorrecta en {video_path.name}: "
            f"{secuencia.shape}"
        )
        return None

    return secuencia


def main():
    print("=" * 60)
    print("LESSAI - EXTRACCIÓN DE KEYPOINTS")
    print("=" * 60)

    SEQUENCES_DIR.mkdir(parents=True, exist_ok=True)

    total_videos = 0
    procesados = 0
    errores = 0

    with mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        refine_face_landmarks=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as holistic:

        for clase in CLASSES:
            carpeta_videos = VIDEOS_DIR / clase
            carpeta_secuencias = SEQUENCES_DIR / clase

            carpeta_secuencias.mkdir(parents=True, exist_ok=True)

            videos = sorted(carpeta_videos.glob("*.mp4"))

            if not videos:
                print(f"\n[{clase}] Sin videos.")
                continue

            print(f"\n[{clase}] {len(videos)} videos encontrados.")

            for video_path in videos:
                total_videos += 1

                salida = carpeta_secuencias / f"{video_path.stem}.npy"

                if salida.exists():
                    print(
                        f"  [OMITIDO] {video_path.name} "
                        f"-> ya existe"
                    )
                    procesados += 1
                    continue

                print(f"  Procesando: {video_path.name}")

                secuencia = procesar_video(
                    video_path,
                    holistic,
                )

                if secuencia is None:
                    errores += 1
                    continue

                np.save(salida, secuencia)

                print(
                    f"  [OK] {salida.name} "
                    f"{secuencia.shape}"
                )

                procesados += 1

    print("\n" + "=" * 60)
    print("EXTRACCIÓN TERMINADA")
    print("=" * 60)
    print(f"Videos encontrados: {total_videos}")
    print(f"Procesados/omitidos: {procesados}")
    print(f"Errores: {errores}")


if __name__ == "__main__":
    main()
    