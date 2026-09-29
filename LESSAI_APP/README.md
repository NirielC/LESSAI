# LESSAI_APP

Aplicación móvil del proyecto LESSAI. React Native + Expo **SDK 57**.

Es la parte que ve la **persona oyente**: el pin capta las señas, el servidor las
reconoce y esta app muestra el significado en texto, lo reproduce en voz alta y
permite responder hablando.

```
Pin (ESP32-CAM) ──HTTP/MJPEG──> LESSAI_SERVER ──WebSocket──> LESSAI_APP
                                MediaPipe + LSTM
```

La app **no** captura video ni ejecuta el modelo. Solo se suscribe al servidor.

---

## Configuración paso a paso

### 1. Instalar

```bash
cd LESSAI_APP
npm install
```

Tarda un par de minutos. Descarga 522 paquetes. No hace falta nada más:
`node_modules` no está en el repo a propósito.

### 2. Averiguar la IP del servidor

En la máquina donde va a correr `LESSAI_SERVER`:

```bash
ipconfig
```

Buscar **"Dirección IPv4"** del adaptador Wi-Fi. Algo como `192.168.1.107`.
No sirve `127.0.0.1` si la app va a correr en un teléfono: para el teléfono,
`127.0.0.1` es él mismo.

### 3. Poner esa IP en la app

Abrir `src/config/server.config.js` y cambiar una línea:

```js
host: '192.168.1.107',   // <- la IP del paso 2
port: 8765,
```

| Dónde corre la app | Qué poner en `host` |
|---|---|
| Teléfono real (Expo Go) | La IP de la máquina del servidor |
| Navegador, con el servidor en la misma PC | `127.0.0.1` |
| Emulador de Android | `10.0.2.2` |

### 4. Levantar el servidor

Mientras `LESSAI_SERVER` no esté listo, se puede usar el servidor de pruebas
que viene incluido. Emite predicciones y landmarks falsos, pero habla el mismo
protocolo:

```bash
pip install websockets
python server/mock_server.py
```

Debe imprimir `Servidor de pruebas LESSAI en ws://0.0.0.0:8765/lessa`.

### 5. Arrancar la app

```bash
npx expo start
```

Escanear el QR con **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / iOS),
o pulsar `a` para emulador Android, `w` para navegador.

**El teléfono y el servidor tienen que estar en la misma red Wi-Fi.**

### 6. Comprobar que funciona

En la pantalla LESSA, arriba, debe aparecer **"Pin conectado"** en verde. Si
dice "Sin conexión" o "Reconectando", revisar el paso 3 y que el firewall de
Windows no esté bloqueando el puerto 8765.

---

## Cuando el modelo real esté listo

No hay que tocar la app. Solo:

1. `LESSAI_SERVER` carga el `.h5` y emite predicciones reales por WebSocket.
2. En el handshake anuncia su vocabulario (`labels`).
3. La app muestra esas clases, sean 10 o 40.

**Las señas no están escritas en ningún lado de la app.** Vienen del servidor.
Si el modelo gana clases, la app se adapta sola.

La especificación completa está en [`server/PROTOCOLO.md`](server/PROTOCOLO.md).
Es lo que hay que leer para programar `LESSAI_SERVER`.

---

## Modo de respaldo para la feria

En `src/config/server.config.js`:

```js
export const APP_MODE = 'server';   // 'server' | 'demo'
```

Con `'demo'` la app corre **entera dentro del teléfono, sin red**: reconocimiento
simulado, cámara del teléfono, landmarks generados. No reconoce nada de verdad,
pero se ve igual.

Es el plan B si la Wi-Fi de la feria falla. Cambiar una palabra y recargar.

---

## Estructura

```
src/
├── recognition/   WebSocketSignSource, useSignStream, estabilizador anti-repetición
├── conversation/  estado compartido de los dos canales (señas y voz)
├── speech/        voz a texto
├── tts/           texto a voz
├── screens/       LESSA · Voz · Historial · Ayuda · Ajustes
├── components/    biblioteca visual
├── config/        tema, servidor y parámetros del reconocimiento
├── camera/        solo para el modo demo
├── motion/        overlay de landmarks
└── models/        solo para el modo demo

server/
├── PROTOCOLO.md   contrato servidor ↔ app
└── mock_server.py servidor de pruebas
```

---

## Por qué no se repiten las señas

El servidor manda unas 3 predicciones por segundo. Sin filtro, mantener una seña
produciría decenas de mensajes iguales. La app aplica cuatro barreras seguidas,
todas en `src/recognition/PredictionStabilizer.js`:

| Barrera | Descarta |
|---|---|
| Umbral de confianza | ruido de baja probabilidad |
| Margen top-1 / top-2 | empates entre dos señas parecidas |
| Estabilidad | predicciones que no se sostienen |
| Cooldown + bloqueo | repeticiones de la misma seña |

Verificado por simulación con los valores por defecto: mantener `HOLA` 60 ciclos
seguidos produce **1 mensaje**, no 60.

Todos los parámetros se ajustan en vivo desde la pantalla de Ajustes.

---

## Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| "Sin conexión" en rojo | IP mal puesta | Paso 3 |
| Conecta y a los segundos se cae | Firewall bloquea el 8765 | Permitir Python en el firewall de Windows |
| Errores raros tras mover archivos | Caché de Metro | `npx expo start -c` |
| `Cannot find module` al arrancar | Falta instalar | `npm install` |
| Funciona en navegador pero no en el teléfono | `host` en `127.0.0.1` | Poner la IP real |

---

## Lo que falta

- [ ] `LESSAI_SERVER` real (los archivos están vacíos todavía)
- [ ] Modelo `.h5` entrenado con las 10 clases
- [ ] Voz a texto real — necesita **Development Build**, no funciona en Expo Go
      (`npx expo prebuild && npx expo run:android`)
- [ ] Persistencia del historial (el adaptador ya existe en `src/services/storage.js`)
- [ ] Iconos y splash propios

### Nota sobre el `.h5`

React Native **no** ejecuta archivos `.h5`: es un formato del runtime de Python.
Por eso el modelo vive en el servidor. Si algún día se quiere meter dentro del
teléfono para funcionar sin red, hay que convertirlo a TensorFlow Lite y hacer
un Development Build — ver `src/models/README.md`.
