import LandmarkSource from './LandmarkSource';

/**
 * FUENTE SIMULADA DE LANDMARKS — SOLO PARA LA DEMO VISUAL.
 *
 * Genera un esqueleto plausible (torso estatico + brazos y manos en movimiento)
 * a la frecuencia de muestreo configurada, para que el overlay se vea como se
 * vera con MediaPipe. No analiza la imagen de la camara en absoluto.
 *
 * ===> SE SUSTITUYE POR MediaPipeLandmarkSource EN EL DEVELOPMENT BUILD. <===
 */

// Indices estilo MediaPipe Pose que usa el overlay.
export const POSE = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
};

export const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
];

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const lerp = (a, b, t) => a + (b - a) * t;

export class MockLandmarkSource extends LandmarkSource {
  constructor({ fps = 15 } = {}) {
    super();
    this._fps = fps;
    this._timer = null;
    this._t = 0;
    this._onFrame = null;
  }

  get id() {
    return 'mock';
  }

  setFps(fps) {
    if (fps === this._fps) return;
    this._fps = fps;
    if (this._timer) {
      this.stop();
      this.start(this._onFrame);
    }
  }

  start(onFrame) {
    this.stop();
    this._onFrame = onFrame;
    const interval = Math.round(1000 / this._fps);
    this._timer = setInterval(() => {
      this._t += 1;
      onFrame?.(this._buildFrame(this._t));
    }, interval);
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  /** Coordenadas normalizadas 0..1 sobre el area del preview. */
  _buildFrame(t) {
    const cycle = 16 * (this._fps / 3); // acompana el guion del MockSignRecognizer
    const phase = (t % cycle) / cycle;
    // Durante la primera parte del ciclo las manos estan abajo (sin deteccion).
    const handsUp = phase > 0.3;
    const raise = handsUp ? Math.min(1, (phase - 0.3) / 0.25) : 0;
    const sway = Math.sin(t / 4) * 0.02;
    const bob = Math.sin(t / 7) * 0.008;

    const pose = new Array(33).fill(null).map(() => ({ x: 0, y: 0, z: 0, visibility: 0 }));
    const set = (i, x, y, v = 0.95) => {
      pose[i] = { x, y, z: 0, visibility: v };
    };

    // Reparto vertical pensado para que la figura completa quede POR ENCIMA del
    // HUD: cabeza 0.18, hombros 0.36, caderas 0.63. Debajo de 0.66 esta el panel.
    set(POSE.NOSE, 0.5 + sway * 0.5, 0.18 + bob);
    set(POSE.LEFT_SHOULDER, 0.62 + sway, 0.36 + bob);
    set(POSE.RIGHT_SHOULDER, 0.38 + sway, 0.36 + bob);
    set(POSE.LEFT_HIP, 0.585 + sway * 0.6, 0.63);
    set(POSE.RIGHT_HIP, 0.415 + sway * 0.6, 0.63);

    // Brazo izquierdo (el que "hace" la sena): sube hacia la cara.
    const lElbow = { x: lerp(0.70, 0.66, raise), y: lerp(0.52, 0.47, raise) };
    const lWrist = {
      x: lerp(0.68, 0.57 + Math.sin(t / 3) * 0.025, raise),
      y: lerp(0.64, 0.28 + Math.cos(t / 3) * 0.018, raise),
    };
    set(POSE.LEFT_ELBOW, lElbow.x, lElbow.y, 0.9);
    set(POSE.LEFT_WRIST, lWrist.x, lWrist.y, 0.9);

    // Brazo derecho: acompana mas discreto.
    const rElbow = { x: lerp(0.30, 0.32, raise), y: lerp(0.52, 0.50, raise) };
    const rWrist = {
      x: lerp(0.32, 0.41 + Math.sin(t / 3 + 1) * 0.018, raise),
      y: lerp(0.64, 0.43 + Math.cos(t / 3 + 1) * 0.018, raise),
    };
    set(POSE.RIGHT_ELBOW, rElbow.x, rElbow.y, 0.85);
    set(POSE.RIGHT_WRIST, rWrist.x, rWrist.y, 0.85);

    const leftHand = handsUp ? this._buildHand(lWrist, t, 1) : null;
    const rightHand = handsUp && raise > 0.6 ? this._buildHand(rWrist, t + 5, -1) : null;

    return {
      pose,
      leftHand,
      rightHand,
      face: this._buildFace(pose[POSE.NOSE]),
      hasHands: Boolean(leftHand || rightHand),
      timestamp: Date.now(),
    };
  }

  /** 21 puntos: muneca + 5 dedos x 4 articulaciones, abiertos en abanico. */
  _buildHand(wrist, t, side) {
    const points = [{ x: wrist.x, y: wrist.y, z: 0 }];
    const flex = 0.5 + Math.sin(t / 5) * 0.5; // dedos abriendo y cerrando
    // Escala en coordenadas normalizadas: una mano ocupa ~1/3 del ancho de hombros.
    const scale = 0.019;

    for (let finger = 0; finger < 5; finger += 1) {
      const baseAngle = (-1.25 + finger * 0.32) * side - Math.PI / 2;
      for (let joint = 1; joint <= 4; joint += 1) {
        const len = scale * joint * (finger === 0 ? 0.75 : 1) * (0.7 + flex * 0.3);
        points.push({
          x: wrist.x + Math.cos(baseAngle) * len,
          y: wrist.y + Math.sin(baseAngle) * len,
          z: 0,
        });
      }
    }
    return points;
  }

  /** Malla facial reducida: solo lo necesario para el look del overlay. */
  _buildFace(nose) {
    if (!nose) return [];
    const pts = [];
    for (let i = 0; i < 26; i += 1) {
      const a = (i / 26) * Math.PI * 2;
      pts.push({ x: nose.x + Math.cos(a) * 0.052, y: nose.y + Math.sin(a) * 0.072 });
    }
    // Ojos y boca
    pts.push({ x: nose.x - 0.022, y: nose.y - 0.018 });
    pts.push({ x: nose.x + 0.022, y: nose.y - 0.018 });
    pts.push({ x: nose.x - 0.018, y: nose.y + 0.032 });
    pts.push({ x: nose.x, y: nose.y + 0.036 });
    pts.push({ x: nose.x + 0.018, y: nose.y + 0.032 });
    return pts;
  }
}

export default MockLandmarkSource;
