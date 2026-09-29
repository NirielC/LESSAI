import { ENGINE_CONFIG } from '../config/recognition.config';
import MockSignRecognizer from './MockSignRecognizer';
import TfliteSignRecognizer from './TfliteSignRecognizer';

/**
 * Unico punto del proyecto que decide que motor se usa.
 * Cambiar de simulado a real = cambiar `engine` en recognition.config.js.
 */
const REGISTRY = {
  mock: () => new MockSignRecognizer(),
  tflite: () => new TfliteSignRecognizer(),
};

let singleton = null;

export function createRecognizer(engine = ENGINE_CONFIG.engine) {
  const factory = REGISTRY[engine];
  if (!factory) {
    throw new Error(
      `Motor de reconocimiento desconocido: "${engine}". Disponibles: ${Object.keys(REGISTRY).join(', ')}`
    );
  }
  return factory();
}

/** Instancia compartida: cargar el modelo dos veces duplicaria la memoria. */
export function getRecognizer() {
  if (!singleton) singleton = createRecognizer();
  return singleton;
}

export async function resetRecognizer() {
  await singleton?.dispose();
  singleton = null;
}

export const availableEngines = Object.keys(REGISTRY);

export default getRecognizer;
