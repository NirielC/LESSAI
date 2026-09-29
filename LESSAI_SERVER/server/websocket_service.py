import json


class WebSocketManager:

    def __init__(self):
        self.clients = set()

    # ========================================================
    # CONECTAR CLIENTE
    # ========================================================

    async def connect(self, websocket):

        await websocket.accept()

        self.clients.add(websocket)

        print(
            f"[APP] Cliente conectado. "
            f"Clientes: {len(self.clients)}"
        )

    # ========================================================
    # DESCONECTAR CLIENTE
    # ========================================================

    def disconnect(self, websocket):

        self.clients.discard(websocket)

        print(
            f"[APP] Cliente desconectado. "
            f"Clientes: {len(self.clients)}"
        )

    # ========================================================
    # ENVIAR A TODOS
    # ========================================================

    async def broadcast(self, message):

        if not self.clients:
            return

        data = json.dumps(
            message,
            ensure_ascii=False
        )

        disconnected = []

        for websocket in list(self.clients):

            try:
                await websocket.send_text(data)

            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(websocket)