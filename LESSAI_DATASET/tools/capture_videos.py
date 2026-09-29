import sys
from pathlib import Path

import cv2


# capture_videos.py está en LESSAI_DATASET/tools/
ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from config import (
    VIDEOS_DIR,
    CLASSES,
    FPS,
    FRAMES_POR_VIDEO,
    ANCHO,
    ALTO,
    COUNTDOWN_SEGUNDOS,
    obtener_rango_persona,
    crear_directorios,
)


def seleccionar_persona():
    while True:
        print()
        print("==============================")
        print("       SELECCIONAR PERSONA")
        print("==============================")
        print("1. Persona 1")
        print("2. Persona 2")
        print("3. Persona 3")
        print("4. Persona 4")
        print("==============================")

        try:
            persona = int(input("Selecciona la persona (1-4): "))

            if 1 <= persona <= 4:
                return persona

            print("ERROR: Debes seleccionar un número entre 1 y 4.")

        except ValueError:
            print("ERROR: Ingresa un número válido.")


def seleccionar_clase():
    while True:
        print()
        print("==============================")
        print("        SELECCIONAR CLASE")
        print("==============================")

        for i, clase in enumerate(CLASSES, start=1):
            print(f"{i}. {clase}")

        print("==============================")

        try:
            opcion = int(
                input(f"Selecciona la clase (1-{len(CLASSES)}): ")
            )

            if 1 <= opcion <= len(CLASSES):
                return CLASSES[opcion - 1]

            print(
                f"ERROR: Debes seleccionar un número "
                f"entre 1 y {len(CLASSES)}."
            )

        except ValueError:
            print("ERROR: Ingresa un número válido.")


def obtener_siguiente_video(carpeta, inicio, fin):
    """Devuelve el primer número sin archivo dentro del rango asignado."""
    for numero in range(inicio, fin + 1):
        ruta_video = carpeta / f"{numero:03d}.mp4"

        if not ruta_video.exists():
            return numero

    return fin + 1


def esperar_cuenta_regresiva(cap, segundos):
    for i in range(segundos, 0, -1):
        ret, frame = cap.read()

        if not ret:
            return False

        cv2.putText(
            frame,
            str(i),
            (ANCHO // 2 - 30, ALTO // 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            3,
            (0, 255, 0),
            5,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            "Preparado...",
            (ANCHO // 2 - 100, ALTO // 2 + 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.imshow("LESSAI - Captura de videos", frame)

        tecla = cv2.waitKey(1000) & 0xFF

        if tecla == 27:
            return False

    return True


def grabar_video(cap, ruta_salida):
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

    while frames_grabados < FRAMES_POR_VIDEO:
        ret, frame = cap.read()

        if not ret:
            print("ERROR: No se pudo leer un frame de la cámara.")
            writer.release()

            if ruta_salida.exists():
                ruta_salida.unlink()

            return False

        writer.write(frame)
        frames_grabados += 1

        progreso = f"Grabando: {frames_grabados}/{FRAMES_POR_VIDEO}"

        cv2.putText(
            frame,
            progreso,
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )

        cv2.imshow("LESSAI - Captura de videos", frame)

        tecla = cv2.waitKey(1) & 0xFF

        if tecla == 27:
            writer.release()

            if ruta_salida.exists():
                ruta_salida.unlink()

            return False

    writer.release()
    return True


def main():
    crear_directorios()

    print()
    print("======================================")
    print("       LESSAI - CAPTURA DE DATOS")
    print("======================================")

    persona = seleccionar_persona()
    inicio, fin = obtener_rango_persona(persona)

    print()
    print("--------------------------------------")
    print(f"Persona seleccionada: {persona}")
    print(f"Rango asignado: {inicio:03d} - {fin:03d}")
    print("--------------------------------------")

    clase = seleccionar_clase()

    print()
    print("--------------------------------------")
    print(f"Clase seleccionada: {clase}")
    print(f"Persona: {persona}")
    print(f"Videos asignados: {inicio:03d} - {fin:03d}")
    print("--------------------------------------")

    carpeta_clase = VIDEOS_DIR / clase
    carpeta_clase.mkdir(parents=True, exist_ok=True)

    # Buscar el primer archivo faltante SOLO en el rango de esta persona.
    siguiente = obtener_siguiente_video(carpeta_clase, inicio, fin)

    if siguiente > fin:
        print()
        print("======================================")
        print("          RANGO COMPLETADO")
        print("======================================")
        print(f"Clase: {clase}")
        print(f"Persona: {persona}")
        print(f"Rango: {inicio:03d} - {fin:03d}")
        print("======================================")
        return

    print()
    print(f"Siguiente video: {siguiente:03d}.mp4")

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print()
        print("ERROR: No se pudo abrir la cámara.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, ANCHO)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, ALTO)
    cap.set(cv2.CAP_PROP_FPS, FPS)

    print()
    print("Cámara iniciada correctamente.")

    salir = False

    while not salir:
        ret, frame = cap.read()

        if not ret:
            print("ERROR: No se pudo leer la cámara.")
            break

        cv2.putText(
            frame,
            f"Clase: {clase}",
            (20, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            f"Persona: {persona}",
            (20, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            f"Video: {siguiente:03d}/{fin:03d}",
            (20, 105),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            "ESPACIO = Grabar",
            (20, ALTO - 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            "ESC = Salir",
            (20, ALTO - 15),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.imshow("LESSAI - Captura de videos", frame)

        tecla = cv2.waitKey(1) & 0xFF

        if tecla == 27:
            print()
            print("Grabación detenida por el usuario.")
            salir = True
            break

        if tecla == 32:
            print()
            print("--------------------------------------")
            print(f"Preparando video {siguiente:03d}")
            print(f"Clase: {clase}")
            print(f"Persona: {persona}")
            print("--------------------------------------")

            continuar = esperar_cuenta_regresiva(
                cap,
                COUNTDOWN_SEGUNDOS,
            )

            if not continuar:
                salir = True
                break

            ruta_salida = carpeta_clase / f"{siguiente:03d}.mp4"

            print(f"Grabando: {ruta_salida.name}")

            exito = grabar_video(cap, ruta_salida)

            if exito:
                print()
                print(f"OK -> {ruta_salida.name}")

                # Volver a buscar: puede haber huecos entre videos existentes.
                siguiente = obtener_siguiente_video(
                    carpeta_clase,
                    inicio,
                    fin,
                )

                if siguiente > fin:
                    print()
                    print("======================================")
                    print("         CLASE COMPLETADA")
                    print("======================================")
                    print(f"Clase: {clase}")
                    print(f"Persona: {persona}")
                    print(f"Videos: {inicio:03d} - {fin:03d}")
                    print("======================================")
                    salir = True
                else:
                    print(f"Siguiente video: {siguiente:03d}.mp4")

            else:
                print()
                print("La grabación no se completó.")

    cap.release()
    cv2.destroyAllWindows()

    print()
    print("Cámara cerrada.")
    print("Programa finalizado.")


if __name__ == "__main__":
    main()