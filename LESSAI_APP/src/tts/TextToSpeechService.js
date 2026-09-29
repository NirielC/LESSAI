/**
 * TEXT-TO-SPEECH.
 *
 * Envuelve expo-speech con carga perezosa: si el modulo nativo no esta
 * disponible, la app sigue funcionando y el servicio reporta `unavailable`
 * en vez de romper la pantalla.
 */
export class TextToSpeechService {
  constructor({ language = 'es-ES', rate = 0.95, pitch = 1.0 } = {}) {
    this.language = language;
    this.rate = rate;
    this.pitch = pitch;
    this._speech = null;
    this._available = null;
  }

  get id() {
    return 'expo-speech';
  }

  _module() {
    if (this._speech) return this._speech;
    try {
      this._speech = require('expo-speech');
      this._available = true;
    } catch {
      this._available = false;
      this._speech = null;
    }
    return this._speech;
  }

  get isAvailable() {
    if (this._available === null) this._module();
    return Boolean(this._available);
  }

  /**
   * @param {string} text
   * @param {{onStart?:Function, onDone?:Function, onError?:Function}} handlers
   */
  speak(text, handlers = {}) {
    const Speech = this._module();
    if (!Speech || !text) {
      handlers.onError?.(new Error('Text-to-Speech no disponible en este entorno'));
      return false;
    }
    Speech.stop();
    Speech.speak(text, {
      language: this.language,
      rate: this.rate,
      pitch: this.pitch,
      onStart: handlers.onStart,
      onDone: handlers.onDone,
      onStopped: handlers.onDone,
      onError: handlers.onError,
    });
    return true;
  }

  stop() {
    this._module()?.stop?.();
  }

  setLanguage(language) {
    this.language = language;
  }

  setRate(rate) {
    this.rate = rate;
  }
}

/** Instancia compartida: no tiene sentido tener varias colas de voz. */
let singleton = null;
export function getTextToSpeech() {
  if (!singleton) singleton = new TextToSpeechService();
  return singleton;
}

export default getTextToSpeech;
