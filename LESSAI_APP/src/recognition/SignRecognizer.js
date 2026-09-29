/**
 * CONTRATO DEL MOTOR DE RECONOCIMIENTO.
 *
 * Toda la app habla con esta interfaz y con nada mas. Ni las pantallas ni el
 * estabilizador ni la conversacion saben si detras hay un mock, un .tflite,
 * tfjs o un endpoint remoto.
 *
 * @typedef {Object} InputSpec
 * @property {number} sequenceLength  Frames que espera el modelo.
 * @property {number} featureSize     Features por frame.
 *
 * @typedef {Object} RecognitionResult
 * @property {string|null} label      Clase top-1 tal cual la devuelve el modelo.
 * @property {number} confidence      Probabilidad de la clase top-1, 0..1.
 * @property {number} margin          Diferencia top1 - top2. Util contra empates.
 * @property {boolean} isNoSign       true si el modelo dice "no hay sena".
 * @property {number[]} probabilities Distribucion completa, alineada con getLabels().
 * @property {number} inferenceMs     Latencia medida de la inferencia.
 */

export const NO_SIGN = 'NO_SIGN';

export class SignRecognizer {
  /** Identificador legible del motor. Se muestra en Ajustes. */
  get id() {
    return 'abstract';
  }

  /** true cuando load() termino y predict() puede llamarse. */
  get isReady() {
    return false;
  }

  /** Carga pesos / inicializa el runtime. Idempotente. */
  async load() {
    throw new Error('SignRecognizer.load() no implementado');
  }

  /**
   * Clases del modelo. NUNCA se hardcodean en la UI.
   * @returns {string[]}
   */
  getLabels() {
    throw new Error('SignRecognizer.getLabels() no implementado');
  }

  /** @returns {InputSpec} */
  getInputSpec() {
    throw new Error('SignRecognizer.getInputSpec() no implementado');
  }

  /**
   * @param {Float32Array|number[][]} sequence Ventana temporal [sequenceLength][featureSize]
   * @returns {Promise<RecognitionResult>}
   */
  async predict(sequence) {
    throw new Error('SignRecognizer.predict() no implementado');
  }

  /** Libera memoria / interpreter. Debe poder llamarse varias veces. */
  async dispose() {}
}

/** Construye un resultado "sin deteccion" consistente. */
export function noSignResult(labels = [], inferenceMs = 0) {
  return {
    label: NO_SIGN,
    confidence: 0,
    margin: 0,
    isNoSign: true,
    probabilities: labels.map((l) => (l === NO_SIGN ? 1 : 0)),
    inferenceMs,
  };
}

export default SignRecognizer;
