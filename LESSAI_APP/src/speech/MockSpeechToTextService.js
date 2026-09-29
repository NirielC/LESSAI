import SpeechToTextService from './SpeechToTextService';

/**
 * STT SIMULADO — SOLO PARA LA DEMO VISUAL.
 *
 * No abre el microfono. Reproduce una frase palabra por palabra con eventos
 * `partial` y un `final`, mas un nivel de volumen sintetico para animar la onda.
 * Sirve para grabar la pantalla de voz exactamente como se vera.
 *
 * ===> SE SUSTITUYE POR ExpoSpeechRecognitionService EN EL DEVELOPMENT BUILD. <===
 */
const DEMO_PHRASES = [
  'Hola, buenos dias. En que le puedo ayudar?',
  'Claro, permitame revisar su expediente.',
  'Su cita quedo programada para el jueves a las diez.',
  'Mucho gusto, que tenga un excelente dia.',
  'Necesita que le explique el procedimiento otra vez?',
];

export class MockSpeechToTextService extends SpeechToTextService {
  constructor() {
    super();
    this._timers = [];
    this._index = 0;
    this._onEvent = null;
    this._active = false;
  }

  get id() {
    return 'mock';
  }

  async requestPermission() {
    await new Promise((r) => setTimeout(r, 300));
    return true;
  }

  async start(onEvent) {
    this._clear();
    this._onEvent = onEvent;
    this._active = true;

    const phrase = DEMO_PHRASES[this._index % DEMO_PHRASES.length];
    this._index += 1;
    const words = phrase.split(' ');

    onEvent?.({ type: 'start' });

    // Nivel de volumen para el visualizador de onda.
    const volumeTimer = setInterval(() => {
      if (!this._active) return;
      onEvent?.({ type: 'volume', volume: 0.25 + Math.random() * 0.65 });
    }, 110);
    this._timers.push(volumeTimer);

    // Transcripcion progresiva.
    words.forEach((_, i) => {
      const t = setTimeout(() => {
        if (!this._active) return;
        onEvent?.({ type: 'partial', text: words.slice(0, i + 1).join(' ') });
      }, 260 * (i + 1));
      this._timers.push(t);
    });

    const finalTimer = setTimeout(() => {
      if (!this._active) return;
      onEvent?.({ type: 'final', text: phrase, confidence: 0.93 });
      this._active = false;
      this._clear();
      onEvent?.({ type: 'end' });
    }, 260 * (words.length + 1.5));
    this._timers.push(finalTimer);
  }

  async stop() {
    if (!this._active) return;
    this._active = false;
    this._clear();
    this._onEvent?.({ type: 'end' });
  }

  async abort() {
    this._active = false;
    this._clear();
  }

  _clear() {
    this._timers.forEach(clearTimeout);
    this._timers.forEach(clearInterval);
    this._timers = [];
  }

  dispose() {
    this.abort();
    this._onEvent = null;
  }
}

export default MockSpeechToTextService;
