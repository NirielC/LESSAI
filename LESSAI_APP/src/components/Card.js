import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../config/theme';

/**
 * Superficie base de la app: blanca, muy redondeada, sombra suave.
 * Con `onPress` se comporta como Pressable; sin el, es un View.
 * (View no admite `style` como funcion, por eso los dos caminos estan separados.)
 */
export function Card({ children, style, onPress, dark = false, padded = true }) {
  const base = [styles.card, dark && styles.dark, padded && styles.padded, style];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: {
    padding: spacing.lg,
  },
  dark: {
    backgroundColor: colors.ink,
    borderColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

export default Card;
