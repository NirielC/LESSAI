import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PinStatusCard from '../components/PinStatusCard';
import MessageBubble from '../components/MessageBubble';
import { EmptyState, IconButton } from '../components/ui';
import useSignStream from '../recognition/useSignStream';
import useSpeechToText from '../speech/useSpeechToText';
import useTextToSpeech from '../tts/useTextToSpeech';
import { useSettings } from '../config/SettingsContext';
import { useConversation } from '../conversation/ConversationContext';
import { colors, radius, shadow, spacing, typography } from '../config/theme';

/**
 * PANTALLA PRINCIPAL (modo servidor).
 *
 * El pin captura, el servidor reconoce y esta pantalla es lo que ve la persona
 * oyente: la conversacion, con una tarjeta viva arriba que dice que sena se
 * esta reconociendo en este momento.
 *
 * La barra inferior permite responder por voz sin cambiar de pestana, que es
 * el gesto natural: leo lo que me dijeron y contesto en el acto.
 */
export default function LiveConversationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { config, toggle } = useSettings();
  const { addSign, addVoice, messages } = useConversation();
  const tts = useTextToSpeech();
  const listRef = useRef(null);
  const hapticsRef = useRef(null);
  const [streamEnabled, setStreamEnabled] = useState(true);

  useEffect(() => {
    try {
      hapticsRef.current = require('expo-haptics');
    } catch {
      hapticsRef.current = null;
    }
  }, []);

  const handleCommit = useCallback(
    (committed) => {
      const message = addSign(committed);
      if (!message) return;
      if (config.hapticsOnCommit && hapticsRef.current && Platform.OS !== 'web') {
        hapticsRef.current.notificationAsync?.(hapticsRef.current.NotificationFeedbackType.Success);
      }
      if (config.autoSpeak) tts.speak(message.text, message.id);
    },
    [addSign, config.autoSpeak, config.hapticsOnCommit, tts]
  );

  const stream = useSignStream({
    enabled: streamEnabled,
    onCommit: handleCommit,
  });

  /** Reintento manual: baja la conexion y la vuelve a levantar. */
  const retry = useCallback(() => {
    setStreamEnabled(false);
    setTimeout(() => setStreamEnabled(true), 150);
  }, []);
  const stt = useSpeechToText({ onFinal: (text, meta) => addVoice(text, meta) });

  // La conversacion se sigue sola: el ultimo mensaje siempre visible.
  useEffect(() => {
    if (messages.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  const handleSpeak = useCallback(
    (m) => (tts.speakingId === m.id ? tts.stop() : tts.speak(m.text, m.id)),
    [tts]
  );

  return (
    <View style={styles.root}>
      {/* ================= CABECERA ================= */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Ionicons name="hand-left" size={15} color={colors.onDark} />
          </View>
          <View>
            <Text style={styles.brandName}>LESSA</Text>
            <Text style={styles.brandSub}>Traduccion en vivo</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <IconButton
            icon={config.autoSpeak ? 'volume-high' : 'volume-mute-outline'}
            tone="light"
            size={38}
            active={config.autoSpeak}
            onPress={() => toggle('autoSpeak')}
          />
          <IconButton
            icon="options-outline"
            tone="light"
            size={38}
            style={{ marginLeft: spacing.sm }}
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </View>

      {/* ================= ESTADO DEL PIN ================= */}
      <View style={styles.statusWrap}>
        <PinStatusCard
          connection={stream.connection}
          recognition={stream.recognition}
          landmarks={stream.landmarks}
          frame={stream.frame}
          stabilityFrames={config.stabilityFrames}
          threshold={config.confidenceThreshold}
        />

        {stream.error ? (
          <Pressable style={styles.errorBar} onPress={retry}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
            <Text style={styles.errorText} numberOfLines={1}>
              {stream.error}
            </Text>
            <Text style={styles.errorAction}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>

      {/* ================= CONVERSACION ================= */}
      {messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="chatbubbles-outline"
            title="Aun no hay mensajes"
            description="Cuando el servidor confirme una sena aparecera aqui. Si no hay una sena valida, la app sigue esperando sin agregar mensajes."
          />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <MessageBubble message={item} onSpeak={handleSpeak} isSpeaking={tts.speakingId === item.id} />
          )}
        />
      )}

      {/* ================= RESPONDER POR VOZ ================= */}
      <View style={[styles.replyBar, { paddingBottom: spacing.md }]}>
        <Pressable
          onPress={stt.toggle}
          style={({ pressed }) => [styles.micBtn, stt.isListening && styles.micBtnActive, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name={stt.isListening ? 'stop' : 'mic'} size={20} color={colors.onDark} />
        </Pressable>

        <View style={styles.replyTextWrap}>
          <Text style={[styles.replyText, !stt.transcript && styles.replyPlaceholder]} numberOfLines={2}>
            {stt.transcript || (stt.isListening ? 'Escuchando...' : 'Toca el microfono para responder')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  brandName: { ...typography.section, fontSize: 16, color: colors.text, letterSpacing: 1.4 },
  brandSub: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.2 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },

  statusWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },

  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginTop: spacing.sm,
  },
  errorText: { ...typography.caption, fontSize: 12, color: colors.danger, flex: 1, marginLeft: 7 },
  errorAction: { ...typography.micro, color: colors.danger },

  list: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  emptyWrap: { flex: 1, justifyContent: 'center' },

  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  micBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  micBtnActive: { backgroundColor: colors.live },
  replyTextWrap: { flex: 1, marginLeft: spacing.md },
  replyText: { ...typography.body, color: colors.text, lineHeight: 20 },
  replyPlaceholder: { color: colors.textMuted },
});
