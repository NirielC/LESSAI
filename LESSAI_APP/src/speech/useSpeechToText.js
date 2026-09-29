import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MockSpeechToTextService from './MockSpeechToTextService';
import { SttState } from './SpeechToTextService';

/**
 * Hook que expone el servicio de voz a la UI.
 * La pantalla solo consume estado y llama a start/stop: cero logica de microfono
 * dentro del componente.
 */
export function useSpeechToText({ onFinal } = {}) {
  const serviceRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const [state, setState] = useState(SttState.IDLE);
  const [transcript, setTranscript] = useState('');
  const [finalText, setFinalText] = useState('');
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState(null);

  if (!serviceRef.current) {
    serviceRef.current = new MockSpeechToTextService();
  }

  useEffect(() => {
    const service = serviceRef.current;
    return () => service?.dispose();
  }, []);

  const handleEvent = useCallback((event) => {
    switch (event.type) {
      case 'start':
        setState(SttState.LISTENING);
        setTranscript('');
        setError(null);
        break;
      case 'partial':
        setTranscript(event.text ?? '');
        break;
      case 'volume':
        setVolume(event.volume ?? 0);
        break;
      case 'final':
        setState(SttState.PROCESSING);
        setTranscript(event.text ?? '');
        setFinalText(event.text ?? '');
        if (event.text) onFinalRef.current?.(event.text, { confidence: event.confidence });
        break;
      case 'end':
        setState(SttState.IDLE);
        setVolume(0);
        break;
      case 'error':
        setState(SttState.ERROR);
        setError(event.message ?? 'Error de reconocimiento de voz');
        break;
      default:
        break;
    }
  }, []);

  const start = useCallback(async () => {
    setState(SttState.REQUESTING_PERMISSION);
    const granted = await serviceRef.current.requestPermission();
    if (!granted) {
      setState(SttState.PERMISSION_DENIED);
      return;
    }
    await serviceRef.current.start(handleEvent);
  }, [handleEvent]);

  const stop = useCallback(async () => {
    await serviceRef.current.stop();
  }, []);

  const toggle = useCallback(async () => {
    if (state === SttState.LISTENING) await stop();
    else await start();
  }, [state, start, stop]);

  const clear = useCallback(() => {
    setTranscript('');
    setFinalText('');
  }, []);

  return useMemo(
    () => ({
      state,
      isListening: state === SttState.LISTENING,
      transcript,
      finalText,
      volume,
      error,
      engineId: serviceRef.current?.id,
      start,
      stop,
      toggle,
      clear,
    }),
    [state, transcript, finalText, volume, error, start, stop, toggle, clear]
  );
}

export { SttState };
export default useSpeechToText;
