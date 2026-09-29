# -*- coding: utf-8 -*-
"""
SERVIDOR DE PRUEBAS — emite predicciones falsas por WebSocket.

Sirve para desarrollar y probar la app AHORA, sin esperar a que el modelo
este entrenado. Habla exactamente el mismo protocolo que hablara el servidor
real, asi que cuando el .h5 este listo solo hay que sustituir la funcion
`predecir()` y la app no se entera.

    pip install websockets
    python mock_server.py

Luego, en la app, poner la IP de esta maquina en src/config/server.config.js.
Para saber la IP:  ipconfig (Windows)  /  ifconfig (Linux, Mac)

===> ESTE ARCHIVO NO VA A PRODUCCION. Es el equivalente del MockSignRecognizer. <===
"""
import asyncio
import json
import math
import random
import time

import websockets

HOST = "0.0.0.0"
PORT = 8765
PATH = "/lessa"

# Las 10 clases que tendra el modelo. Cuando exista el modelo real, esto se lee
# de labels.json y NO se escribe a mano.
LABELS = [
    "NO_SIGN",
    "HOLA",
    "GRACIAS",
    "COMO ESTAS",
    "MUCHO GUSTO",
    "BIEN",
    "POR FAVOR",
    "AYUDA",
    "SI",
    "NO",
]

# Ritmo al que el servidor real emitira predicciones (una por inferencia).
PREDICCIONES_POR_SEGUNDO = 3


def predecir():
    """
    SIMULACION. Devuelve (label, confianza, margen).

    En el servidor real esta funcion hace:
        frame = leer_del_pin()
        keypoints = mediapipe.process(frame)
        buffer.append(keypoints)
        if len(buffer) == 30:
            probs = modelo.predict(np.array([buffer]))[0]
            i = probs.argmax()
            return LABELS[i], float(probs[i]), float(probs[i] - sorted(probs)[-2])
    """
    senas = [l for l in LABELS if l != "NO_SIGN"]

    # Ciclo: un rato sin sena, luego una sena con la confianza subiendo.
    fase = int(time.time() * PREDICCIONES_POR_SEGUNDO) % 18
    if fase < 6:
        return "NO_SIGN", 0.0, 0.0

    bloque = int(time.time() * PREDICCIONES_POR_SEGUNDO) // 18
    label = senas[bloque % len(senas)]
    avance = (fase - 6) / 11
    conf = min(0.97, 0.55 + avance * 0.45 + random.uniform(-0.03, 0.03))
    return label, conf, conf - (1 - conf) / len(LABELS)



# ---------------------------------------------------------------------------
# Landmarks simulados
# ---------------------------------------------------------------------------
def _mano(mx, my, t, lado):
    """21 puntos: muneca + 5 dedos x 4 articulaciones."""
    pts = [[mx, my, 0.0]]
    flex = 0.5 + math.sin(t / 5) * 0.5
    escala = 0.019
    for dedo in range(5):
        ang = (-1.25 + dedo * 0.32) * lado - math.pi / 2
        for art in range(1, 5):
            largo = escala * art * (0.75 if dedo == 0 else 1.0) * (0.7 + flex * 0.3)
            pts.append([mx + math.cos(ang) * largo, my + math.sin(ang) * largo, 0.0])
    return pts


def landmarks(t, hay_sena):
    """
    SIMULACION. Coordenadas normalizadas 0-1, igual que MediaPipe.

    En el servidor real esto NO se genera: sale directo de holistic.process(frame),
    que ya se ejecuto para alimentar al modelo.
    """
    subida = 1.0 if hay_sena else 0.0
    vaiven = math.sin(t / 4) * 0.02

    pose = [[0.0, 0.0, 0.0, 0.0] for _ in range(33)]
    pose[0]  = [0.5 + vaiven * 0.5, 0.18, 0.0, 0.95]   # nariz
    pose[11] = [0.62 + vaiven, 0.36, 0.0, 0.95]        # hombro izq
    pose[12] = [0.38 + vaiven, 0.36, 0.0, 0.95]        # hombro der
    pose[23] = [0.585 + vaiven * 0.6, 0.63, 0.0, 0.9]  # cadera izq
    pose[24] = [0.415 + vaiven * 0.6, 0.63, 0.0, 0.9]  # cadera der

    lc = [0.70 - 0.04 * subida, 0.52 - 0.05 * subida]
    lm_ = [0.68 - (0.11 - math.sin(t / 3) * 0.025) * subida,
           0.64 - (0.36 - math.cos(t / 3) * 0.018) * subida]
    pose[13] = [lc[0], lc[1], 0.0, 0.9]
    pose[15] = [lm_[0], lm_[1], 0.0, 0.9]

    rc = [0.30 + 0.02 * subida, 0.52 - 0.02 * subida]
    rm = [0.32 + (0.09 + math.sin(t / 3 + 1) * 0.018) * subida,
          0.64 - (0.21 - math.cos(t / 3 + 1) * 0.018) * subida]
    pose[14] = [rc[0], rc[1], 0.0, 0.85]
    pose[16] = [rm[0], rm[1], 0.0, 0.85]

    cara = []
    nx, ny = pose[0][0], pose[0][1]
    for i in range(26):
        a = (i / 26) * math.pi * 2
        cara.append([nx + math.cos(a) * 0.052, ny + math.sin(a) * 0.072])

    return {
        "pose": pose,
        "leftHand": _mano(lm_[0], lm_[1], t, 1) if hay_sena else None,
        "rightHand": _mano(rm[0], rm[1], t + 5, -1) if hay_sena else None,
        "face": cara,
    }


async def cliente(ws):
    print(f"  + app conectada desde {ws.remote_address[0]}")
    try:
        # El servidor anuncia su vocabulario; la app no lo supone.
        await ws.send(json.dumps({
            "type": "ready",
            "labels": LABELS,
            "model": "mock-10-clases",
            "sequenceLength": 30,
        }))

        tick = 0
        while True:
            label, conf, margen = predecir()

            if label == "NO_SIGN":
                msg = {"type": "no_sign", "ts": int(time.time() * 1000)}
            else:
                msg = {
                    "type": "prediction",
                    "label": label,
                    "confidence": round(conf, 4),
                    "margin": round(margen, 4),
                    "ts": int(time.time() * 1000),
                }

            await ws.send(json.dumps(msg))

            lm = landmarks(tick, label != "NO_SIGN")
            lm["type"] = "landmarks"
            await ws.send(json.dumps(lm))

            tick += 1
            await asyncio.sleep(1 / PREDICCIONES_POR_SEGUNDO)

    except websockets.ConnectionClosed:
        print("  - app desconectada")


async def main():
    print(f"Servidor de pruebas LESSAI en ws://{HOST}:{PORT}{PATH}")
    print(f"{len(LABELS) - 1} clases | {PREDICCIONES_POR_SEGUNDO} predicciones/s")
    print("Ctrl+C para detener\n")

    async def router(ws):
        if ws.request.path != PATH:
            await ws.close(code=1008, reason="ruta desconocida")
            return
        await cliente(ws)

    async with websockets.serve(router, HOST, PORT):
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nservidor detenido")
