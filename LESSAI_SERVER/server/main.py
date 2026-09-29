import asyncio
from contextlib import asynccontextmanager

import uvicorn
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
)

from config import (
    SERVER_HOST,
    SERVER_PORT,
)

from camera_service import CameraService
from model_service import ModelService
from websocket_service import WebSocketManager


# ============================================================
# SERVICIOS
# ============================================================

camera = CameraService()

websockets = WebSocketManager()

event_loop = None


def handle_prediction(message):

    if event_loop is None:
        return

    asyncio.run_coroutine_threadsafe(
        websockets.broadcast(message),
        event_loop,
    )


model = ModelService(
    camera_service=camera,
    on_prediction=handle_prediction,
)


# ============================================================
# CICLO DE VIDA
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    global event_loop

    event_loop = asyncio.get_running_loop()

    print("=" * 60)
    print("LESSAI - SERVIDOR")
    print("=" * 60)

    camera.start()
    model.start()

    print("[SERVER] Servicios iniciados.")

    try:

        yield

    finally:

        print("[SERVER] Cerrando servicios...")

        model.stop()
        camera.stop()

        print("[SERVER] Servidor detenido.")


app = FastAPI(
    title="LESSAI Server",
    lifespan=lifespan,
)


# ============================================================
# WEBSOCKET
# ============================================================

@app.websocket("/app")
async def websocket_app(
    websocket: WebSocket,
):

    await websockets.connect(
        websocket
    )

    await websocket.send_json({
        "type": "status",
        "esp": camera.online,
        "model": model.available,
    })

    try:

        while True:

            data = await websocket.receive_json()

            if data.get("type") == "reset":

                model.reset_sentence()

                await websockets.broadcast({
                    "type": "prediction",
                    "sign": "",
                    "confidence": 0,
                    "sentence": [],
                })

    except WebSocketDisconnect:

        websockets.disconnect(
            websocket
        )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    uvicorn.run(
        "main:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=False,
    )
    