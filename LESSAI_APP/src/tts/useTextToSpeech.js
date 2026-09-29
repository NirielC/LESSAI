import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTextToSpeech } from './TextToSpeechService';
import { humanizeLabel } from '../utils/format';

/**
 * Reproduccion por voz de los mensajes reconocidos.
 * Mantiene que mensaje esta sonando para que la UI pueda resaltarlo.
 */
export function useTextToSpeech() {
  const serviceRef = useRef(getTextToSpeech());
  const [speakingId, setSpeakingId] = useState(null);

  useEffect(() => {
    const service = serviceRef.current;
    return () => service.stop();
  }, []);

  const speak = useCallback((text, id = null) => {
    if (!text) return false;
    setSpeakingId(id);
    return serviceRef.current.speak(humanizeLabel(text), {
      onDone: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  }, []);

  const stop = useCallback(() => {
    serviceRef.current.stop();
    setSpeakingId(null);
  }, []);

  return useMemo(
    () => ({
      speak,
      stop,
      speakingId,
      isAvailable: serviceRef.current.isAvailable,
    }),
    [speak, stop, speakingId]
  );
}

export default useTextToSpeech;
