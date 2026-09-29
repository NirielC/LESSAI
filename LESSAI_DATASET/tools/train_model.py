import json
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.models import Sequential
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from config import MODELS_DIR, PROCESSED_DIR


SEED = 42

EPOCHS = 200
BATCH_SIZE = 32


def cargar_dataset():
    archivos = {
        "X_train": PROCESSED_DIR / "X_train.npy",
        "y_train": PROCESSED_DIR / "y_train.npy",
        "X_val": PROCESSED_DIR / "X_val.npy",
        "y_val": PROCESSED_DIR / "y_val.npy",
        "X_test": PROCESSED_DIR / "X_test.npy",
        "y_test": PROCESSED_DIR / "y_test.npy",
        "labels": PROCESSED_DIR / "labels.json",
    }

    for nombre, ruta in archivos.items():
        if not ruta.exists():
            raise FileNotFoundError(
                f"No existe {nombre}: {ruta}"
            )

    X_train = np.load(archivos["X_train"])
    y_train = np.load(archivos["y_train"])

    X_val = np.load(archivos["X_val"])
    y_val = np.load(archivos["y_val"])

    X_test = np.load(archivos["X_test"])
    y_test = np.load(archivos["y_test"])

    with open(
        archivos["labels"],
        "r",
        encoding="utf-8",
    ) as archivo:
        labels = json.load(archivo)

    return (
        X_train,
        y_train,
        X_val,
        y_val,
        X_test,
        y_test,
        labels,
    )


def crear_modelo(num_clases):
    modelo = Sequential(
        [
            LSTM(
                64,
                return_sequences=True,
                input_shape=(30, 1662),
            ),
            Dropout(0.3),

            LSTM(64),
            Dropout(0.3),

            Dense(64, activation="relu"),
            Dropout(0.3),

            Dense(
                num_clases,
                activation="softmax",
            ),
        ]
    )

    modelo.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    return modelo


def main():
    print("=" * 60)
    print("LESSAI - ENTRENAMIENTO DEL MODELO")
    print("=" * 60)

    np.random.seed(SEED)
    tf.random.set_seed(SEED)

    (
        X_train,
        y_train,
        X_val,
        y_val,
        X_test,
        y_test,
        labels,
    ) = cargar_dataset()

    num_clases = len(labels)

    print("\nDataset:")
    print(f"  Entrenamiento: {X_train.shape}")
    print(f"  Validación:    {X_val.shape}")
    print(f"  Prueba:        {X_test.shape}")
    print(f"  Clases:        {num_clases}")

    y_train_cat = to_categorical(
        y_train,
        num_classes=num_clases,
    )

    y_val_cat = to_categorical(
        y_val,
        num_classes=num_clases,
    )

    y_test_cat = to_categorical(
        y_test,
        num_classes=num_clases,
    )

    modelo = crear_modelo(num_clases)

    print("\nArquitectura:")
    modelo.summary()

    MODELS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    ruta_modelo = (
        MODELS_DIR / "modelo_lessa_v2.keras"
    )

    callbacks = [
        EarlyStopping(
            monitor="val_loss",
            patience=25,
            restore_best_weights=True,
        ),
        ModelCheckpoint(
            filepath=str(ruta_modelo),
            monitor="val_loss",
            save_best_only=True,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=8,
            min_lr=1e-5,
            verbose=1,
        ),
    ]

    print("\nIniciando entrenamiento...\n")

    modelo.fit(
        X_train,
        y_train_cat,
        validation_data=(
            X_val,
            y_val_cat,
        ),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1,
    )

    print("\nEvaluando con el conjunto de prueba...")

    perdida, precision = modelo.evaluate(
        X_test,
        y_test_cat,
        verbose=0,
    )

    print("\n" + "=" * 60)
    print("RESULTADO")
    print("=" * 60)

    print(f"Pérdida:   {perdida:.4f}")
    print(f"Precisión: {precision:.4f}")

    print("\nModelo guardado en:")
    print(f"  {ruta_modelo}")

    print("\nEntrenamiento terminado.")


if __name__ == "__main__":
    main()
    