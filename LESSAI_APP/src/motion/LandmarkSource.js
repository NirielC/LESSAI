/**
 * CONTRATO DE LA FUENTE DE LANDMARKS.
 *
 * @typedef {{x:number, y:number, z?:number, visibility?:number}} Landmark
 * @typedef {Object} LandmarkFrame
 * @property {Landmark[]} pose       33 puntos (MediaPipe Pose)
 * @property {Landmark[]|null} leftHand   21 puntos
 * @property {Landmark[]|null} rightHand  21 puntos
 * @property {Landmark[]} face       subconjunto para el overlay
 * @property {boolean} hasHands
 * @property {number} timestamp
 *
 * Implementaciones:
 *   - MockLandmarkSource      (demo visual, corre en Expo Go)
 *   - MediaPipeLandmarkSource (pendiente: Development Build + frame processor)
 *
 * MediaPipe NO corre dentro de Expo Go. La via real es un Development Build con
 * react-native-vision-camera + un frame processor que llame a MediaPipe Tasks
 * (HolisticLandmarker), o un modulo nativo propio. Esta interfaz existe para que
 * ese cambio no toque ni la UI ni el pipeline.
 */
export class LandmarkSource {
  get id() {
    return 'abstract';
  }

  /** @param {(frame: LandmarkFrame) => void} onFrame */
  start(onFrame) {
    throw new Error('LandmarkSource.start() no implementado');
  }

  stop() {
    throw new Error('LandmarkSource.stop() no implementado');
  }

  /**
   * Aplana un frame al vector que consume el modelo.
   * Debe coincidir con manifest.input.featureComposition.
   * @param {LandmarkFrame} frame
   * @returns {number[]}
   */
  static toFeatureVector(frame, featureSize = 258) {
    const out = new Array(featureSize).fill(0);
    let i = 0;
    const write = (points, count, dims) => {
      for (let p = 0; p < count; p += 1) {
        const lm = points?.[p];
        out[i] = lm ? lm.x : 0;
        out[i + 1] = lm ? lm.y : 0;
        out[i + 2] = lm ? lm.z ?? 0 : 0;
        if (dims === 4) out[i + 3] = lm ? lm.visibility ?? 1 : 0;
        i += dims;
      }
    };
    write(frame.pose, 33, 4);      // 132
    write(frame.leftHand, 21, 3);  // 63
    write(frame.rightHand, 21, 3); // 63
    return out;
  }
}

export default LandmarkSource;
