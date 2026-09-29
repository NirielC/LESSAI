 /**
  * PARÁMETROS DE INTERPRETACIÓN DE PREDICCIONES.
  *
  * El reconocimiento ocurre en el servidor Python:
  *
  *   ESP32-CAM
  *       ↓
  *   MediaPipe
  *       ↓
  *   LSTM TensorFlow/Keras
  *       ↓
  *   WebSocket
  *       ↓
  *   App
  *
  * La app NO ejecuta el modelo.
  * Estos valores controlan únicamente cómo la app interpreta
  * y presenta las predicciones recibidas.
  */

export const RECOGNITION_CONFIG = {
  // ---------- Validación de la predicción ----------

  /** Confianza mínima para que la app considere candidata una predicción recibida. */
  confidenceThreshold: 0.82,

  /** Predicciones consecutivas iguales necesarias para confirmar una señal. */
  stabilityFrames: 4,

  /** Margen mínimo entre top-1 y top-2 para evitar predicciones ambiguas. */
  minTopMargin: 0.15,

  // ---------- Anti-repetición ----------

  /** Tiempo de espera después de confirmar una señal. */
  cooldownMs: 1400,

  /**
   * No aceptar nuevamente la misma señal hasta detectar un cambio real.
   */
  requireChangeBeforeRepeat: true,

  /** Predicciones sin señal necesarias para liberar la última señal. */
  releaseOnNoSignFrames: 8,

  // ---------- Sin detección ----------

  /** Etiqueta reservada para el estado sin seña. */
  noSignLabel: 'NO_SIGN',

  /** Reserva para UX; la señal real de no-seña llega desde el servidor. */
  noSignGraceFrames: 6,

  // ---------- UX ----------

  /** Reproducir automáticamente por voz cada señal confirmada. */
  autoSpeak: false,

  /** Vibración corta al confirmar una señal. */
  hapticsOnCommit: true,

  /** Mostrar landmarks recibidos desde el servidor, si están disponibles. */
  showLandmarks: true,

  /** Mostrar información técnica como confianza, FPS o latencia. */
  showTelemetry: true,
};

/**
 * Rangos permitidos para los controles de Ajustes.
 *
 * Solo se mantienen parámetros que realmente pertenecen
 * a la interpretación y presentación de las predicciones.
 */
export const CONFIG_BOUNDS = {
  confidenceThreshold: {
    min: 0.5,
    max: 0.99,
    step: 0.01,
    format: (v) => `${Math.round(v * 100)}%`,
  },

  stabilityFrames: {
    min: 1,
    max: 12,
    step: 1,
    format: (v) => `${v} frames`,
  },

  cooldownMs: {
    min: 400,
    max: 4000,
    step: 100,
    format: (v) => `${(v / 1000).toFixed(1)} s`,
  },
};

export default RECOGNITION_CONFIG;