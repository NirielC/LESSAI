/**
 * PARAMETROS CENTRALIZADOS DEL PIPELINE DE RECONOCIMIENTO.
 *
 * Todo lo que afecta "cuando una sena se convierte en mensaje" vive aqui.
 * Ninguna pantalla debe tener numeros magicos de reconocimiento.
 *
 * Estos valores son ajustables en caliente desde la pantalla de Ajustes
 * (ver src/config/SettingsContext.js).
 */

export const RECOGNITION_CONFIG = {
  // ---------- Captura / muestreo ----------
  /** Frames por segundo a los que se extraen landmarks (no es el fps del preview). */
  sampleRateFps: 15,
  /** Longitud de la ventana temporal que recibe el modelo. */
  sequenceLength: 30,
  /** Cada cuantos frames nuevos se dispara una inferencia (stride de la ventana). */
  inferenceStrideFrames: 5,
  /** Minimo de frames con manos visibles dentro del buffer para siquiera intentar inferir. */
  minValidFramesRatio: 0.6,

  // ---------- Inferencia ----------
  /** Presupuesto de tiempo antes de considerar la inferencia "lenta" y bajar el stride. */
  inferenceBudgetMs: 120,
  /** Nunca se lanzan dos inferencias a la vez: si una esta en curso, el frame se descarta. */
  allowConcurrentInference: false,

  // ---------- Validacion de la prediccion ----------
  /** Confianza minima para que una prediccion sea siquiera candidata. */
  confidenceThreshold: 0.82,
  /** Predicciones consecutivas iguales necesarias para confirmar (estabilidad). */
  stabilityFrames: 4,
  /** Margen minimo entre la clase top-1 y la top-2 (evita empates ambiguos). */
  minTopMargin: 0.15,

  // ---------- Anti-repeticion ----------
  /** Tiempo muerto tras confirmar una sena: no se acepta NADA durante este lapso. */
  cooldownMs: 1400,
  /**
   * Tras confirmar una sena queda "enganchada" (latched): la MISMA sena no se
   * vuelve a aceptar hasta que ocurra un cambio real -> otra clase confirmada
   * o `releaseOnNoSignFrames` frames seguidos sin deteccion.
   */
  requireChangeBeforeRepeat: true,
  /** Frames sin deteccion necesarios para liberar el latch de la ultima sena. */
  releaseOnNoSignFrames: 8,

  // ---------- Sin deteccion ----------
  /** Etiqueta reservada que el modelo puede devolver para "no hay sena". */
  noSignLabel: 'NO_SIGN',
  /** Frames sin deteccion antes de mostrar el estado "sin sena" en la UI (anti-parpadeo). */
  noSignGraceFrames: 6,

  // ---------- UX ----------
  /** Reproducir automaticamente por voz cada sena confirmada. Opcional, no obligatorio. */
  autoSpeak: false,
  /** Vibracion corta al confirmar una sena. */
  hapticsOnCommit: true,
  /** Dibujar el esqueleto de landmarks sobre el video. */
  showLandmarks: true,
  /** Mostrar el panel tecnico (confianza, fps, latencia) sobre la camara. */
  showTelemetry: true,
};

/**
 * Metadatos del runtime de IA. Se muestran en Ajustes / Info para dejar claro
 * que motor esta activo sin que ninguna pantalla toque la implementacion.
 */
export const ENGINE_CONFIG = {
  /** 'mock' | 'tflite'  -> resuelto por src/recognition/RecognizerFactory.js */
  engine: 'mock',
  /** Ruta relativa del modelo convertido, una vez que exista. */
  modelAsset: 'src/models/lessa_model.tflite',
  /** Manifiesto que acompana al modelo (labels + shape). El .h5 es la fuente de verdad. */
  manifestAsset: 'src/models/model.manifest.json',
};

/** Rangos permitidos para los sliders de Ajustes. */
export const CONFIG_BOUNDS = {
  confidenceThreshold: { min: 0.5, max: 0.99, step: 0.01, format: (v) => `${Math.round(v * 100)}%` },
  stabilityFrames: { min: 1, max: 12, step: 1, format: (v) => `${v} frames` },
  cooldownMs: { min: 400, max: 4000, step: 100, format: (v) => `${(v / 1000).toFixed(1)} s` },
  sequenceLength: { min: 10, max: 60, step: 5, format: (v) => `${v} frames` },
  sampleRateFps: { min: 5, max: 30, step: 1, format: (v) => `${v} fps` },
};

export default RECOGNITION_CONFIG;
