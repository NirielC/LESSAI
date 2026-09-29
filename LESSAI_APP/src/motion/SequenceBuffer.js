/**
 * VENTANA TEMPORAL DESLIZANTE.
 *
 * El reconocimiento de senas es temporal: una foto aislada no distingue
 * "HOLA" de "GRACIAS". Este buffer acumula los ultimos N frames de features y
 * entrega la ventana que espera el modelo.
 *
 * Usa un ring buffer para no reasignar arrays 15 veces por segundo.
 */
export class SequenceBuffer {
  /**
   * @param {number} length  frames de la ventana (= manifest.input.sequenceLength)
   * @param {number} featureSize features por frame
   */
  constructor(length, featureSize) {
    this.length = length;
    this.featureSize = featureSize;
    this._frames = new Array(length).fill(null);
    this._valid = new Array(length).fill(false);
    this._head = 0;
    this._count = 0;
    this._framesSinceLastRead = 0;
  }

  /** Reconfigura si cambia el modelo o el usuario mueve el slider de Ajustes. */
  resize(length, featureSize = this.featureSize) {
    if (length === this.length && featureSize === this.featureSize) return;
    this.length = length;
    this.featureSize = featureSize;
    this.clear();
  }

  /**
   * @param {number[]} features vector de features del frame
   * @param {boolean} isValid   false si no se detectaron manos en ese frame
   */
  push(features, isValid = true) {
    this._frames[this._head] = features;
    this._valid[this._head] = isValid;
    this._head = (this._head + 1) % this.length;
    this._count = Math.min(this._count + 1, this.length);
    this._framesSinceLastRead += 1;
  }

  get isFull() {
    return this._count >= this.length;
  }

  get fillRatio() {
    return this._count / this.length;
  }

  /** Proporcion de frames con manos visibles. Si es baja, no vale la pena inferir. */
  get validRatio() {
    if (this._count === 0) return 0;
    let valid = 0;
    for (let i = 0; i < this.length; i += 1) if (this._valid[i]) valid += 1;
    return valid / this._count;
  }

  get framesSinceLastRead() {
    return this._framesSinceLastRead;
  }

  /**
   * Decide si toca inferir: buffer lleno, suficientes frames validos y stride cumplido.
   * Asi la inferencia NO corre en cada frame.
   */
  shouldInfer(config) {
    return (
      this.isFull &&
      this.validRatio >= config.minValidFramesRatio &&
      this._framesSinceLastRead >= config.inferenceStrideFrames
    );
  }

  /** Devuelve la ventana en orden cronologico y marca el stride como consumido. */
  read() {
    const out = new Array(this.length);
    for (let i = 0; i < this.length; i += 1) {
      out[i] = this._frames[(this._head + i) % this.length] ?? new Array(this.featureSize).fill(0);
    }
    this._framesSinceLastRead = 0;
    return out;
  }

  clear() {
    this._frames = new Array(this.length).fill(null);
    this._valid = new Array(this.length).fill(false);
    this._head = 0;
    this._count = 0;
    this._framesSinceLastRead = 0;
  }
}

export default SequenceBuffer;
