import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import LandmarkOverlay from '../motion/LandmarkOverlay';
import { ConfidenceBar, LiveDot } from './ui';
import { SourceState } from '../recognition/SignSource';
import { RecognitionState } from '../recognition/PredictionStabilizer';
import { colors, radius, shadow, spacing, typography } from '../config/theme';
import { formatConfidence, humanizeLabel } from '../utils/format';

/**
 * Cabecera viva de la pantalla principal.
 *
 * Muestra, en este orden de importancia:
 *   1. la sena que se esta reconociendo  (lo que el oyente necesita leer)
 *   2. cuanta confianza hay detras
 *   3. que esta viendo el pin            (preview pequeno, es contexto)
 *   4. el estado de la conexion
 *
 * El preview va pequeno a proposito: la persona oyente necesita LEER, no
 * mirar video. El video grande se ve espectacular y se lee peor.
 */

const CONN_META = {
  [SourceState.IDLE]: { label: 'Desconectado', tone: colors.onDarkFaint, icon: 'power-outline' },
  [SourceState.CONNECTING]: { label: 'Conectando al pin', tone: colors.accent, icon: 'sync-outline' },
  [SourceState.READY]: { label: 'Pin conectado', tone: colors.success, icon: 'checkmark-circle' },
  [SourceState.RECONNECTING]: { label: 'Reconectando', tone: colors.warning, icon: 'sync-outline' },
  [SourceState.OFFLINE]: { label: 'Sin conexion', tone: colors.danger, icon: 'cloud-offline-outline' },
  [SourceState.ERROR]: { label: 'Error', tone: colors.danger, icon: 'alert-circle' },
};

export function PinStatusCard({ connection, recognition, landmarks, frame, stabilityFrames, threshold }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const meta = CONN_META[connection] ?? CONN_META[SourceState.IDLE];
  const live = connection === SourceState.READY;

  const { state, activeLabel, confidence, progress, latchedLabel } = recognition;

  // Mensaje principal segun el estado del estabilizador.
  let titulo = 'Esperando sena';
  let pie = live ? 'El pin esta mirando' : 'Conecta el pin para empezar';
  let acento = colors.onDarkSoft;

  if (state === RecognitionState.IDLE && activeLabel && confidence > 0) {
    titulo = humanizeLabel(activeLabel);
    pie = 'Confianza insuficiente';
  }
  if (state === RecognitionState.CANDIDATE && activeLabel) {
    titulo = humanizeLabel(activeLabel);
    pie = `Validando  ${Math.round(progress * stabilityFrames)}/${stabilityFrames}`;
    acento = colors.accent;
  }
  if (state === RecognitionState.COMMITTED) {
    titulo = humanizeLabel(latchedLabel ?? activeLabel);
    pie = 'Agregado a la conversacion';
    acento = colors.success;
  }
  if (state === RecognitionState.COOLDOWN) {
    titulo = humanizeLabel(latchedLabel);
    pie = 'Pausa antes de la siguiente';
    acento = colors.accent;
  }
  if (state === RecognitionState.LATCHED) {
    titulo = humanizeLabel(latchedLabel);
    pie = 'Esperando un cambio de sena';
    acento = colors.warning;
  }

  // Latido sutil cuando se acepta una sena.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== RecognitionState.COMMITTED) return;
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }),
      Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: true, isInteraction: false }),
    ]).start();
  }, [state, latchedLabel, pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <LinearGradient colors={['#173A68', '#0C2240']} start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        {/* ---- Estado de la conexion ---- */}
        <View style={styles.connRow}>
          {live ? <LiveDot color={colors.success} size={7} /> : <Ionicons name={meta.icon} size={13} color={meta.tone} />}
          <Text style={[styles.connText, { color: meta.tone }]}>{meta.label}</Text>
        </View>

        <View style={styles.body}>
          {/* ---- Lo que se esta reconociendo ---- */}
          <View style={styles.textCol}>
            <Text style={styles.eyebrow}>SEÑA DETECTADA</Text>
            <Text style={[styles.titulo, { color: acento === colors.onDarkSoft ? colors.onDarkSoft : colors.onDark }]} numberOfLines={2}>
              {titulo}
            </Text>
            <Text style={[styles.pie, { color: acento }]} numberOfLines={1}>
              {pie}
            </Text>

            <View style={styles.confRow}>
              <ConfidenceBar value={confidence} threshold={threshold} height={5} style={{ flex: 1 }} />
              <Text style={styles.confValue}>{confidence > 0 ? formatConfidence(confidence) : '--'}</Text>
            </View>
          </View>

          {/* ---- Lo que ve el pin ---- */}
          <View style={styles.preview} onLayout={(e) => setBox(e.nativeEvent.layout)}>
            {frame ? (
              <Image source={{ uri: `data:image/jpeg;base64,${frame}` }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
            <LandmarkOverlay frame={landmarks} width={box.width} height={box.height} visible={Boolean(landmarks)} />
            {!landmarks && !frame ? (
              <View style={styles.previewEmpty}>
                <Ionicons name="videocam-off-outline" size={18} color={colors.onDarkFaint} />
              </View>
            ) : null}
            <Text style={styles.previewTag}>PIN</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden', ...shadow.raised },
  fill: { padding: spacing.lg },

  connRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  connText: { ...typography.micro, marginLeft: 7 },

  body: { flexDirection: 'row', alignItems: 'stretch' },
  textCol: { flex: 1, justifyContent: 'center', paddingRight: spacing.md },

  eyebrow: { ...typography.micro, color: colors.onDarkFaint, marginBottom: 4 },
  titulo: { ...typography.title, fontSize: 25, color: colors.onDark },
  pie: { ...typography.caption, marginTop: 3, fontWeight: '600' },

  confRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  confValue: { ...typography.caption, color: colors.accent, marginLeft: spacing.md, minWidth: 40, textAlign: 'right' },

  preview: {
    width: 104,
    height: 130,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  previewEmpty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  previewTag: {
    position: 'absolute',
    bottom: 5,
    left: 7,
    ...typography.micro,
    fontSize: 9,
    color: colors.onDarkFaint,
  },
});

export default PinStatusCard;
