import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../config/theme';
import { MessageSource } from '../conversation/messageFactory';
import { formatClock, formatConfidence, humanizeLabel } from '../utils/format';

/**
 * Burbuja de conversacion.
 *
 * El origen se distingue por tres senales a la vez (no solo color, por
 * accesibilidad): lado, icono y etiqueta de origen.
 *   - LESSA  -> derecha, azul profundo, icono de mano, muestra confianza
 *   - Voz    -> izquierda, superficie clara, icono de microfono
 *   - Sistema-> centrado, discreto
 */
export function MessageBubble({ message, onSpeak, isSpeaking }) {
  if (message.source === MessageSource.SYSTEM) {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  const isSign = message.source === MessageSource.SIGN;

  return (
    <View style={[styles.row, isSign ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isSign ? styles.bubbleSign : styles.bubbleVoice]}>
        <View style={styles.metaRow}>
          <Ionicons
            name={isSign ? 'hand-left' : 'mic'}
            size={12}
            color={isSign ? colors.accent : colors.primary}
          />
          <Text style={[styles.metaText, isSign && styles.metaTextSign]}>
            {isSign ? 'LESSA' : 'Voz'}
          </Text>
          {isSign && message.confidence != null ? (
            <>
              <View style={[styles.metaSep, isSign && { backgroundColor: colors.onDarkFaint }]} />
              <Text style={[styles.metaText, styles.metaTextSign]}>
                {formatConfidence(message.confidence)}
              </Text>
            </>
          ) : null}
        </View>

        <Text style={[styles.text, isSign && styles.textSign]}>
          {isSign ? humanizeLabel(message.text) : message.text}
        </Text>

        <View style={styles.footRow}>
          <Text style={[styles.time, isSign && styles.timeSign]}>{formatClock(message.createdAt)}</Text>
          {isSign && onSpeak ? (
            <Pressable
              onPress={() => onSpeak(message)}
              hitSlop={10}
              style={[styles.speakBtn, isSpeaking && styles.speakBtnActive]}
            >
              <Ionicons
                name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                size={15}
                color={colors.onDark}
              />
              <Text style={styles.speakLabel}>{isSpeaking ? 'Sonando' : 'Escuchar'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },

  bubble: { maxWidth: '82%', padding: spacing.md, borderRadius: radius.lg },
  bubbleSign: {
    backgroundColor: colors.ink,
    borderBottomRightRadius: radius.xs,
  },
  bubbleVoice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.xs,
  },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaText: { ...typography.micro, color: colors.textMuted, marginLeft: 5 },
  metaTextSign: { color: colors.onDarkSoft },
  metaSep: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginHorizontal: 7,
  },

  text: { ...typography.body, fontSize: 16, color: colors.text, lineHeight: 22 },
  textSign: { color: colors.onDark, fontWeight: '700' },

  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  time: { ...typography.micro, color: colors.textMuted, letterSpacing: 0 },
  timeSign: { color: colors.onDarkFaint },

  speakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginLeft: spacing.md,
  },
  speakBtnActive: { backgroundColor: colors.primary },
  speakLabel: { ...typography.micro, color: colors.onDark, marginLeft: 5, letterSpacing: 0.3 },

  systemRow: { alignItems: 'center', marginVertical: spacing.sm, paddingHorizontal: spacing.xl },
  systemText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
    textAlign: 'center',
  },
});

export default MessageBubble;
