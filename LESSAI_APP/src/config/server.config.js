/**
 * CONEXIÓN CON EL SERVIDOR DE RECONOCIMIENTO.
 *
 * Arquitectura:
 *
 *   ESP32-CAM  --HTTP/MJPEG-->  Servidor Python  --WebSocket-->  App móvil
 *                              192.168.4.2:8000
 *                              MediaPipe + LSTM TensorFlow/Keras
 *
 * La app NO captura el video del ESP32 ni ejecuta el modelo.
 * Solo recibe del servidor las predicciones y datos necesarios para mostrarlos.
 */

export const SERVER_CONFIG = {
  /**
   * Servidor Python.
   *
   * Red LESSAI:
   *
   *   ESP32-CAM -> 192.168.4.1
   *   Servidor  -> 192.168.4.2
   *   App       -> recibe DHCP y se conecta al servidor.
   */
  host: '192.168.4.2',
  port: 8000,

  /**
   * WebSocket del servidor Python.
   */
  path: '/app',

  /**
   * Reconexión automática.
   */
  reconnect: {
    enabled: true,
    initialDelayMs: 1000,
    maxDelayMs: 15000,
    factor: 1.6,
  },

  /**
   * Tiempo máximo sin recibir mensajes del servidor.
   */
  heartbeatTimeoutMs: 8000,

  /**
   * Vista previa enviada opcionalmente por el servidor.
   * La app nunca abre directamente el stream de la ESP32-CAM.
   */
  preview: 'websocket',

};

export function buildWsUrl(config = SERVER_CONFIG) {
  return `ws://${config.host}:${config.port}${config.path}`;
}

export default SERVER_CONFIG;