/**
 * CONTRATO DE LA FUENTE DE SEÑAS (modelo push).
 *
 * Sustituye a `SignRecognizer` cuando el reconocimiento NO ocurre en el
 * telefono. El servidor empuja predicciones; la app se suscribe.
 *
 * Por que una interfaz nueva y no reutilizar SignRecognizer:
 * `SignRecognizer.predict(sequence)` es pull —la app decidia cuando inferir—
 * y aqui la app no tiene la secuencia ni decide nada. Forzar un socket dentro
 * de una firma pull obliga a inventar un buffer falso y a mentir sobre la
 * latencia. Dos interfaces honestas son mejores que una retorcida.
 *
 * @typedef {Object} SourceEvent
 * @property {'status'|'prediction'|'no_sign'|'frame'|'landmarks'|'error'} type
 * @property {string} [state]        status: connecting|ready|reconnecting|offline
 * @property {string} [label]        prediction: clase tal cual la devuelve el modelo
 * @property {number} [confidence]   prediction: 0..1
 * @property {number} [margin]       prediction: top1 - top2
 * @property {string[]} [labels]     status: vocabulario del modelo cargado
 * @property {string} [jpegBase64]   frame: preview del pin
 * @property {object} [landmarks]    frame|landmarks: puntos clave en formato de red
 * @property {string} [message]      error
 * @property {number} [ts]
 */

export const SourceState = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  READY: 'ready',
  RECONNECTING: 'reconnecting',
  OFFLINE: 'offline',
  ERROR: 'error',
};

export class SignSource {
  get id() {
    return 'abstract';
  }

  /** @param {(event: SourceEvent) => void} onEvent */
  connect(onEvent) {
    throw new Error('SignSource.connect() no implementado');
  }

  disconnect() {
    throw new Error('SignSource.disconnect() no implementado');
  }

  /** Vocabulario que anuncio el servidor. Nunca se escribe en la app. */
  getLabels() {
    return [];
  }
}

export default SignSource;
