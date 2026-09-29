/**
 * CONTRATO DE SPEECH-TO-TEXT.
 *
 * Igual que con el reconocedor de senas, la pantalla no sabe que motor hay
 * detras. Implementaciones previstas:
 *   - MockSpeechToTextService  (demo visual, Expo Go)
 *   - ExpoSpeechRecognitionService (`expo-speech-recognition`, Development Build)
 *   - Servicio en la nube (Google STT / Whisper) si se necesita mas precision
 *
 * @typedef {Object} SttEvent
 * @property {'partial'|'final'|'error'|'start'|'end'|'volume'} type
 * @property {string} [text]
 * @property {number} [confidence]
 * @property {number} [volume]  0..1, para el visualizador de onda
 * @property {string} [message]
 */

export const SttState = {
  IDLE: 'idle',
  REQUESTING_PERMISSION: 'requesting',
  PERMISSION_DENIED: 'denied',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  ERROR: 'error',
};

export class SpeechToTextService {
  get id() {
    return 'abstract';
  }

  /** @returns {Promise<boolean>} */
  async requestPermission() {
    throw new Error('SpeechToTextService.requestPermission() no implementado');
  }

  /** @param {(event: SttEvent) => void} onEvent */
  async start(onEvent, options) {
    throw new Error('SpeechToTextService.start() no implementado');
  }

  async stop() {
    throw new Error('SpeechToTextService.stop() no implementado');
  }

  /** Cancela sin emitir resultado final. */
  async abort() {}

  dispose() {}
}

export default SpeechToTextService;
