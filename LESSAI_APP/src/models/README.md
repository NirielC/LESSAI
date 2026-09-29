# Modelos

## Importante: React Native NO ejecuta archivos `.h5`

Un `.h5` de Keras es un contenedor HDF5 con pesos y grafo pensado para el runtime de
Python. No existe forma de cargarlo directamente desde JavaScript en React Native.
Cualquier afirmacion contraria es falsa.

La ruta correcta es convertir el modelo a un formato que si tenga runtime movil.

## Opcion recomendada: `.h5` -> TensorFlow Lite

TFLite es lo adecuado para inferencia de secuencias en telefono: cuantizable,
rapido y con delegados de GPU/NNAPI/CoreML.

```bash
pip install "tensorflow==2.15.*"
```

```python
# scripts/convert_h5_to_tflite.py
import json
import tensorflow as tf

SRC = "lessa_model.h5"
DST = "lessa_model.tflite"
LABELS = ["NO_SIGN", "HOLA", "GRACIAS", "COMO ESTAS", "MUCHO GUSTO", "BIEN"]

model = tf.keras.models.load_model(SRC)

converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]
# Las capas LSTM/GRU necesitan los ops de TF ademas de los builtin de TFLite:
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS,
    tf.lite.OpsSet.SELECT_TF_OPS,
]
converter._experimental_lower_tensor_list_ops = False

open(DST, "wb").write(converter.convert())

# El manifiesto se genera del modelo, no a mano.
seq_len, feat = model.input_shape[1], model.input_shape[2]
json.dump(
    {
        "name": "lessa",
        "sourceFile": SRC,
        "runtimeFile": DST,
        "input": {"sequenceLength": seq_len, "featureSize": feat},
        "output": {"type": "softmax", "noSignLabel": "NO_SIGN"},
        "labels": LABELS,
    },
    open("model.manifest.json", "w"),
    indent=2,
    ensure_ascii=False,
)
```

Coloca `lessa_model.tflite` y `model.manifest.json` en esta carpeta.

## Alternativas

| Ruta | Cuando usarla | Coste |
|---|---|---|
| `.h5` -> TFLite | Recomendada. Inferencia local, offline, baja latencia. | Requiere **Development Build** (runtime nativo). |
| `.h5` -> TensorFlow.js (`tensorflowjs_converter`) | Si se quiere seguir en Expo Go con `@tensorflow/tfjs-react-native`. | Mas lento, mas memoria, peor con LSTM largas. |
| `.h5` en servidor + API REST | Si el vocabulario crecera mucho o el modelo es pesado. | Necesita red; latencia variable. |

La eleccion no afecta al resto de la app: solo se escribe una nueva clase que
implemente `SignRecognizer` y se registra en `RecognizerFactory`.

## Como se conecta el modelo real

1. Genera `lessa_model.tflite` + `model.manifest.json` con el script de arriba.
2. Crea un Development Build (`npx expo prebuild && npx expo run:android`), porque
   el runtime de TFLite es codigo nativo y **no** existe en Expo Go.
3. Implementa `predict()` en `src/recognition/TfliteSignRecognizer.js`.
4. Cambia `engine: 'mock'` por `engine: 'tflite'` en `src/config/recognition.config.js`.

No hay que tocar pantallas, navegacion, conversacion ni overlay. Las clases del
modelo llegan a la UI via `recognizer.getLabels()`; si el `.h5` cambia de
vocabulario, la app se adapta sola.
