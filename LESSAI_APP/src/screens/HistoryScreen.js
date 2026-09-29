import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import MessageBubble from '../components/MessageBubble';
import { EmptyState, IconButton, StatTile } from '../components/ui';
import { useConversation, MessageSource } from '../conversation/ConversationContext';
import useTextToSpeech from '../tts/useTextToSpeech';
import { colors, radius, spacing, typography } from '../config/theme';
import { formatClock, formatRelativeDay } from '../utils/format';

const FILTERS = [
  { id: 'all', label: 'Todo', icon: 'albums-outline' },
  { id: MessageSource.SIGN, label: 'LESSA', icon: 'hand-left-outline' },
  { id: MessageSource.VOICE, label: 'Voz', icon: 'mic-outline' },
];

/**
 * HISTORIAL / CONVERSACIONES.
 *
 * Vista tipo mensajeria sobre el estado de ConversationContext. Los dos canales
 * comparten linea de tiempo pero se distinguen por lado, color e icono.
 */
export default function HistoryScreen() {
  const { conversations, active, messages, setActive, startNew, clearActive, stats } =
    useConversation();
  const tts = useTextToSpeech();
  const [filter, setFilter] = useState('all');
  const listRef = useRef(null);

  const filtered = useMemo(
    () => (filter === 'all' ? messages : messages.filter((m) => m.source === filter)),
    [messages, filter]
  );

  const handleSpeak = useCallback(
    (message) => {
      if (tts.speakingId === message.id) tts.stop();
      else tts.speak(message.text, message.id);
    },
    [tts]
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        eyebrow="Conversaciones"
        title="Historial"
        subtitle={active?.title}
        right={
          <View style={{ flexDirection: 'row' }}>
            <IconButton icon="add" tone="light" size={40} onPress={() => startNew('Nueva conversacion')} />
            <IconButton
              icon="trash-outline"
              tone="light"
              size={40}
              style={{ marginLeft: spacing.sm }}
              onPress={clearActive}
            />
          </View>
        }
      />

      {/* ---- Resumen ---- */}
      <View style={styles.summaryWrap}>
        <Card style={styles.summary}>
          <View style={styles.statRow}>
            <StatTile value={stats.total} label="Mensajes" icon="chatbubbles-outline" tone="info" />
            <View style={styles.statDivider} />
            <StatTile value={stats.signs} label="Por LESSA" icon="hand-left-outline" tone="accent" />
            <View style={styles.statDivider} />
            <StatTile value={stats.voice} label="Por voz" icon="mic-outline" tone="success" />
          </View>
        </Card>
      </View>

      {/* ---- Otras conversaciones ---- */}
      {conversations.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.convList}
          style={{ flexGrow: 0 }}
        >
          {conversations.map((c) => {
            const isActive = c.id === active?.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setActive(c.id)}
                style={[styles.convChip, isActive && styles.convChipActive]}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={13}
                  color={isActive ? colors.onDark : colors.textSoft}
                />
                <Text style={[styles.convChipText, isActive && styles.convChipTextActive]} numberOfLines={1}>
                  {c.title}
                </Text>
                <Text style={[styles.convChipMeta, isActive && { color: colors.onDarkFaint }]}>
                  {c.messages.length}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {/* ---- Filtros ---- */}
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filter, isActive && styles.filterActive]}
            >
              <Ionicons name={f.icon} size={14} color={isActive ? colors.primary : colors.textMuted} />
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ---- Conversacion ---- */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="chatbubbles-outline"
            title="Conversacion vacia"
            description="Reconoce una sena en la pestana LESSA o usa el microfono para empezar."
          />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.dayChipWrap}>
              <Text style={styles.dayChip}>
                {formatRelativeDay(active?.startedAt ?? Date.now())} ·{' '}
                {formatClock(active?.startedAt ?? Date.now())}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onSpeak={handleSpeak}
              isSpeaking={tts.speakingId === item.id}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  summaryWrap: { paddingHorizontal: spacing.lg },
  summary: { paddingVertical: spacing.lg },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: 1, height: 34, backgroundColor: colors.divider, marginHorizontal: spacing.md },

  convList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 8 },
  convChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 220,
  },
  convChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  convChipText: { ...typography.caption, fontSize: 12, color: colors.textSoft, marginHorizontal: 7, flexShrink: 1 },
  convChipTextActive: { color: colors.onDark },
  convChipMeta: { ...typography.micro, color: colors.textMuted, letterSpacing: 0 },

  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 8,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.bgAlt,
  },
  filterActive: { backgroundColor: colors.primarySoft },
  filterText: { ...typography.caption, fontSize: 12, color: colors.textMuted, marginLeft: 6 },
  filterTextActive: { color: colors.primary },

  listContent: { paddingTop: spacing.sm, paddingBottom: 120 },
  dayChipWrap: { alignItems: 'center', marginBottom: spacing.md },
  dayChip: {
    ...typography.micro,
    color: colors.textMuted,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },

  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
});
