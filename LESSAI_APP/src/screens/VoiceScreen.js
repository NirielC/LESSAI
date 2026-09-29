import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import WaveformBars from '../components/WaveformBars';
import { Pill, SectionTitle, EmptyState } from '../components/ui';
import useSpeechToText, { SttState } from '../speech/useSpeechToText';
import { useConversation, MessageSource } from '../conversation/ConversationContext';
import { colors, shadow, spacing, typography } from '../config/theme';
import { formatClock } from '../utils/format';

/**
 * PANTALLA DE VOZ.
 *
 * La usa la persona oyente: habla y la app transcribe. El foco visual esta en
 * el boton de microfono y en el texto en vivo; nada mas compite por atencion.
 */
export default function VoiceScreen() {
  const { addVoice, messages } = useConversation();

  const handleFinal = useCallback(
    (text, meta) => {
      addVoice(text, meta);
    },
    [addVoice]
  );

  const stt = useSpeechToText({ onFinal: handleFinal });
  const voiceMessages = messages.filter((m) => m.source === MessageSource.VOICE).slice(-5).reverse();

  // Halo pulsante alrededor del microfono mientras escucha.
  const halo = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!stt.isListening) {
      halo.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }),
        Animated.timing(halo, { toValue: 0, duration: 100, useNativeDriver: true, isInteraction: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [stt.isListening, halo]);

  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const statusMeta = {
    [SttState.IDLE]: { text: 'Toca para hablar', tone: 'neutral' },
    [SttState.REQUESTING_PERMISSION]: { text: 'Solicitando microfono', tone: 'info' },
    [SttState.PERMISSION_DENIED]: { text: 'Sin permiso de microfono', tone: 'danger' },
    [SttState.LISTENING]: { text: 'Escuchando', tone: 'live' },
    [SttState.PROCESSING]: { text: 'Procesando', tone: 'info' },
    [SttState.ERROR]: { text: 'Error de reconocimiento', tone: 'danger' },
  }[stt.state] ?? { text: 'Listo', tone: 'neutral' };

  return (
    <View style={styles.root}>
      <ScreenHeader
        eyebrow="Canal de voz"
        title="Voz a texto"
        subtitle="Para la persona oyente de la conversacion"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ================ MICROFONO ================ */}
        <Card dark style={styles.micCard} padded={false}>
          <LinearGradient
            colors={['#173A68', '#0C2240']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.micGradient}
          >
            <View style={styles.micStatusRow}>
              <Pill tone={statusMeta.tone === 'live' ? 'live' : 'onDark'} dot={statusMeta.tone === 'live'}>
                {statusMeta.text}
              </Pill>
              <Text style={styles.engineTag}>STT · {stt.engineId}</Text>
            </View>

            <View style={styles.micCenter}>
              {stt.isListening ? (
                <Animated.View
                  style={[
                    styles.halo,
                    { transform: [{ scale: haloScale }], opacity: haloOpacity },
                  ]}
                />
              ) : null}

              <Pressable onPress={stt.toggle} style={({ pressed }) => [pressed && { transform: [{ scale: 0.95 }] }]}>
                <LinearGradient
                  colors={stt.isListening ? ['#E8556B', '#C93049'] : ['#4EC8F5', '#1E6BE0']}
                  style={styles.micButton}
                >
                  <Ionicons name={stt.isListening ? 'stop' : 'mic'} size={34} color={colors.onDark} />
                </LinearGradient>
              </Pressable>
            </View>

            <WaveformBars level={stt.volume} active={stt.isListening} color={colors.accent} height={44} />

            <Text style={styles.micHint}>
              {stt.isListening
                ? 'Habla con naturalidad. Se detendra al terminar la frase.'
                : 'Pulsa el microfono y habla. Lo transcrito se suma a la conversacion.'}
            </Text>
          </LinearGradient>
        </Card>

        {/* ================ TRANSCRIPCION EN VIVO ================ */}
        <Card style={styles.liveCard}>
          <View style={styles.liveHeader}>
            <Text style={styles.liveEyebrow}>TRANSCRIPCION EN VIVO</Text>
            {stt.transcript ? (
              <Pressable onPress={stt.clear} hitSlop={8}>
                <Text style={styles.clearAction}>Limpiar</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={[styles.liveText, !stt.transcript && styles.liveTextEmpty]}>
            {stt.transcript || 'El texto aparecera aqui mientras hablas...'}
          </Text>

          {stt.isListening ? (
            <View style={styles.cursorRow}>
              <View style={styles.cursor} />
            </View>
          ) : null}
        </Card>

        {/* ================ HISTORIAL DE VOZ ================ */}
        <SectionTitle style={{ marginTop: spacing.xl, paddingHorizontal: 2 }}>
          Ultimas intervenciones
        </SectionTitle>

        {voiceMessages.length === 0 ? (
          <Card>
            <EmptyState
              icon="mic-outline"
              title="Sin intervenciones todavia"
              description="Lo que transcriba el microfono aparecera aqui y en la conversacion."
            />
          </Card>
        ) : (
          voiceMessages.map((m) => (
            <Card key={m.id} style={styles.voiceItem}>
              <View style={styles.voiceItemIcon}>
                <Ionicons name="mic" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voiceItemText}>{m.text}</Text>
                <Text style={styles.voiceItemTime}>{formatClock(m.createdAt)}</Text>
              </View>
            </Card>
          ))
        )}

        <Text style={styles.disclaimer}>
          Demo visual: el motor de voz esta simulado. Ver README para conectar
          expo-speech-recognition en un Development Build.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120 },

  micCard: { overflow: 'hidden', ...shadow.raised },
  micGradient: { padding: spacing.xl },
  micStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  engineTag: { ...typography.micro, color: colors.onDarkFaint },

  micCenter: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  halo: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micHint: {
    ...typography.caption,
    color: colors.onDarkSoft,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 19,
    fontWeight: '500',
  },

  liveCard: { marginTop: spacing.lg, minHeight: 130 },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  liveEyebrow: { ...typography.micro, color: colors.textMuted },
  clearAction: { ...typography.caption, color: colors.primary, fontSize: 12 },
  liveText: { ...typography.body, fontSize: 17, color: colors.text, lineHeight: 25 },
  liveTextEmpty: { color: colors.textMuted, fontStyle: 'italic' },
  cursorRow: { marginTop: spacing.sm },
  cursor: { width: 22, height: 3, borderRadius: 2, backgroundColor: colors.primary },

  voiceItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  voiceItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  voiceItemText: { ...typography.body, color: colors.text, lineHeight: 21 },
  voiceItemTime: { ...typography.micro, color: colors.textMuted, marginTop: 5, letterSpacing: 0 },

  disclaimer: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
});
