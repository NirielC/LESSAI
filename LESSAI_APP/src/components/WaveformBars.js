import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../config/theme';

const BAR_COUNT = 27;

/**
 * Visualizador de onda para la pantalla de voz.
 * Reacciona al nivel que emite el servicio de STT; en reposo queda plano.
 */
export function WaveformBars({ level = 0, active = false, color = colors.primary, height = 56 }) {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.12))
  ).current;

  useEffect(() => {
    if (!active) {
      Animated.parallel(
        bars.map((b) =>
          Animated.timing(b, { toValue: 0.12, duration: 240, useNativeDriver: false })
        )
      ).start();
      return;
    }

    // Curva tipo campana: el centro se mueve mas que los bordes.
    Animated.parallel(
      bars.map((b, i) => {
        const center = (BAR_COUNT - 1) / 2;
        const falloff = 1 - Math.abs(i - center) / center;
        const target = Math.max(
          0.12,
          Math.min(1, level * (0.45 + falloff * 0.85) * (0.6 + Math.random() * 0.7))
        );
        return Animated.timing(b, {
          toValue: target,
          duration: 130,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        });
      })
    ).start();
  }, [level, active, bars]);

  return (
    <View style={[styles.row, { height }]}>
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              opacity: active ? 0.55 + (i % 3) * 0.15 : 0.25,
              height: b.interpolate({ inputRange: [0, 1], outputRange: [4, height] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  bar: { width: 3.5, borderRadius: 2 },
});

export default WaveformBars;
