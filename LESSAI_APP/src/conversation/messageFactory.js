import { createId } from '../utils/id';

/** Origen de un mensaje. Determina el lado y el estilo de la burbuja. */
export const MessageSource = {
  SIGN: 'sign', // reconocido por el modelo desde LESSA
  VOICE: 'voice', // transcrito por Speech-to-Text
  SYSTEM: 'system', // avisos de la app
};

/**
 * @param {{label:string, confidence:number, at?:number}} prediction
 * Nota: `label` llega tal cual del modelo. La app no reescribe el vocabulario.
 */
export function createSignMessage(prediction) {
  return {
    id: createId('msg'),
    source: MessageSource.SIGN,
    text: prediction.label,
    rawLabel: prediction.label,
    confidence: prediction.confidence,
    createdAt: prediction.at ?? Date.now(),
    spoken: false,
  };
}

export function createVoiceMessage(text, { confidence = null } = {}) {
  return {
    id: createId('msg'),
    source: MessageSource.VOICE,
    text,
    rawLabel: null,
    confidence,
    createdAt: Date.now(),
    spoken: true,
  };
}

export function createSystemMessage(text) {
  return {
    id: createId('msg'),
    source: MessageSource.SYSTEM,
    text,
    rawLabel: null,
    confidence: null,
    createdAt: Date.now(),
    spoken: false,
  };
}

export default { createSignMessage, createVoiceMessage, createSystemMessage, MessageSource };
