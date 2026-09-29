/**
 * CONEXION CON EL SERVIDOR DE RECONOCIMIENTO.
 *
 * Arquitectura real del proyecto:
 *
 *   Pin (ESP32-CAM)  --HTTP/MJPEG-->  Servidor Python  --WebSocket-->  App movil
 *                                     (MediaPipe + LSTM)
 *
 * La app NO captura video ni ejecuta el modelo: solo se suscribe a lo que el
 * servidor va reconociendo y lo muestra a la persona oyente.
 */

/**
 * MODO DE LA APP.
 *
 *   'server' -> real: el pin captura, el servidor reconoce, la app muestra.
 *   'demo'   -> simulado: todo dentro del telefono, sin red. Es el respaldo
 *               para la feria si la Wi-Fi falla, y lo que usan las capturas.
 */
export const APP_MODE = 'server';

export const SERVER_CONFIG = {
  /**
   * Host del servidor Python en la red local.
   *
   *   Telefono real  -> la IP de la maquina que corre el servidor (ipconfig)
   *   Navegador      -> '127.0.0.1'
   *   Emulador Android -> '10.0.2.2'  (127.0.0.1 apunta al propio emulador)
   *
   * En la feria conviene fijar una IP estatica o usar el hotspot del telefono.
   */
  host: '192.168.1.100',
  port: 8765,

  /** Ruta del WebSocket. */
  path: '/lessa',

  /** Reintentos de conexion: empieza en 1 s y va subiendo hasta el maximo. */
  reconnect: {
    enabled: true,
    initialDelayMs: 1000,
    maxDelayMs: 15000,
    factor: 1.6,
  },

  /**
   * Si en este tiempo no llega NINGUN mensaje del servidor, se considera
   * la conexion muerta aunque el socket siga abierto (el caso tipico de
   * una Wi-Fi que se cae sin cerrar el socket).
   */
  heartbeatTimeoutMs: 8000,

  /**
   * Preview del pin. Si el servidor reenvia los frames por el mismo WebSocket
   * (mensaje `frame`), dejar en 'websocket'. Si se quiere leer el MJPEG
   * directamente del ESP32, poner 'mjpeg' y rellenar `pinStreamUrl`.
   */
  preview: 'websocket', // 'websocket' | 'mjpeg' | 'none'
  pinStreamUrl: 'http://192.168.1.50:81/stream',
};

export function buildWsUrl(config = SERVER_CONFIG) {
  return `ws://${config.host}:${config.port}${config.path}`;
}

export default SERVER_CONFIG;
