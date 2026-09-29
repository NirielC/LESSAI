import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../config/theme';

/**
 * Envoltorio del preview de camara.
 *
 * Resuelve expo-camera en tiempo de ejecucion. Si el modulo nativo no esta
 * disponible (web, simulador sin camara, Expo Go recortado) renderiza un
 * "preview simulado" con la misma caja, para que la demo se pueda capturar
 * igual en cualquier entorno.
 */
function resolveCameraComponent() {
  // En web el reconocimiento es simulado de todas formas, asi que abrir la
  // camara solo aporta un permiso que el usuario no necesita conceder.
  if (Platform.OS === 'web') return null;
  try {
    const mod = require('expo-camera');
    // SDK modernos exportan CameraView; los antiguos, Camera.
    return mod.CameraView ?? mod.Camera ?? null;
  } catch {
    return null;
  }
}

export default function LiveCameraView({ active, facing = 'front', style, children, onMount }) {
  const CameraComponent = useMemo(resolveCameraComponent, []);
  const [failed, setFailed] = useState(false);
  const usingReal = Boolean(CameraComponent) && !failed;

  useEffect(() => {
    onMount?.(usingReal);
  }, [usingReal, onMount]);

  return (
    <View style={[styles.root, style]}>
      {usingReal ? (
        <ErrorBoundary onError={() => setFailed(true)}>
          <CameraComponent
            style={StyleSheet.absoluteFill}
            facing={facing}
            active={active}
            // La demo no graba ni toma fotos: solo necesita el preview.
            onMountError={() => setFailed(true)}
          />
        </ErrorBoundary>
      ) : (
        <SimulatedPreview />
      )}
      {children}
    </View>
  );
}

/** Fondo animado que imita una habitacion iluminada, para capturas sin camara. */
function SimulatedPreview() {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
        Animated.timing(drift, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });

  return (
    <View style={styles.simulated}>
      <LinearGradient
        colors={['#22405F', '#16283F', '#0C1B2E']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />
      <Animated.View style={[styles.simulatedGlow, { transform: [{ translateY }] }]} />
      <View style={styles.simulatedBadge}>
        <Text style={styles.simulatedBadgeText}>PREVIEW SIMULADO</Text>
      </View>
    </View>
  );
}

/** Evita que un fallo del modulo nativo tumbe toda la pantalla. */
class ErrorBoundary extends React.Component {
  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  simulated: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedGlow: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(78, 200, 245, 0.12)',
  },
  simulatedBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  simulatedBadgeText: {
    ...typography.micro,
    color: colors.onDarkSoft,
  },
});
