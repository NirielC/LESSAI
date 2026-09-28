import json
import sys
from pathlib import Path

import numpy as np
from sklearn.model_selection import train_test_split

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from config import (
    CLASSES,
    FRAMES_POR_VIDEO,
    PROCESSED_DIR,
    SEQUENCES_DIR,
)


SEED = 42

TRAIN_SIZE = 0.70
VALIDATION_SIZE = 0.15
TEST_SIZE = 0.15


def cargar_secuencias():
    X = []
    y = []

    total = 0
    errores = 0

    print("=" * 60)
    print("LESSAI - PREPARACIÓN DEL DATASET")
    print("=" * 60)

    for indice_clase, clase in enumerate(CLASSES):
        carpeta = SEQUENCES_DIR / clase
        archivos = sorted(carpeta.glob("*.npy"))

        print(f"\n[{clase}] {len(archivos)} secuencias")

        for archivo in archivos:
            try:
                secuencia = np.load(archivo)

                forma_esperada = (FRAMES_POR_VIDEO, 1662)

                if secuencia.shape != forma_esperada:
                    print(
                        f"  [ERROR] {archivo.name}: "
                        f"forma {secuencia.shape}, "
                        f"esperada {forma_esperada}"
                    )
                    errores += 1
                    continue

                X.append(secuencia)
                y.append(indice_clase)

                total += 1

            except Exception as e:
                print(
                    f"  [ERROR] No se pudo cargar "
                    f"{archivo.name}: {e}"
                )
                errores += 1

    return (
        np.array(X, dtype=np.float32),
        np.array(y, dtype=np.int64),
        total,
        errores,
    )


def dividir_dataset(X, y):
    """
    Divide el dataset en:
    70% entrenamiento
    15% validación
    15% prueba
    """

    X_train, X_temp, y_train, y_temp = train_test_split(
        X,
        y,
        test_size=VALIDATION_SIZE + TEST_SIZE,
        random_state=SEED,
        stratify=y,
    )

    proporcion_test = TEST_SIZE / (
        VALIDATION_SIZE + TEST_SIZE
    )

    X_val, X_test, y_val, y_test = train_test_split(
        X_temp,
        y_temp,
        test_size=proporcion_test,
        random_state=SEED,
        stratify=y_temp,
    )

    return (
        X_train,
        X_val,
        X_test,
        y_train,
        y_val,
        y_test,
    )


def guardar_dataset(
    X_train,
    X_val,
    X_test,
    y_train,
    y_val,
    y_test,
):
    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    np.save(PROCESSED_DIR / "X_train.npy", X_train)
    np.save(PROCESSED_DIR / "y_train.npy", y_train)

    np.save(PROCESSED_DIR / "X_val.npy", X_val)
    np.save(PROCESSED_DIR / "y_val.npy", y_val)

    np.save(PROCESSED_DIR / "X_test.npy", X_test)
    np.save(PROCESSED_DIR / "y_test.npy", y_test)

    labels = {
        str(indice): clase
        for indice, clase in enumerate(CLASSES)
    }

    with open(
        PROCESSED_DIR / "labels.json",
        "w",
        encoding="utf-8",
    ) as archivo:
        json.dump(
            labels,
            archivo,
            ensure_ascii=False,
            indent=4,
        )

    print("\nArchivos generados:")
    print("  X_train.npy")
    print("  y_train.npy")
    print("  X_val.npy")
    print("  y_val.npy")
    print("  X_test.npy")
    print("  y_test.npy")
    print("  labels.json")


def mostrar_distribucion(nombre, y):
    print(f"\n{nombre}:")

    for indice, clase in enumerate(CLASSES):
        cantidad = np.sum(y == indice)
        print(
            f"  {indice:2d} - "
            f"{clase:<30} "
            f"{cantidad}"
        )


def main():
    X, y, total, errores = cargar_secuencias()

    print("\n" + "=" * 60)
    print("RESUMEN DE CARGA")
    print("=" * 60)

    print(f"Secuencias válidas: {total}")
    print(f"Errores:            {errores}")

    if total == 0:
        print("\nNo hay secuencias para preparar.")
        return

    print(f"\nDataset completo:")
    print(f"  X: {X.shape}")
    print(f"  y: {y.shape}")

    (
        X_train,
        X_val,
        X_test,
        y_train,
        y_val,
        y_test,
    ) = dividir_dataset(X, y)

    print("\n" + "=" * 60)
    print("DIVISIÓN DEL DATASET")
    print("=" * 60)

    print(f"Entrenamiento: {X_train.shape[0]}")
    print(f"Validación:    {X_val.shape[0]}")
    print(f"Prueba:        {X_test.shape[0]}")

    mostrar_distribucion(
        "ENTRENAMIENTO",
        y_train,
    )

    mostrar_distribucion(
        "VALIDACIÓN",
        y_val,
    )

    mostrar_distribucion(
        "PRUEBA",
        y_test,
    )

    guardar_dataset(
        X_train,
        X_val,
        X_test,
        y_train,
        y_val,
        y_test,
    )

    print("\n" + "=" * 60)
    print("DATASET PREPARADO CORRECTAMENTE")
    print("=" * 60)


if __name__ == "__main__":
    main()
    