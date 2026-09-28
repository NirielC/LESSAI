# tools/capture_videos.py

import cv2
import time
import sys
from pathlib import Path

# ============================================================
# IMPORTAR CONFIGURACIÓN
# ============================================================

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from config import (
    CLASSES,
    VIDEOS_DIR,
    VIDEOS_POR_PERSONA,
    FPS,
    FRAMES_POR_VIDEO,
    ANCHO,
    ALTO,
    COUNTDOWN_SEGUNDOS,
    obtener_rango_persona,
)


# ============================================================
# CONFIGURACIÓN DE LA PERSONA
# ============================================================

PERSONA = 1


# ============================================================
# FUNCIONES
# ============================================================

def obtener_siguiente_video(carpeta):
    """
    Busca el siguiente número disponible sin sobrescribir
    ningún video existente.
    """

    archivos = list(carpeta.glob("*.mp4"))

    numeros = []

    for archivo in archivos:
        try:
            numero = int(archivo.stem)
            numeros.append(numero)
        except ValueError:
            continue

    if not numeros:
        return 1

    return max(numeros) + 1


def esperar_cuenta_regresiva(cap, segundos):
    """
    Muestra una cuenta regresiva antes de comenzar la grabación.
    """

    inicio = time.time()

    while True:
        transcurrido = time.time() - inicio
        restante = segundos - int(transcurrido)

        if restante <= 0:
            break

        ret, frame = cap.read()

        if not ret:
            continue

        texto = str(restante)

        cv2.putText(
            frame,
            texto,
            (ANCHO // 2 - 30, ALTO // 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            3,
            (0, 255, 255),
            5,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            "Preparandose...",
            (ANCHO // 2 - 120, ALTO // 2 + 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.imshow("LESSAI - Captura de videos", frame)

        if cv2.waitKey(1) & 0xFF == 27:
            return False

    return True


def grabar_video(cap, ruta_salida):
    """
    Graba exactamente FRAMES_POR_VIDEO frames.
    """

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")

    writer = cv2.VideoWriter(
        str(ruta_salida),
        fourcc,
        FPS,
        (ANCHO, ALTO),
    )

    if not writer.isOpened():
        print("ERROR: No se pudo crear el archivo de video.")
        return False

    frames_grabados = 0

    inicio = time.time()

    while frames_grabados < FRAMES_POR_VIDEO:

        ret, frame = cap.read()

        if not ret:
            print("ERROR: No se pudo leer un frame de la cámara.")
            writer.release()
            return False

        frame = cv2.resize(frame, (ANCHO, ALTO))

        writer.write(frame)

        frames_grabados += 1

        # Mostrar progreso
        texto = f"Grabando... {frames_grabados}/{FRAMES_POR_VIDEO}"

        cv2.putText(
            frame,
            texto,
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )

        cv2.imshow("LESSAI - Captura de videos", frame)

        if cv2.waitKey(1) & 0xFF == 27:
            break

    writer.release()

    duracion = time.time() - inicio

    print(
        f"Video guardado: {ruta_salida.name} | "
        f"{frames_grabados} frames | "
        f"{duracion:.2f} segundos"
    )

    return frames_grabados == FRAMES_POR_VIDEO


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================

def main():

    print("=" * 60)
    print("LESSAI - CAPTURA DE VIDEOS")
    print("=" * 60)

    # --------------------------------------------------------
    # Seleccionar persona
    # --------------------------------------------------------

    global PERSONA

    while True:

        try:
            PERSONA = int(
                input(
                    f"\nIngrese el número de persona (1-{4}): "
                )
            )

            if 1 <= PERSONA <= 4:
                break

        except ValueError:
            pass

        print("Número de persona inválido.")

    inicio_persona, fin_persona = obtener_rango_persona(PERSONA)

    print()
    print(f"Persona: {PERSONA}")
    print(f"Rango asignado: {inicio_persona} - {fin_persona}")
    print(f"Videos por clase: {VIDEOS_POR_PERSONA}")
    print()

    # --------------------------------------------------------
    # Abrir cámara
    # --------------------------------------------------------

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("ERROR: No se pudo abrir la cámara.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, ANCHO)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, ALTO)
    cap.set(cv2.CAP_PROP_FPS, FPS)

    print("Cámara iniciada correctamente.")
    print()
    print("CONTROLES:")
    print("  ESPACIO = grabar video")
    print("  ESC     = salir")
    print()

    # --------------------------------------------------------
    # Captura de clases
    # --------------------------------------------------------

    for clase in CLASSES:

        carpeta_clase = VIDEOS_DIR / clase
        carpeta_clase.mkdir(parents=True, exist_ok=True)

        siguiente = obtener_siguiente_video(carpeta_clase)

        # Evitar salir del rango de la persona
        if siguiente < inicio_persona:
            siguiente = inicio_persona

        if siguiente > fin_persona:

            print()
            print(
                f"[{clase}] Persona {PERSONA}: "
                f"rango {inicio_persona}-{fin_persona} completo."
            )

            continue

        print()
        print("=" * 60)
        print(f"CLASE: {clase}")
        print(
            f"Persona {PERSONA} | "
            f"Videos {inicio_persona}-{fin_persona}"
        )
        print("=" * 60)

        while siguiente <= fin_persona:

            ret, frame = cap.read()

            if not ret:
                print("ERROR: No se pudo leer la cámara.")
                break

            frame = cv2.resize(frame, (ANCHO, ALTO))

            # ------------------------------------------------
            # Información en pantalla
            # ------------------------------------------------

            cv2.putText(
                frame,
                f"Clase: {clase}",
                (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2,
                cv2.LINE_AA,
            )

            cv2.putText(
                frame,
                f"Video: {siguiente}/{fin_persona}",
                (20, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2,
                cv2.LINE_AA,
            )

            cv2.putText(
                frame,
                "ESPACIO = grabar | ESC = salir",
                (20, ALTO - 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2,
                cv2.LINE_AA,
            )

            cv2.imshow(
                "LESSAI - Captura de videos",
                frame
            )

            tecla = cv2.waitKey(1) & 0xFF

            # ------------------------------------------------
            # ESC
            # ------------------------------------------------

            if tecla == 27:

                print("\nCaptura finalizada por el usuario.")

                cap.release()
                cv2.destroyAllWindows()

                return

            # ------------------------------------------------
            # ESPACIO
            # ------------------------------------------------

            if tecla == 32:

                print()
                print(
                    f"Preparando video {siguiente} "
                    f"de la clase {clase}..."
                )

                # Cuenta regresiva
                continuar = esperar_cuenta_regresiva(
                    cap,
                    COUNTDOWN_SEGUNDOS
                )

                if not continuar:
                    cap.release()
                    cv2.destroyAllWindows()
                    return

                # ------------------------------------------------
                # Nombre del archivo
                # ------------------------------------------------

                nombre = f"{siguiente:03d}.mp4"

                ruta_salida = carpeta_clase / nombre

                # Seguridad adicional
                while ruta_salida.exists():

                    siguiente += 1

                    if siguiente > fin_persona:
                        break

                    nombre = f"{siguiente:03d}.mp4"
                    ruta_salida = carpeta_clase / nombre

                if siguiente > fin_persona:
                    break

                # ------------------------------------------------
                # Grabar
                # ------------------------------------------------

                exito = grabar_video(
                    cap,
                    ruta_salida
                )

                if exito:

                    print(
                        f"✓ Video {siguiente} guardado correctamente."
                    )

                    siguiente += 1

                else:

                    print(
                        f"✗ El video {siguiente} no se completó."
                    )

                    # El archivo incompleto no se reutiliza
                    if ruta_salida.exists():
                        ruta_salida.unlink()

                print()

    # --------------------------------------------------------
    # Final
    # --------------------------------------------------------

    cap.release()
    cv2.destroyAllWindows()

    print()
    print("=" * 60)
    print("CAPTURA FINALIZADA")
    print("=" * 60)


# ============================================================
# EJECUCIÓN
# ============================================================

if __name__ == "__main__":
    main()
    