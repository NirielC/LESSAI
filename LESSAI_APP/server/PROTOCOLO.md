# Protocolo servidor ↔ app

Contrato entre el servidor Python y la aplicación móvil. Mientras los dos lados
respeten esto, se pueden desarrollar por separado.

```
Pin (ESP32-CAM) ──HTTP/MJPEG──> Servidor Python ──WebSocket──> App móvil
                                MediaPipe + LSTM
```

**Endpoint:** `ws://<ip-del-servidor>:8765/lessa`

Todos los mensajes son JSON, un objeto por mensaje, con un campo `type`.

---

## De la app al servidor

### `hello` — al conectar

```json
{ "type": "hello", "client": "lessa-app", "wants": ["predictions", "frames"] }
```

Es lo único que envía la app. Si `wants` no incluye `"frames"`, el servidor
puede ahorrarse mandar el preview.

---

## Del servidor a la app

### `ready` — respuesta al hello

```json
{
  "type": "ready",
  "labels": ["NO_SIGN", "HOLA", "GRACIAS", "..."],
  "model": "lessa-v1",
  "sequenceLength": 30
}
```

**`labels` es obligatorio.** La app nunca escribe el vocabulario: lo muestra tal
como llega aquí. Si el modelo cambia de 10 a 20 clases, la app se adapta sola.

El índice 0 debe ser la clase de "sin seña" (`NO_SIGN`).

### `prediction` — una por inferencia

```json
{
  "type": "prediction",
  "label": "HOLA",
  "confidence": 0.93,
  "margin": 0.71,
  "ts": 1790608226050
}
```

| Campo | Qué es | Obligatorio |
|---|---|---|
| `label` | Clase top-1, exactamente como aparece en `labels` | sí |
| `confidence` | Probabilidad de la clase top-1, 0 a 1 | sí |
| `margin` | `top1 − top2`. Descarta empates entre dos señas parecidas | recomendado |
| `ts` | Milisegundos epoch, para medir latencia | recomendado |

### `no_sign` — no hay seña

```json
{ "type": "no_sign", "ts": 1790608224015 }
```

Equivale a `prediction` con `label: "NO_SIGN"`. Existe por comodidad.

**Mándenlo.** Sin él la app no sabe distinguir "bajó las manos" de "se cayó la
conexión", y el anti-repetición no puede liberar la última seña.

### `frame` — preview del pin (opcional)

```json
{
  "type": "frame",
  "jpeg": "<base64 sin el prefijo data:>",
  "landmarks": { "pose": [[0.5,0.18,0,0.95], "..."], "leftHand": [[0.57,0.28,0], "..."] }
}
```

A 2–5 fps basta. Es solo para que la persona oyente vea qué está mirando el pin.

### `landmarks` — puntos clave (opcional)

Van dentro de `frame` cuando hay preview, o sueltos cuando no lo hay:

```json
{
  "type": "landmarks",
  "pose":      [[x, y, z, visibilidad], "... 33 puntos"],
  "leftHand":  [[x, y, z], "... 21 puntos"],
  "rightHand": [[x, y, z], "... 21 puntos"],
  "face":      [[x, y], "... los que quieran, o nada"]
}
```

**Arrays, no objetos.** `[0.5, 0.18, 0, 0.95]` pesa un tercio que
`{"x":0.5,"y":0.18,"z":0,"visibility":0.95}`, y a 5 fps con 75 puntos eso
importa. La app los convierte al vuelo.

Coordenadas **normalizadas 0–1** respecto al frame del pin, igual que las
devuelve MediaPipe. La app las escala al tamaño del preview, así que no
importa la resolución de la cámara.

Una mano ausente se manda como `null`, no como array vacío:

```json
{ "type": "landmarks", "pose": ["..."], "leftHand": ["..."], "rightHand": null }
```

En el servidor sale casi gratis, porque MediaPipe ya calculó estos puntos para
alimentar al modelo:

```python
res = holistic.process(frame)
lm = {
    "pose":      [[p.x, p.y, p.z, p.visibility] for p in res.pose_landmarks.landmark] if res.pose_landmarks else None,
    "leftHand":  [[p.x, p.y, p.z] for p in res.left_hand_landmarks.landmark] if res.left_hand_landmarks else None,
    "rightHand": [[p.x, p.y, p.z] for p in res.right_hand_landmarks.landmark] if res.right_hand_landmarks else None,
}
```

### `error`

```json
{ "type": "error", "message": "No se puede alcanzar el pin en 192.168.1.50" }
```

---

## Reglas importantes

**Manden predicciones crudas, no filtradas.** El servidor emite lo que dice el
modelo en cada inferencia, ~3 por segundo. La app tiene el estabilizador que
decide cuál se convierte en mensaje: umbral de confianza, N predicciones
iguales seguidas, tiempo de espera y bloqueo de la misma seña hasta que haya un
cambio real. Si el servidor filtra también, se filtra dos veces y la app se
vuelve lenta y sorda.

**Un mensaje desconocido no rompe nada.** La app ignora los `type` que no
conoce, así que el servidor puede ganar mensajes nuevos sin actualizar el
teléfono.

**El servidor manda algo al menos cada 8 segundos.** Si no, la app da la
conexión por muerta y reconecta. Un `no_sign` periódico sirve de latido.

---

## Servidor de pruebas

`mock_server.py` habla este protocolo con predicciones inventadas. Permite
desarrollar y probar la app completa sin el modelo entrenado.

```bash
pip install websockets
python mock_server.py
```

Cuando el `.h5` esté listo, se sustituye la función `predecir()` por la
inferencia real y no hay que tocar la app.

---

## Sobre la red

El teléfono y el servidor tienen que estar en la misma red local. Para la feria:
**lleven su propio router o usen el teléfono como hotspot.** Depender del Wi-Fi
del local es el riesgo más grande de una demo en vivo.

La IP del servidor se configura en `src/config/server.config.js`.
