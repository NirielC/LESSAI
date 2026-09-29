import { SignRecognizer } from './SignRecognizer';
import manifest from '../models/model.manifest.json';

/**
 * MOTOR REAL — pendiente de implementar.
 *
 * Requisitos (ver src/models/README.md):
 *  1. `lessa_model.h5` convertido a `lessa_model.tflite`.
 *  2. **Development Build**. El interprete de TFLite es codigo nativo y no
 *     existe en Expo Go; `npx expo prebuild && npx expo run:android|ios`.
 *  3. Un runtime: `react-native-fast-tflite` (el mas directo con Expo prebuild)
 *     o un modulo nativo propio sobre TensorFlow Lite / MediaPipe Tasks.
 *
 * Deliberadamente lanza en vez de devolver datos falsos: si el modelo no esta,
 * la app debe decirlo, no fingir que reconoce.
 */
export class TfliteSignRecognizer extends SignRecognizer {
  constructor() {
    super();
    this._interpreter = null;
    this._labels = manifest.labels ?? [];
    this._spec = {
      sequenceLength: manifest.input?.sequenceLength ?? 30,
      featureSize: manifest.input?.featureSize ?? 258,
    };
  }

  get id() {
    return 'tflite';
  }

  get isReady() {
    return this._interpreter !== null;
  }

  get modelName() {
    return manifest.name ?? 'lessa';
  }

  async load() {
    // Implementacion prevista:
    //
    //   import { loadTensorflowModel } from 'react-native-fast-tflite';
    //   this._interpreter = await loadTensorflowModel(
    //     require('../models/lessa_model.tflite')
    //   );
    //
    // Los labels y el shape se leen del manifiesto generado junto al .tflite,
    // de modo que ampliar el vocabulario no requiere tocar codigo.
    throw new Error(
      'TfliteSignRecognizer: falta el modelo convertido y el Development Build. ' +
        'Ver src/models/README.md. Mientras tanto usa engine: "mock".'
    );
  }

  getLabels() {
    return this._labels;
  }

  getInputSpec() {
    return this._spec;
  }

  async predict(sequence) {
    // Implementacion prevista:
    //
    //   const input = Float32Array.from(sequence.flat());
    //   const t0 = Date.now();
    //   const [probabilities] = await this._interpreter.run([input]);
    //   -> ordenar, sacar top1/top2, margin, isNoSign === label === NO_SIGN
    //
    // El post-proceso (threshold, estabilidad, cooldown) NO va aqui:
    // es responsabilidad de PredictionStabilizer.
    throw new Error('TfliteSignRecognizer.predict() no implementado todavia');
  }

  async dispose() {
    this._interpreter?.delete?.();
    this._interpreter = null;
  }
}

export default TfliteSignRecognizer;
