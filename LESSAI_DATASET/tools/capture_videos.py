import sys
from pathlib import Path

import cv2


# ============================================================
# RUTA DEL PROYECTO
# ============================================================

# capture_videos.py está en:
# LESSAI_DATASET/tools/
#
# parents[0] = tools
# parents[1] = LESSAI_DATASET

ROOT_DIR = Path(__file__).resolve().parents[1]

# Permite importar config.py desde LESSAI_DATASET
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


# ============================================================
# SELECCIONAR PERSONA
# ============================================================

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


# ============================================================
# SELECCIONAR CLASE
# ============================================================

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
                input(
                    f"Selecciona la clase (1-{len(CLASSES)}): "
                )
            )

            if 1 <= opcion <= len(CLASSES):
                return CLASSES[opcion - 1]

            print(
                f"ERROR: Debes seleccionar un número "
                f"entre 1 y {len(CLASSES)}."
            )

        except ValueError:
            print("ERROR: Ingresa un número válido.")


# ============================================================
# OBTENER SIGUIENTE VIDEO
# ============================================================

def obtener_siguiente_video(carpeta):
    archivos = list(carpeta.glob("*.mp4"))

    if not archivos:
        return 1

    numeros = []

    for archivo in archivos:
        try:
            numeros.append(int(archivo.stem))
        except ValueError:
            continue

    if not numeros:
        return 1

    return max(numeros) + 1


# ============================================================
# CUENTA REGRESIVA
# ============================================================

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

        cv2.imshow(
            "LESSAI - Captura de videos",
            frame,
        )

        tecla = cv2.waitKey(1000) & 0xFF

        if tecla == 27:
            return False

    return True


# ============================================================
# GRABAR VIDEO
# ============================================================

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
            print(
                "ERROR: No se pudo leer "
                "un frame de la cámara."
            )

            writer.release()

            if ruta_salida.exists():
                ruta_salida.unlink()

            return False

        writer.write(frame)

        frames_grabados += 1

        progreso = (
            f"Grabando: "
            f"{frames_grabados}/{FRAMES_POR_VIDEO}"
        )

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

        cv2.imshow(
            "LESSAI - Captura de videos",
            frame,
        )

        tecla = cv2.waitKey(1) & 0xFF

        if tecla == 27:

            writer.release()

            if ruta_salida.exists():
                ruta_salida.unlink()

            return False

    writer.release()

    return True


# ============================================================
# MAIN
# ============================================================

def main():

    crear_directorios()

    print()
    print("======================================")
    print("       LESSAI - CAPTURA DE DATOS")
    print("======================================")

    # --------------------------------------------------------
    # PERSONA
    # --------------------------------------------------------

    persona = seleccionar_persona()

    inicio, fin = obtener_rango_persona(persona)

    print()
    print("--------------------------------------")
    print(f"Persona seleccionada: {persona}")
    print(
        f"Rango asignado: "
        f"{inicio:03d} - {fin:03d}"
    )
    print("--------------------------------------")

    # --------------------------------------------------------
    # CLASE
    # --------------------------------------------------------

    clase = seleccionar_clase()

    print()
    print("--------------------------------------")
    print(f"Clase seleccionada: {clase}")
    print(f"Persona: {persona}")
    print(
        f"Videos asignados: "
        f"{inicio:03d} - {fin:03d}"
    )
    print("--------------------------------------")

    # --------------------------------------------------------
    # CARPETA DE LA CLASE
    # --------------------------------------------------------

    carpeta_clase = VIDEOS_DIR / clase

    carpeta_clase.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # SIGUIENTE VIDEO
    # --------------------------------------------------------

    siguiente = obtener_siguiente_video(
        carpeta_clase
    )

    if siguiente < inicio:
        siguiente = inicio

    if siguiente > fin:

        print()
        print("======================================")
        print("          RANGO COMPLETADO")
        print("======================================")
        print(f"Clase: {clase}")
        print(f"Persona: {persona}")
        print(
            f"Rango: "
            f"{inicio:03d} - {fin:03d}"
        )
        print("======================================")

        return

    print()
    print(
        f"Siguiente video: "
        f"{siguiente:03d}.mp4"
    )

    # --------------------------------------------------------
    # CÁMARA
    # --------------------------------------------------------

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():

        print()
        print(
            "ERROR: No se pudo abrir "
            "la cámara."
        )

        return

    cap.set(
        cv2.CAP_PROP_FRAME_WIDTH,
        ANCHO,
    )

    cap.set(
        cv2.CAP_PROP_FRAME_HEIGHT,
        ALTO,
    )

    cap.set(
        cv2.CAP_PROP_FPS,
        FPS,
    )

    print()
    print("Cámara iniciada correctamente.")

    # --------------------------------------------------------
    # GRABACIÓN
    # --------------------------------------------------------

    salir = False

    while not salir:

        if siguiente > fin:

            print()
            print("======================================")
            print("          RANGO COMPLETADO")
            print("======================================")
            print(f"Clase: {clase}")
            print(f"Persona: {persona}")
            print(
                f"Videos: "
                f"{inicio:03d} - {fin:03d}"
            )
            print("======================================")

            break

        ret, frame = cap.read()

        if not ret:

            print(
                "ERROR: No se pudo "
                "leer la cámara."
            )

            break

        # ----------------------------------------------------
        # TEXTO EN PANTALLA
        # ----------------------------------------------------

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

        cv2.imshow(
            "LESSAI - Captura de videos",
            frame,
        )

        tecla = cv2.waitKey(1) & 0xFF

        # ----------------------------------------------------
        # ESC
        # ----------------------------------------------------

        if tecla == 27:

            print()
            print(
                "Grabación detenida "
                "por el usuario."
            )

            salir = True
            break

        # ----------------------------------------------------
        # ESPACIO
        # ----------------------------------------------------

        if tecla == 32:

            print()
            print("--------------------------------------")
            print(
                f"Preparando video "
                f"{siguiente:03d}"
            )
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

            ruta_salida = (
                carpeta_clase
                / f"{siguiente:03d}.mp4"
            )

            print(
                f"Grabando: "
                f"{ruta_salida.name}"
            )

            exito = grabar_video(
                cap,
                ruta_salida,
            )

            if exito:

                print()
                print(
                    f"OK -> "
                    f"{ruta_salida.name}"
                )

                siguiente += 1

                if siguiente > fin:

                    print()
                    print(
                        "======================================"
                    )
                    print(
                        "         CLASE COMPLETADA"
                    )
                    print(
                        "======================================"
                    )
                    print(f"Clase: {clase}")
                    print(f"Persona: {persona}")
                    print(
                        f"Videos: "
                        f"{inicio:03d} - {fin:03d}"
                    )
                    print(
                        "======================================"
                    )

                    salir = True

            else:

                print()
                print(
                    "La grabación "
                    "no se completó."
                )

    # --------------------------------------------------------
    # CERRAR
    # --------------------------------------------------------

    cap.release()
    cv2.destroyAllWindows()

    print()
    print("Cámara cerrada.")
    print("Programa finalizado.")


# ============================================================
# EJECUTAR
# ============================================================

if __name__ == "__main__":
    main()
    