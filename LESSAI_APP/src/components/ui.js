import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, spacing, typography } from '../config/theme';

/* ------------------------------------------------------------------ */
/*  Titulos de seccion                                                 */
/* ------------------------------------------------------------------ */

export function SectionTitle({ children, action, onAction, style }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Eyebrow({ children, tone = 'muted', style }) {
  return <Text style={[styles.eyebrow, tone === 'accent' && styles.eyebrowAccent, style]}>{children}</Text>;
}

/* ------------------------------------------------------------------ */
/*  Pills / chips                                                      */
/* ------------------------------------------------------------------ */

const TONES = {
  neutral: { bg: colors.bgAlt, fg: colors.textSoft },
  info: { bg: colors.primarySoft, fg: colors.primary },
  accent: { bg: colors.accentSoft, fg: colors.primaryDark },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  muted: { bg: colors.divider, fg: colors.textMuted },
  live: { bg: 'rgba(255,77,109,0.14)', fg: colors.live },
  onDark: { bg: 'rgba(255,255,255,0.14)', fg: colors.onDark },
};

export function Pill({ children, tone = 'neutral', icon, style, dot = false }) {
  const t = TONES[tone] ?? TONES.neutral;
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      {icon ? <Ionicons name={icon} size={13} color={t.fg} style={{ marginRight: 5 }} /> : null}
      <Text style={[styles.pillText, { color: t.fg }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Botones                                                            */
/* ------------------------------------------------------------------ */

export function PrimaryButton({ label, icon, onPress, disabled, style, variant = 'solid', full }) {
  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={variant === 'solid' ? colors.onDark : colors.primary}
          style={{ marginRight: label ? 8 : 0 }}
        />
      ) : null}
      {label ? (
        <Text style={[styles.btnLabel, variant !== 'solid' && { color: colors.primary }]}>{label}</Text>
      ) : null}
    </>
  );

  if (variant === 'solid') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.btn,
          full && { alignSelf: 'stretch' },
          disabled && styles.btnDisabled,
          pressed && styles.btnPressed,
          style,
        ]}
      >
        <LinearGradient
          colors={disabled ? [colors.borderStrong, colors.borderStrong] : ['#2C7BEE', '#1553B3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btnFill}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        styles.btnGhostOuter,
        full && { alignSelf: 'stretch' },
        pressed && styles.btnPressed,
        style,
      ]}
    >
      <View style={[styles.btnFill, styles.btnGhost]}>{content}</View>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, tone = 'onDark', size = 42, style, active }) {
  const isDark = tone === 'onDark';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active
            ? colors.primary
            : isDark
            ? 'rgba(255,255,255,0.16)'
            : colors.bgAlt,
        },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={size * 0.45}
        color={active ? colors.onDark : isDark ? colors.onDark : colors.ink}
      />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Barra de confianza                                                 */
/* ------------------------------------------------------------------ */

export function ConfidenceBar({ value = 0, threshold = 0.8, height = 6, style, onDark = true }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(1, value)),
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const reached = value >= threshold;

  return (
    <View
      style={[
        styles.barTrack,
        { height, borderRadius: height / 2, backgroundColor: onDark ? 'rgba(255,255,255,0.16)' : colors.divider },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.barFill,
          {
            width,
            borderRadius: height / 2,
            backgroundColor: reached ? colors.success : colors.accent,
          },
        ]}
      />
      {/* Marca del umbral configurado */}
      <View style={[styles.threshold, { left: `${threshold * 100}%` }]} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Punto pulsante "en vivo"                                           */
/* ------------------------------------------------------------------ */

export function LiveDot({ color = colors.live, size = 8, active = true }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true, isInteraction: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Estado vacio                                                       */
/* ------------------------------------------------------------------ */

export function EmptyState({ icon = 'chatbubbles-outline', title, description, action }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDesc}>{description}</Text> : null}
      {action}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Fila de dato clave                                                 */
/* ------------------------------------------------------------------ */

export function StatTile({ value, label, icon, tone = 'info' }) {
  const t = TONES[tone] ?? TONES.info;
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={16} color={t.fg} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.section, color: colors.text },
  sectionAction: { ...typography.caption, color: colors.primary },
  eyebrow: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  eyebrowAccent: { color: colors.accent },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: { ...typography.caption, fontSize: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },

  btn: { borderRadius: radius.md, overflow: 'hidden', ...shadow.card },
  btnFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  btnGhostOuter: { shadowOpacity: 0, elevation: 0 },
  btnGhost: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  btnLabel: { ...typography.bodyStrong, color: colors.onDark },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },

  iconBtn: { alignItems: 'center', justifyContent: 'center' },

  barTrack: { width: '100%', overflow: 'hidden' },
  barFill: { height: '100%' },
  threshold: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: '160%',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typography.section, color: colors.text, textAlign: 'center' },
  emptyDesc: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 21,
  },

  stat: { flex: 1, alignItems: 'flex-start' },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { ...typography.title, fontSize: 20, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 12 },

  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
});

export default {
  SectionTitle,
  Eyebrow,
  Pill,
  PrimaryButton,
  IconButton,
  ConfidenceBar,
  LiveDot,
  EmptyState,
  StatTile,
  Divider,
};
