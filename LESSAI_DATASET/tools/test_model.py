import json
import sys
from pathlib import Path

import numpy as np
from tensorflow.keras.models import load_model

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from config import MODELS_DIR, PROCESSED_DIR


MODEL_PATH = MODELS_DIR / "modelo_lessa.keras"
LABELS_PATH = PROCESSED_DIR / "labels.json"
X_TEST_PATH = PROCESSED_DIR / "X_test.npy"
Y_TEST_PATH = PROCESSED_DIR / "y_test.npy"


def cargar_modelo():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No existe el modelo: {MODEL_PATH}"
        )

    print(f"Cargando modelo: {MODEL_PATH}")

    return load_model(MODEL_PATH)


def cargar_labels():
    if not LABELS_PATH.exists():
        raise FileNotFoundError(
            f"No existe labels.json: {LABELS_PATH}"
        )

    with open(LABELS_PATH, "r", encoding="utf-8") as archivo:
        return json.load(archivo)


def cargar_datos_prueba():
    if not X_TEST_PATH.exists() or not Y_TEST_PATH.exists():
        raise FileNotFoundError(
            "No existen los archivos X_test.npy / y_test.npy."
        )

    X_test = np.load(X_TEST_PATH)
    y_test = np.load(Y_TEST_PATH)

    return X_test, y_test


def mostrar_resultados(modelo, X_test, y_test, labels):
    predicciones = modelo.predict(
        X_test,
        verbose=0,
    )

    predicciones_clase = np.argmax(
        predicciones,
        axis=1,
    )

    correctas = 0

    print("\n" + "=" * 60)
    print("RESULTADOS DE PRUEBA")
    print("=" * 60)

    for i in range(len(X_test)):
        clase_real = int(y_test[i])
        clase_predicha = int(predicciones_clase[i])

        nombre_real = labels[str(clase_real)]
        nombre_predicha = labels[str(clase_predicha)]

        confianza = float(
            predicciones[i][clase_predicha]
        )

        correcto = clase_real == clase_predicha

        if correcto:
            correctas += 1

        estado = "OK" if correcto else "ERROR"

        print(
            f"[{estado}] "
            f"Real: {nombre_real:<30} "
            f"Predicción: {nombre_predicha:<30} "
            f"Confianza: {confianza:.2%}"
        )

    precision = correctas / len(X_test)

    print("\n" + "=" * 60)
    print(f"Correctas:  {correctas}/{len(X_test)}")
    print(f"Precisión:  {precision:.2%}")
    print("=" * 60)


def main():
    print("=" * 60)
    print("LESSAI - PRUEBA DEL MODELO")
    print("=" * 60)

    modelo = cargar_modelo()
    labels = cargar_labels()
    X_test, y_test = cargar_datos_prueba()

    print(f"\nDatos de prueba: {X_test.shape}")
    print(f"Etiquetas:       {y_test.shape}")

    mostrar_resultados(
        modelo,
        X_test,
        y_test,
        labels,
    )


if __name__ == "__main__":
    main()
    