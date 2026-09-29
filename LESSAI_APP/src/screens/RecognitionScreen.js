import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LiveCameraView from '../camera/LiveCameraView';
import useCameraPermission from '../camera/useCameraPermission';
import { CameraState } from '../camera/cameraStates';
import LandmarkOverlay from '../motion/LandmarkOverlay';
import useSignRecognition from '../recognition/useSignRecognition';
import { useSettings } from '../config/SettingsContext';
import { useConversation, MessageSource } from '../conversation/ConversationContext';
import useTextToSpeech from '../tts/useTextToSpeech';
import { StatusChip, PredictionPanel, CameraNotice } from '../components/RecognitionHud';
import { IconButton, PrimaryButton } from '../components/ui';
import { colors, gradients, radius, shadow, spacing, typography } from '../config/theme';
import { formatConfidence, humanizeLabel } from '../utils/format';

/**
 * PANTALLA PRINCIPAL.
 *
 * Estructura: la camara ocupa la mayor parte de la pantalla; debajo, una tira
 * compacta con las ultimas senas reconocidas. Los datos tecnicos viven sobre el
 * video en un HUD discreto, no en tarjetas sueltas.
 */
export default function RecognitionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { config, toggle } = useSettings();
  const { addSign, messages } = useConversation();
  const tts = useTextToSpeech();
  const permission = useCameraPermission();

  const [isRunning, setIsRunning] = useState(false);
  const [facing, setFacing] = useState('front');
  const [cameraBox, setCameraBox] = useState({ width: 0, height: 0 });
  const hapticsRef = useRef(null);

  // Carga perezosa de haptics: opcional, nunca debe romper la pantalla.
  useEffect(() => {
    try {
      hapticsRef.current = require('expo-haptics');
    } catch {
      hapticsRef.current = null;
    }
  }, []);

  /** Una sena confirmada por el estabilizador se convierte en mensaje. */
  const handleCommit = useCallback(
    (committed) => {
      const message = addSign(committed);

      if (config.hapticsOnCommit && hapticsRef.current && Platform.OS !== 'web') {
        hapticsRef.current.notificationAsync?.(
          hapticsRef.current.NotificationFeedbackType.Success
        );
      }
      if (config.autoSpeak) {
        tts.speak(message.text, message.id);
      }
    },
    [addSign, config.autoSpeak, config.hapticsOnCommit, tts]
  );

  const {
    engineState,
    engineError,
    engineId,
    labels,
    landmarkFrame,
    cameraState,
    recognition,
    telemetry,
    reset,
  } = useSignRecognition({ enabled: isRunning && permission.status !== 'denied', onCommit: handleCommit });

  const toggleRun = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }
    if (permission.status === 'undetermined') {
      permission.request().then((status) => {
        if (status !== 'denied') setIsRunning(true);
      });
      return;
    }
    setIsRunning(true);
  }, [isRunning, permission]);

  const recentSigns = messages.filter((m) => m.source === MessageSource.SIGN).slice(-6).reverse();

  // Altura de la camara: protagonista absoluta, pero deja ver la tira inferior.
  const cameraHeight = Math.max(340, Math.min(height * 0.56, 560));

  const effectiveState =
    permission.status === 'denied'
      ? CameraState.PERMISSION_DENIED
      : permission.isRequesting
      ? CameraState.REQUESTING_PERMISSION
      : engineState === 'loading'
      ? CameraState.INITIALIZING
      : engineState === 'error'
      ? CameraState.ERROR
      : cameraState;

  return (
    <View style={styles.root}>
      {/* ================= CAMARA ================= */}
      <View style={[styles.cameraWrap, { height: cameraHeight + insets.top }]}>
        <LiveCameraView
          active={isRunning}
          facing={facing}
          style={StyleSheet.absoluteFill}
        >
          <View
            style={StyleSheet.absoluteFill}
            onLayout={(e) => setCameraBox(e.nativeEvent.layout)}
          >
            {config.showLandmarks && isRunning ? (
              <LandmarkOverlay
                frame={landmarkFrame}
                width={cameraBox.width}
                height={cameraBox.height}
              />
            ) : null}
          </View>

          {/* Degradados para que el texto siempre sea legible sobre el video */}
          <LinearGradient colors={gradients.cameraTop} style={[styles.gradTop, { height: 150 + insets.top }]} pointerEvents="none" />
          <LinearGradient colors={gradients.cameraBottom} style={styles.gradBottom} pointerEvents="none" />

          {/* ---- Barra superior ---- */}
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Ionicons name="hand-left" size={16} color={colors.ink} />
              </View>
              <View>
                <Text style={styles.brandName}>LESSA</Text>
                <Text style={styles.brandSub}>Reconocimiento en vivo</Text>
              </View>
            </View>

            <View style={styles.topActions}>
              <IconButton
                icon="camera-reverse-outline"
                size={38}
                onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
              />
              <IconButton
                icon="options-outline"
                size={38}
                style={{ marginLeft: spacing.sm }}
                onPress={() => navigation.navigate('Settings')}
              />
            </View>
          </View>

          <View style={[styles.statusRow, { top: insets.top + 68 }]}>
            <StatusChip state={effectiveState} />
            {engineId === 'mock' ? (
              <View style={styles.demoTag}>
                <Text style={styles.demoTagText}>DEMO</Text>
              </View>
            ) : null}
          </View>

          {/* ---- Guia de encuadre ---- */}
          {!isRunning && permission.status !== 'denied' && engineState !== 'error' ? (
            <View style={styles.framingGuide} pointerEvents="none">
              <View style={styles.guideBox} />
            </View>
          ) : null}

          {/* ---- HUD inferior ---- */}
          <View style={styles.hud}>
            <PredictionPanel
              recognition={recognition}
              cameraState={effectiveState}
              threshold={config.confidenceThreshold}
              stabilityFrames={config.stabilityFrames}
              showTelemetry={config.showTelemetry}
              telemetry={telemetry}
            />
          </View>

          {/* ---- Avisos bloqueantes ---- */}
          {permission.status === 'denied' ? (
            <CameraNotice
              icon="lock-closed"
              title="Sin permiso de camara"
              description="LESSA necesita la camara para leer las senas. Activa el permiso desde los ajustes del sistema."
              action={<PrimaryButton label="Volver a pedir permiso" onPress={permission.request} />}
            />
          ) : null}

          {engineState === 'error' ? (
            <CameraNotice
              icon="alert-circle"
              title="Motor no disponible"
              description={engineError ?? 'No se pudo inicializar el modelo de reconocimiento.'}
            />
          ) : null}
        </LiveCameraView>
      </View>

      {/* ================= CONTROLES + RECIENTES ================= */}
      <View style={styles.sheet}>
        <View style={styles.grabber} />

        <View style={styles.controls}>
          <IconButton
            icon="refresh"
            tone="light"
            size={46}
            onPress={reset}
          />

          <Pressable
            onPress={toggleRun}
            disabled={engineState !== 'ready' && !isRunning}
            style={({ pressed }) => [styles.mainBtn, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient
              colors={isRunning ? ['#E8556B', '#C93049'] : ['#2C7BEE', '#1553B3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainBtnFill}
            >
              <Ionicons name={isRunning ? 'stop' : 'play'} size={22} color={colors.onDark} />
              <Text style={styles.mainBtnText}>
                {isRunning ? 'Detener' : engineState === 'loading' ? 'Cargando modelo' : 'Reconocer'}
              </Text>
            </LinearGradient>
          </Pressable>

          <IconButton
            icon={config.autoSpeak ? 'volume-high' : 'volume-mute-outline'}
            tone="light"
            size={46}
            active={config.autoSpeak}
            onPress={() => toggle('autoSpeak')}
          />
        </View>

        {/* ---- Vocabulario cargado desde el modelo ---- */}
        <View style={styles.vocabRow}>
          <Text style={styles.vocabLabel}>
            Vocabulario del modelo · {Math.max(0, labels.length - 1)}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vocabList}>
            {labels
              .filter((l) => l !== config.noSignLabel)
              .map((label) => {
                const isActive =
                  recognition.activeLabel === label || recognition.latchedLabel === label;
                return (
                  <View key={label} style={[styles.vocabChip, isActive && styles.vocabChipActive]}>
                    <Text style={[styles.vocabChipText, isActive && styles.vocabChipTextActive]}>
                      {humanizeLabel(label)}
                    </Text>
                  </View>
                );
              })}
            {labels.length === 0 ? <Text style={styles.vocabEmpty}>Cargando clases...</Text> : null}
          </ScrollView>
        </View>

        {/* ---- Ultimas senas ---- */}
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Ultimas senas</Text>
          <Pressable onPress={() => navigation.navigate('HistorialTab')} hitSlop={8}>
            <Text style={styles.recentAction}>Ver conversacion</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
        >
          {recentSigns.length === 0 ? (
            <View style={styles.recentEmpty}>
              <Ionicons name="hand-left-outline" size={16} color={colors.textMuted} />
              <Text style={styles.recentEmptyText}>Aun no hay senas reconocidas</Text>
            </View>
          ) : (
            recentSigns.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => tts.speak(m.text, m.id)}
                style={[styles.recentCard, tts.speakingId === m.id && styles.recentCardActive]}
              >
                <Text style={styles.recentCardLabel} numberOfLines={1}>
                  {humanizeLabel(m.text)}
                </Text>
                <View style={styles.recentCardFoot}>
                  <Text style={styles.recentCardConf}>{formatConfidence(m.confidence)}</Text>
                  <Ionicons
                    name={tts.speakingId === m.id ? 'volume-high' : 'volume-medium-outline'}
                    size={14}
                    color={colors.primary}
                  />
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  cameraWrap: {
    backgroundColor: colors.ink,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0 },
  gradBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 260 },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  brandName: { ...typography.section, color: colors.onDark, letterSpacing: 1.5 },
  brandSub: { ...typography.micro, color: colors.onDarkFaint, letterSpacing: 0.3 },
  topActions: { flexDirection: 'row', alignItems: 'center' },

  statusRow: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoTag: {
    marginLeft: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(232,163,61,0.9)',
  },
  demoTagText: { ...typography.micro, color: colors.ink, fontSize: 9 },

  // La guia vive SOLO en el espacio libre sobre el HUD, nunca por detras de el.
  framingGuide: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 110,
    paddingBottom: 200,
  },
  guideBox: {
    width: '52%',
    aspectRatio: 0.78,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },

  hud: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.xl },

  sheet: { flex: 1, paddingTop: spacing.md },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  mainBtn: { flex: 1, marginHorizontal: spacing.md, borderRadius: radius.md, overflow: 'hidden', ...shadow.raised },
  mainBtnFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  mainBtnText: { ...typography.bodyStrong, color: colors.onDark, marginLeft: 9 },

  vocabRow: { marginTop: spacing.lg },
  vocabLabel: {
    ...typography.micro,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  vocabList: { paddingHorizontal: spacing.lg, gap: 8 },
  vocabChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vocabChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  vocabChipText: { ...typography.caption, color: colors.textSoft, fontSize: 12 },
  vocabChipTextActive: { color: colors.onDark },
  vocabEmpty: { ...typography.caption, color: colors.textMuted },

  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  recentTitle: { ...typography.section, fontSize: 15, color: colors.text },
  recentAction: { ...typography.caption, color: colors.primary, fontSize: 12 },

  recentList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: 10 },
  recentCard: {
    minWidth: 128,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    ...shadow.card,
  },
  recentCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  recentCardLabel: { ...typography.bodyStrong, color: colors.text },
  recentCardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  recentCardConf: { ...typography.micro, color: colors.textMuted, letterSpacing: 0 },

  recentEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  recentEmptyText: { ...typography.caption, color: colors.textMuted, marginLeft: 8 },
});
