import { SignRecognizer, NO_SIGN } from './SignRecognizer';
import manifest from '../models/model.manifest.json';

/**
 * MOTOR SIMULADO — SOLO PARA LA DEMO VISUAL.
 *
 * No hay IA aqui. Reproduce un guion realista para poder grabar la interfaz:
 * pausas sin deteccion, subida y bajada de confianza, y la clase cambiando.
 * Las clases salen del manifiesto, no de constantes escritas en la app, para
 * que sustituirlo por el motor real no cambie una sola linea de UI.
 *
 * ===> ESTE ARCHIVO SE BORRA (o se deja solo para tests) CUANDO ENTRE EL MODELO REAL. <===
 */
export class MockSignRecognizer extends SignRecognizer {
  constructor(options = {}) {
    super();
    this._labels = manifest.labels ?? [NO_SIGN];
    this._spec = {
      sequenceLength: manifest.input?.sequenceLength ?? 30,
      featureSize: manifest.input?.featureSize ?? 258,
    };
    this._ready = false;
    this._tick = 0;
    // Guion: indices sobre las clases "reales" (sin contar NO_SIGN).
    this._script = options.script ?? null;
    this._scriptStep = 0;
  }

  get id() {
    return 'mock';
  }

  get isReady() {
    return this._ready;
  }

  get modelName() {
    return `${manifest.name} (simulado)`;
  }

  async load() {
    if (this._ready) return;
    // Latencia artificial para que la UI muestre su estado de carga real.
    await new Promise((r) => setTimeout(r, 650));
    this._ready = true;
  }

  getLabels() {
    return this._labels;
  }

  getInputSpec() {
    return this._spec;
  }

  /** Clases distintas de NO_SIGN, en el orden del modelo. */
  _signLabels() {
    return this._labels.filter((l) => l !== NO_SIGN);
  }

  /**
   * Simula la inferencia. El "guion" alterna bloques:
   *   ~6 ciclos sin deteccion -> ~10 ciclos de una clase con confianza creciente
   * De esta forma el estabilizador y el cooldown se ejercitan de verdad.
   */
  async predict(sequence) {
    const started = Date.now();
    await new Promise((r) => setTimeout(r, 18 + Math.random() * 40));

    this._tick += 1;
    const CYCLE = 16;
    const phase = this._tick % CYCLE;
    const signs = this._signLabels();

    // Bloque sin deteccion: manos bajando / transicion entre senas.
    if (phase < 5 || signs.length === 0) {
      return this._buildResult(NO_SIGN, 0.12 + Math.random() * 0.1, started);
    }

    // Bloque con sena: la confianza sube como lo haria un modelo real.
    const blockIndex = Math.floor(this._tick / CYCLE);
    const label = signs[blockIndex % signs.length];
    const progress = (phase - 5) / (CYCLE - 5);
    const confidence = Math.min(
      0.97,
      0.55 + progress * 0.45 + (Math.random() - 0.5) * 0.06
    );

    return this._buildResult(label, confidence, started);
  }

  _buildResult(label, confidence, started) {
    const probabilities = this._labels.map((l) => {
      if (l === label) return confidence;
      // Resto repartido con algo de ruido, como una softmax de verdad.
      return ((1 - confidence) / Math.max(1, this._labels.length - 1)) * (0.6 + Math.random() * 0.8);
    });

    const sorted = [...probabilities].sort((a, b) => b - a);
    return {
      label,
      confidence,
      margin: sorted[0] - (sorted[1] ?? 0),
      isNoSign: label === NO_SIGN,
      probabilities,
      inferenceMs: Date.now() - started,
    };
  }

  async dispose() {
    this._ready = false;
    this._tick = 0;
  }
}

export default MockSignRecognizer;
