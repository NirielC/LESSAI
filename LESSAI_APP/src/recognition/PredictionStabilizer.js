import { NO_SIGN } from './SignRecognizer';

/**
 * ESTABILIZADOR DE PREDICCIONES — evita el clasico HOLA -> HOLA -> HOLA -> HOLA.
 *
 * Maquina de estados que consume resultados crudos del modelo y decide cuando
 * (y si) una sena merece convertirse en mensaje.
 *
 *   IDLE ──(confianza + margen)──► CANDIDATE
 *   CANDIDATE ──(N frames iguales)──► COMMITTED  [emite mensaje]
 *   COMMITTED ──(cooldownMs)──► LATCHED
 *   LATCHED ──(otra clase confirmada  |  M frames sin sena)──► IDLE
 *
 * Las cuatro barreras, en orden:
 *   1. confidenceThreshold  -> descarta ruido de baja probabilidad.
 *   2. minTopMargin         -> descarta empates entre dos clases.
 *   3. stabilityFrames      -> exige que la prediccion se sostenga.
 *   4. cooldownMs + latch   -> impide repetir la misma sena sin un cambio real.
 */

export const RecognitionState = {
  IDLE: 'idle',
  CANDIDATE: 'candidate',
  COMMITTED: 'committed',
  COOLDOWN: 'cooldown',
  LATCHED: 'latched',
};

export class PredictionStabilizer {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.state = RecognitionState.IDLE;
    this.candidateLabel = null;
    this.candidateStreak = 0;
    this.noSignStreak = 0;
    this.lastCommittedLabel = null;
    this.lastCommittedAt = 0;
    this.progress = 0;
    this.lastConfidence = 0;
  }

  /** Permite ajustar parametros en caliente desde Ajustes sin recrear el objeto. */
  updateConfig(config) {
    this.config = config;
  }

  /**
   * @param {import('./SignRecognizer').RecognitionResult} result
   * @param {number} now timestamp ms
   * @returns {{ state: string, committed: null|{label:string,confidence:number,at:number},
   *             activeLabel: string|null, confidence: number, progress: number,
   *             latchedLabel: string|null }}
   */
  push(result, now = Date.now()) {
    const c = this.config;
    const noSignLabel = c.noSignLabel ?? NO_SIGN;
    let committed = null;

    // ---------- 1. Sin deteccion ----------
    const isNoSign = !result || result.isNoSign || result.label === noSignLabel || result.label == null;

    if (isNoSign) {
      this.noSignStreak += 1;
      this.candidateLabel = null;
      this.candidateStreak = 0;
      this.progress = 0;
      this.lastConfidence = 0;

      // Suficientes frames vacios => la persona bajo las manos: se libera el latch.
      if (this.noSignStreak >= c.releaseOnNoSignFrames) {
        this.lastCommittedLabel = null;
        this.state = RecognitionState.IDLE;
      } else if (this.state !== RecognitionState.LATCHED) {
        this.state = this._coolingDown(now) ? RecognitionState.COOLDOWN : RecognitionState.IDLE;
      }
      return this._snapshot(committed);
    }

    this.noSignStreak = 0;
    this.lastConfidence = result.confidence;

    // ---------- 2. Cooldown duro: no se acepta nada ----------
    if (this._coolingDown(now)) {
      this.state = RecognitionState.COOLDOWN;
      this.candidateStreak = 0;
      this.candidateLabel = null;
      this.progress = 0;
      return this._snapshot(committed);
    }

    // ---------- 3. Barreras de calidad ----------
    const passesConfidence = result.confidence >= c.confidenceThreshold;
    const passesMargin = (result.margin ?? 1) >= c.minTopMargin;

    if (!passesConfidence || !passesMargin) {
      this.candidateStreak = 0;
      this.candidateLabel = null;
      this.progress = 0;
      this.state = this._latchedOrIdle();
      return this._snapshot(committed);
    }

    // ---------- 4. Latch: la misma sena necesita un cambio real antes de repetirse ----------
    if (
      c.requireChangeBeforeRepeat &&
      this.lastCommittedLabel &&
      result.label === this.lastCommittedLabel
    ) {
      this.state = RecognitionState.LATCHED;
      this.progress = 0;
      return this._snapshot(committed);
    }

    // ---------- 5. Estabilidad: la prediccion debe sostenerse ----------
    if (result.label === this.candidateLabel) {
      this.candidateStreak += 1;
    } else {
      this.candidateLabel = result.label;
      this.candidateStreak = 1;
    }

    this.progress = Math.min(1, this.candidateStreak / c.stabilityFrames);

    if (this.candidateStreak >= c.stabilityFrames) {
      committed = { label: result.label, confidence: result.confidence, at: now };
      this.lastCommittedLabel = result.label;
      this.lastCommittedAt = now;
      this.candidateLabel = null;
      this.candidateStreak = 0;
      this.progress = 1;
      this.state = RecognitionState.COMMITTED;
    } else {
      this.state = RecognitionState.CANDIDATE;
    }

    return this._snapshot(committed);
  }

  _coolingDown(now) {
    return this.lastCommittedAt > 0 && now - this.lastCommittedAt < this.config.cooldownMs;
  }

  _latchedOrIdle() {
    return this.lastCommittedLabel && this.config.requireChangeBeforeRepeat
      ? RecognitionState.LATCHED
      : RecognitionState.IDLE;
  }

  _snapshot(committed) {
    return {
      state: this.state,
      committed,
      activeLabel: this.candidateLabel,
      confidence: this.lastConfidence,
      progress: this.progress,
      latchedLabel: this.lastCommittedLabel,
      noSignStreak: this.noSignStreak,
    };
  }
}

export default PredictionStabilizer;
