import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../config/SettingsContext';
import { getRecognizer } from './RecognizerFactory';
import PredictionStabilizer, { RecognitionState } from './PredictionStabilizer';
import SequenceBuffer from '../motion/SequenceBuffer';
import LandmarkSource from '../motion/LandmarkSource';
import MockLandmarkSource from '../motion/MockLandmarkSource';
import CameraState from '../camera/cameraStates';

/**
 * ORQUESTADOR DEL PIPELINE.
 *
 *   landmarks -> SequenceBuffer -> (stride) -> SignRecognizer -> PredictionStabilizer -> commit
 *
 * Reglas de rendimiento aplicadas aqui:
 *  - La fuente de landmarks corre a `sampleRateFps`, no al fps del preview.
 *  - La inferencia solo se lanza cuando el buffer esta lleno y se cumplio el stride.
 *  - `inferenceLock` impide inferencias simultaneas: si una esta en vuelo, se descarta.
 *  - El frame crudo vive en un ref (no en estado) y la UI se refresca con throttle,
 *    para no provocar un render por frame.
 */
export function useSignRecognition({ enabled, onCommit }) {
  const { config } = useSettings();

  // --- Refs: datos de alta frecuencia que NO deben causar renders ---
  const recognizerRef = useRef(null);
  const bufferRef = useRef(null);
  const stabilizerRef = useRef(null);
  const sourceRef = useRef(null);
  const inferenceLock = useRef(false);
  const frameRef = useRef(null);
  const lastUiPush = useRef(0);
  const mountedRef = useRef(true);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // --- Estado observable por la UI ---
  const [engineState, setEngineState] = useState('loading'); // loading | ready | error
  const [engineError, setEngineError] = useState(null);
  const [labels, setLabels] = useState([]);
  const [landmarkFrame, setLandmarkFrame] = useState(null);
  const [cameraState, setCameraState] = useState(CameraState.IDLE);
  const [telemetry, setTelemetry] = useState({
    fps: 0,
    inferenceMs: 0,
    bufferFill: 0,
    inferences: 0,
  });
  const [recognition, setRecognition] = useState({
    state: RecognitionState.IDLE,
    activeLabel: null,
    confidence: 0,
    progress: 0,
    latchedLabel: null,
  });
  const [lastCommitted, setLastCommitted] = useState(null);

  // ---------- Carga del motor ----------
  useEffect(() => {
    mountedRef.current = true;
    const recognizer = getRecognizer();
    recognizerRef.current = recognizer;
    stabilizerRef.current = new PredictionStabilizer(config);

    (async () => {
      try {
        await recognizer.load();
        if (!mountedRef.current) return;
        const spec = recognizer.getInputSpec();
        setLabels(recognizer.getLabels());
        bufferRef.current = new SequenceBuffer(spec.sequenceLength, spec.featureSize);
        setEngineState('ready');
      } catch (err) {
        if (!mountedRef.current) return;
        setEngineError(err.message);
        setEngineState('error');
      }
    })();

    return () => {
      mountedRef.current = false;
      sourceRef.current?.stop();
    };
    // El motor es un singleton: solo se resuelve al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Los parametros se pueden mover en caliente desde Ajustes.
  useEffect(() => {
    stabilizerRef.current?.updateConfig(config);
    if (bufferRef.current) {
      bufferRef.current.resize(config.sequenceLength, bufferRef.current.featureSize);
    }
    sourceRef.current?.setFps?.(config.sampleRateFps);
  }, [config]);

  // ---------- Inferencia ----------
  const runInference = useCallback(async () => {
    const recognizer = recognizerRef.current;
    const buffer = bufferRef.current;
    const stabilizer = stabilizerRef.current;
    if (!recognizer?.isReady || !buffer || !stabilizer) return;

    // Prevencion de inferencias simultaneas.
    if (inferenceLock.current && !config.allowConcurrentInference) return;
    if (!buffer.shouldInfer(config)) return;

    inferenceLock.current = true;
    const sequence = buffer.read();

    try {
      const result = await recognizer.predict(sequence);
      if (!mountedRef.current) return;

      const snapshot = stabilizer.push(result, Date.now());

      setRecognition({
        state: snapshot.state,
        activeLabel: snapshot.activeLabel ?? (result.isNoSign ? null : result.label),
        confidence: result.isNoSign ? 0 : result.confidence,
        progress: snapshot.progress,
        latchedLabel: snapshot.latchedLabel,
      });

      setTelemetry((t) => ({
        ...t,
        inferenceMs: result.inferenceMs,
        inferences: t.inferences + 1,
        bufferFill: buffer.fillRatio,
      }));

      if (snapshot.committed) {
        setLastCommitted(snapshot.committed);
        setCameraState(CameraState.DETECTED);
        // Llamada directa a proposito: NO usar InteractionManager.runAfterInteractions.
        // Las animaciones en bucle (el punto "en vivo") mantienen un interaction handle
        // abierto indefinidamente, y el callback no se ejecutaria nunca.
        onCommitRef.current?.(snapshot.committed);
      } else if (result.isNoSign && snapshot.noSignStreak >= config.noSignGraceFrames) {
        setCameraState(CameraState.NO_SIGN);
      } else {
        setCameraState(CameraState.CAPTURING);
      }
    } catch (err) {
      if (mountedRef.current) {
        setEngineError(err.message);
        setCameraState(CameraState.ERROR);
      }
    } finally {
      inferenceLock.current = false;
    }
  }, [config]);

  // ---------- Bucle de captura ----------
  useEffect(() => {
    if (!enabled || engineState !== 'ready') {
      sourceRef.current?.stop();
      sourceRef.current = null;
      if (!enabled) {
        setCameraState(engineState === 'ready' ? CameraState.READY : CameraState.INITIALIZING);
        setRecognition({
          state: RecognitionState.IDLE,
          activeLabel: null,
          confidence: 0,
          progress: 0,
          latchedLabel: null,
        });
        stabilizerRef.current?.reset();
        bufferRef.current?.clear();
      }
      return undefined;
    }

    setCameraState(CameraState.CAPTURING);
    const source = new MockLandmarkSource({ fps: config.sampleRateFps });
    sourceRef.current = source;

    const fpsWindow = { count: 0, since: Date.now() };

    source.start((frame) => {
      frameRef.current = frame;

      const features = LandmarkSource.toFeatureVector(
        frame,
        bufferRef.current?.featureSize ?? 258
      );
      bufferRef.current?.push(features, frame.hasHands);

      // Refresco de la UI con throttle: el overlay no necesita un render por frame.
      const now = Date.now();
      if (now - lastUiPush.current > 66) {
        lastUiPush.current = now;
        setLandmarkFrame(frame);
      }

      fpsWindow.count += 1;
      if (now - fpsWindow.since >= 1000) {
        const fps = Math.round((fpsWindow.count * 1000) / (now - fpsWindow.since));
        fpsWindow.count = 0;
        fpsWindow.since = now;
        setTelemetry((t) => ({ ...t, fps, bufferFill: bufferRef.current?.fillRatio ?? 0 }));
      }

      // Disparo asincrono: nunca bloquea el hilo de captura.
      runInference();
    });

    return () => {
      source.stop();
      sourceRef.current = null;
    };
  }, [enabled, engineState, config.sampleRateFps, runInference]);

  const reset = useCallback(() => {
    stabilizerRef.current?.reset();
    bufferRef.current?.clear();
    setLastCommitted(null);
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
      engineState,
      engineError,
      engineId: recognizerRef.current?.id ?? 'unknown',
      modelName: recognizerRef.current?.modelName ?? '-',
      labels,
      landmarkFrame,
      cameraState,
      setCameraState,
      recognition,
      telemetry,
      lastCommitted,
      reset,
    }),
    [
      engineState,
      engineError,
      labels,
      landmarkFrame,
      cameraState,
      recognition,
      telemetry,
      lastCommitted,
      reset,
    ]
  );
}

export default useSignRecognition;
