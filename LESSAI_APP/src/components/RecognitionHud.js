import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../config/theme';
import { ConfidenceBar, LiveDot } from './ui';
import { CameraState, CAMERA_STATE_META } from '../camera/cameraStates';
import { RecognitionState } from '../recognition/PredictionStabilizer';
import { formatConfidence, humanizeLabel } from '../utils/format';

const TONE_COLOR = {
  neutral: colors.onDarkSoft,
  info: colors.accent,
  success: colors.success,
  danger: colors.danger,
  muted: colors.onDarkFaint,
  live: colors.live,
};

/** Chip de estado que va arriba a la izquierda del video. */
export function StatusChip({ state }) {
  const meta = CAMERA_STATE_META[state] ?? CAMERA_STATE_META[CameraState.IDLE];
  const color = TONE_COLOR[meta.tone] ?? colors.onDarkSoft;
  const isLive = state === CameraState.CAPTURING || state === CameraState.ANALYZING;

  return (
    <View style={styles.chip}>
      {isLive ? (
        <LiveDot color={state === CameraState.ANALYZING ? colors.accent : colors.live} size={7} />
      ) : (
        <Ionicons name={meta.icon} size={13} color={color} />
      )}
      <Text style={[styles.chipText, { color }]}>{meta.label}</Text>
    </View>
  );
}

/**
 * Panel inferior sobre el video: prediccion actual, confianza y progreso de
 * validacion. Es la unica parte "tecnica" visible, y solo muestra lo que el
 * usuario necesita para entender por que la app aun no acepto la sena.
 */
export function PredictionPanel({ recognition, cameraState, threshold, stabilityFrames, showTelemetry, telemetry }) {
  const { state, activeLabel, confidence, progress, latchedLabel } = recognition;
  const detected = cameraState === CameraState.DETECTED;

  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!detected) return undefined;
    Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    return undefined;
  }, [detected, glow, recognition.latchedLabel]);

  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  // Texto principal segun el estado del estabilizador.
  let headline = 'Esperando sena';
  let sub = 'Coloca las manos dentro del encuadre';
  let tone = 'muted';

  if (cameraState === CameraState.NO_SIGN) {
    headline = 'Sin sena detectada';
    sub = 'No se reconoce movimiento valido';
    tone = 'muted';
  }
  // Hay una clase candidata pero aun no alcanza el umbral. Mostrarla y decir por
  // que no se acepta es mas honesto que dejar "Esperando sena" con un 66% en pantalla.
  if (state === RecognitionState.IDLE && activeLabel && confidence > 0) {
    headline = humanizeLabel(activeLabel);
    sub = 'Confianza insuficiente';
    tone = 'muted';
  }
  if (state === RecognitionState.CANDIDATE && activeLabel) {
    headline = humanizeLabel(activeLabel);
    sub = `Validando  ${Math.round(progress * stabilityFrames)}/${stabilityFrames}`;
    tone = 'info';
  }
  if (state === RecognitionState.COMMITTED || detected) {
    headline = humanizeLabel(latchedLabel ?? activeLabel);
    sub = 'Agregado a la conversacion';
    tone = 'success';
  }
  if (state === RecognitionState.COOLDOWN) {
    headline = humanizeLabel(latchedLabel);
    sub = 'Pausa antes de la siguiente sena';
    tone = 'info';
  }
  if (state === RecognitionState.LATCHED) {
    headline = humanizeLabel(latchedLabel);
    sub = 'Cambia de sena para continuar';
    tone = 'warning';
  }

  return (
    <Animated.View style={[styles.panel, { transform: [{ scale }] }]}>
      <View style={styles.panelTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelEyebrow}>PREDICCION</Text>
          <Text
            style={[
              styles.headline,
              tone === 'success' && { color: colors.success },
              tone === 'muted' && { color: colors.onDarkSoft, fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {headline}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        </View>

        <View style={styles.confBlock}>
          <Text style={styles.confValue}>{confidence > 0 ? formatConfidence(confidence) : '--'}</Text>
          <Text style={styles.confLabel}>confianza</Text>
        </View>
      </View>

      <ConfidenceBar value={confidence} threshold={threshold} style={{ marginTop: spacing.md }} />

      {showTelemetry ? (
        <View style={styles.telemetry}>
          <Telemetry icon="speedometer-outline" value={`${telemetry.fps} fps`} />
          <Telemetry icon="timer-outline" value={`${telemetry.inferenceMs} ms`} />
          <Telemetry icon="layers-outline" value={`buffer ${Math.round(telemetry.bufferFill * 100)}%`} />
        </View>
      ) : null}
    </Animated.View>
  );
}

function Telemetry({ icon, value }) {
  return (
    <View style={styles.telemetryItem}>
      <Ionicons name={icon} size={12} color={colors.onDarkFaint} />
      <Text style={styles.telemetryText}>{value}</Text>
    </View>
  );
}

/** Aviso grande cuando falta permiso o el motor fallo. */
export function CameraNotice({ icon, title, description, action }) {
  return (
    <View style={styles.notice}>
      <View style={styles.noticeIcon}>
        <Ionicons name={icon} size={28} color={colors.onDark} />
      </View>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeDesc}>{description}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(12,34,64,0.62)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.micro, marginLeft: 7, letterSpacing: 0.4 },

  panel: {
    backgroundColor: 'rgba(12,34,64,0.78)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  panelTop: { flexDirection: 'row', alignItems: 'flex-start' },
  panelEyebrow: { ...typography.micro, color: colors.onDarkFaint, marginBottom: 4 },
  headline: { ...typography.title, fontSize: 26, color: colors.onDark },
  sub: { ...typography.caption, color: colors.onDarkSoft, marginTop: 3, fontWeight: '500' },

  confBlock: { alignItems: 'flex-end', marginLeft: spacing.md },
  confValue: { ...typography.title, fontSize: 22, color: colors.accent },
  confLabel: { ...typography.micro, color: colors.onDarkFaint, letterSpacing: 0.3 },

  telemetry: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  telemetryItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
  telemetryText: { ...typography.micro, color: colors.onDarkFaint, marginLeft: 5, letterSpacing: 0.2 },

  notice: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(12,34,64,0.88)',
  },
  noticeIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  noticeTitle: { ...typography.section, color: colors.onDark, textAlign: 'center' },
  noticeDesc: {
    ...typography.body,
    color: colors.onDarkSoft,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
});

export default { StatusChip, PredictionPanel, CameraNotice };
