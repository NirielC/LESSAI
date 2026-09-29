import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../config/SettingsContext';
import WebSocketSignSource from './WebSocketSignSource';
import { SourceState } from './SignSource';
import PredictionStabilizer, { RecognitionState } from './PredictionStabilizer';
import { fromWire } from '../motion/wireLandmarks';

/**
 * ORQUESTADOR EN MODO SERVIDOR.
 *
 *   Pin -> Servidor (MediaPipe + LSTM) -> WebSocket -> [este hook] -> mensaje
 *
 * El servidor emite predicciones crudas, varias por segundo. Este hook las pasa
 * por el mismo PredictionStabilizer de siempre, asi que el anti-repeticion
 * (umbral, estabilidad, cooldown, latch) sigue funcionando igual que en la demo.
 *
 * Sustituye a useSignRecognition cuando el reconocimiento no ocurre en el telefono.
 */
export function useSignStream({ enabled, onCommit }) {
  const { config } = useSettings();

  const sourceRef = useRef(null);
  const stabilizerRef = useRef(null);
  const mountedRef = useRef(true);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const [connection, setConnection] = useState(SourceState.IDLE);
  const [labels, setLabels] = useState([]);
  const [error, setError] = useState(null);
  const [frame, setFrame] = useState(null);         // preview jpeg del pin (base64)
  const [landmarks, setLandmarks] = useState(null); // puntos clave listos para el overlay
  const [recognition, setRecognition] = useState({
    state: RecognitionState.IDLE,
    activeLabel: null,
    confidence: 0,
    progress: 0,
    latchedLabel: null,
  });
  const [stats, setStats] = useState({ predictions: 0, lastLatencyMs: 0 });

  if (!stabilizerRef.current) {
    stabilizerRef.current = new PredictionStabilizer(config);
  }

  useEffect(() => {
    stabilizerRef.current?.updateConfig(config);
  }, [config]);

  const handleEvent = useCallback(
    (event) => {
      if (!mountedRef.current) return;
      const stabilizer = stabilizerRef.current;

      switch (event.type) {
        case 'status':
          setConnection(event.state);
          if (event.labels) setLabels(event.labels);
          // Un error viejo no debe seguir en pantalla si ya se recupero la conexion.
          if (event.state === SourceState.READY) setError(null);
          if (event.state !== SourceState.READY) {
            stabilizer.reset();
            setLandmarks(null);
            setFrame(null);
            setRecognition({
              state: RecognitionState.IDLE,
              activeLabel: null,
              confidence: 0,
              progress: 0,
              latchedLabel: null,
            });
          }
          break;

        case 'frame':
          setFrame(event.jpegBase64);
          if (event.landmarks) setLandmarks(fromWire(event.landmarks));
          break;

        case 'landmarks':
          setLandmarks(fromWire(event.landmarks));
          break;

        case 'error':
          setError(event.message);
          break;

        case 'no_sign':
        case 'prediction': {
          const result =
            event.type === 'no_sign'
              ? { label: config.noSignLabel, confidence: 0, margin: 0, isNoSign: true }
              : {
                  label: event.label,
                  confidence: event.confidence,
                  margin: event.margin,
                  isNoSign: event.label === config.noSignLabel,
                };

          const snapshot = stabilizer.push(result, Date.now());

          setRecognition({
            state: snapshot.state,
            activeLabel: snapshot.activeLabel ?? (result.isNoSign ? null : result.label),
            confidence: result.isNoSign ? 0 : result.confidence,
            progress: snapshot.progress,
            latchedLabel: snapshot.latchedLabel,
          });

          setStats((s) => ({
            predictions: s.predictions + 1,
            lastLatencyMs: event.ts ? Math.max(0, Date.now() - event.ts) : s.lastLatencyMs,
          }));

          if (snapshot.committed) {
            onCommitRef.current?.(snapshot.committed);
          }
          break;
        }

        default:
          break;
      }
    },
    [config]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      sourceRef.current?.disconnect();
      sourceRef.current = null;
      setConnection(SourceState.IDLE);
      return undefined;
    }

    const source = new WebSocketSignSource();
    sourceRef.current = source;
    setError(null);
    source.connect(handleEvent);

    return () => {
      source.disconnect();
      sourceRef.current = null;
    };
  }, [enabled, handleEvent]);

  useEffect(
    () => () => {
      mountedRef.current = false;
      sourceRef.current?.disconnect();
    },
    []
  );

  const reset = useCallback(() => {
    stabilizerRef.current?.reset();
    setRecognition({
      state: RecognitionState.IDLE,
      activeLabel: null,
      confidence: 0,
      progress: 0,
      latchedLabel: null,
    });
  }, []);

  return useMemo(
    () => ({
      connection,
      isConnected: connection === SourceState.READY,
      labels,
      error,
      frame,
      landmarks,
      recognition,
      stats,
      serverUrl: sourceRef.current?.url,
      reset,
    }),
    [connection, labels, error, frame, landmarks, recognition, stats, reset]
  );
}

export { SourceState };
export default useSignStream;
