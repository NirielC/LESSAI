import type React from 'react';
import type { ViewProps } from 'react-native';
import type { EngineAvailability, EnginePrediction, EngineStatus } from './engine';

/**
 * Puente al módulo nativo `lessai-vision` (modules/lessai-vision, Kotlin):
 * una vista que contiene la cámara, MediaPipe (pose + manos), el buffer de 30
 * frames y TFLite. Dibuja las manos ella misma y solo emite eventos pequeños.
 *
 * En Expo Go no existe: `visionAvailability()` lo dice y la app usa la cámara
 * de expo-camera solo como vista previa (sin reconocimiento).
 */
export interface LessaiVisionProps extends ViewProps {
  active: boolean; // false = cámara liberada (pausa, pantalla oculta)
  facing: 'back' | 'front';
  showHands: boolean;
  /** Correr también el modelo de abecedario (si está instalado). */
  letters: boolean;
  onPrediction?: (e: { nativeEvent: EnginePrediction }) => void;
  onStatus?: (e: { nativeEvent: EngineStatus }) => void;
  onEngineError?: (e: { nativeEvent: { message: string } }) => void;
}

let view: React.ComponentType<LessaiVisionProps> | null | undefined;
let reason: EngineAvailability = { available: false, reason: 'no-module' };

export function getVisionView(): React.ComponentType<LessaiVisionProps> | null {
  if (view !== undefined) return view;
  try {
    const Constants = require('expo-constants').default;
    if (Constants.executionEnvironment === 'storeClient') {
      reason = { available: false, reason: 'expo-go' };
      view = null;
      return view;
    }
    const { requireNativeView, requireOptionalNativeModule } = require('expo');
    if (!requireOptionalNativeModule('LessaiVision')) throw new Error('Módulo LessaiVision no instalado');
    view = requireNativeView('LessaiVision');
    reason = { available: true };
  } catch (e: any) {
    reason = { available: false, reason: 'no-module', detail: String(e?.message ?? e) };
    view = null;
  }
  return view ?? null;
}

export function visionAvailability(): EngineAvailability {
  getVisionView();
  return reason;
}
