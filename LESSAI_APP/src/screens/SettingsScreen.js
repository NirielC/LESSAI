import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import { SectionTitle, Pill, PrimaryButton } from '../components/ui';
import { useSettings } from '../config/SettingsContext';
import { CONFIG_BOUNDS } from '../config/recognition.config';
import { colors, radius, spacing, typography } from '../config/theme';
import { clamp } from '../utils/format';

/**
 * AJUSTES DE LA APP.
 *
 * El reconocimiento real corre en el servidor. Esta pantalla solo modifica
 * parametros de comportamiento de la app: estabilizacion y experiencia de UI.
 */

function Stepper({ label, description, value, bounds, onChange }) {
  const dec = () => onChange(clamp(Number((value - bounds.step).toFixed(4)), bounds.min, bounds.max));
  const inc = () => onChange(clamp(Number((value + bounds.step).toFixed(4)), bounds.min, bounds.max));
  const ratio = (value - bounds.min) / (bounds.max - bounds.min);

  return (
    <View style={styles.stepper}>
      <View style={styles.stepperTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingDesc}>{description}</Text>
        </View>
        <View style={styles.stepperControls}>
          <Pressable onPress={dec} style={styles.stepBtn} hitSlop={6}>
            <Ionicons name="remove" size={16} color={colors.primary} />
          </Pressable>
          <Text style={styles.stepValue}>{bounds.format(value)}</Text>
          <Pressable onPress={inc} style={styles.stepBtn} hitSlop={6}>
            <Ionicons name="add" size={16} color={colors.primary} />
          </Pressable>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
    </View>
  );
}

function ToggleRow({ icon, label, description, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { config, setValue, toggle, reset } = useSettings();

  return (
    <View style={styles.root}>
      <ScreenHeader
        eyebrow="Configuracion"
        title="Reconocimiento"
        subtitle="Parametros del pipeline"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- Servidor ---------- */}
        <Card dark style={styles.engineCard}>
          <View style={styles.engineHeader}>
            <View>
              <Text style={styles.engineEyebrow}>RECONOCIMIENTO</Text>
              <Text style={styles.engineName}>Servidor LESSAI</Text>
            </View>
            <Pill tone="success">SERVIDOR</Pill>
          </View>
          <View style={styles.engineRow}>
            <Ionicons name="hardware-chip-outline" size={14} color={colors.onDarkFaint} />
            <Text style={styles.engineMeta}>MediaPipe + LSTM TensorFlow/Keras</Text>
          </View>
          <View style={styles.engineRow}>
            <Ionicons name="wifi-outline" size={14} color={colors.onDarkFaint} />
            <Text style={styles.engineMeta}>192.168.4.2:8000/app</Text>
          </View>
          <Text style={styles.engineNote}>
            La ESP32-CAM envia el video al servidor. La app recibe las predicciones por WebSocket;
            no ejecuta el modelo ni usa la camara del telefono.
          </Text>
        </Card>

        {/* ---------- Validacion ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Validacion de la prediccion</SectionTitle>
        <Card>
          <Stepper
            label="Umbral de confianza"
            description="Minimo para considerar candidata una prediccion recibida"
            value={config.confidenceThreshold}
            bounds={CONFIG_BOUNDS.confidenceThreshold}
            onChange={(v) => setValue('confidenceThreshold', v)}
          />
          <View style={styles.sep} />
          <Stepper
            label="Estabilidad"
            description="Predicciones iguales seguidas para confirmar la sena"
            value={config.stabilityFrames}
            bounds={CONFIG_BOUNDS.stabilityFrames}
            onChange={(v) => setValue('stabilityFrames', v)}
          />
          <View style={styles.sep} />
          <Stepper
            label="Tiempo de espera"
            description="Pausa tras aceptar una sena antes de aceptar otra"
            value={config.cooldownMs}
            bounds={CONFIG_BOUNDS.cooldownMs}
            onChange={(v) => setValue('cooldownMs', v)}
          />
          <View style={styles.sep} />
          <ToggleRow
            icon="repeat-outline"
            label="Exigir cambio de sena"
            description="Impide que mantener la misma sena genere mensajes repetidos"
            value={config.requireChangeBeforeRepeat}
            onChange={() => toggle('requireChangeBeforeRepeat')}
          />
        </Card>

        {/* ---------- Interfaz ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Interfaz</SectionTitle>
        <Card>
          <ToggleRow
            icon="body-outline"
            label="Mostrar puntos clave"
            description="Dibuja el esqueleto detectado sobre el video"
            value={config.showLandmarks}
            onChange={() => toggle('showLandmarks')}
          />
          <View style={styles.sep} />
          <ToggleRow
            icon="stats-chart-outline"
            label="Panel tecnico"
            description="Muestra fps, latencia y llenado del buffer"
            value={config.showTelemetry}
            onChange={() => toggle('showTelemetry')}
          />
          <View style={styles.sep} />
          <ToggleRow
            icon="volume-high-outline"
            label="Reproduccion automatica"
            description="Lee en voz alta cada sena reconocida"
            value={config.autoSpeak}
            onChange={() => toggle('autoSpeak')}
          />
          <View style={styles.sep} />
          <ToggleRow
            icon="phone-portrait-outline"
            label="Vibracion al reconocer"
            description="Confirmacion tactil cuando se acepta una sena"
            value={config.hapticsOnCommit}
            onChange={() => toggle('hapticsOnCommit')}
          />
        </Card>

        <PrimaryButton
          label="Restaurar valores por defecto"
          icon="refresh"
          variant="ghost"
          onPress={reset}
          style={{ marginTop: spacing.xl }}
          full
        />

        <Text style={styles.footer}>
          Estos valores controlan la interpretacion de predicciones y la interfaz de la app.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 60 },
  sectionSpacing: { marginTop: spacing.xl, paddingHorizontal: 2 },

  engineCard: { backgroundColor: colors.ink },
  engineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  engineEyebrow: { ...typography.micro, color: colors.onDarkFaint, marginBottom: 3 },
  engineName: { ...typography.section, color: colors.onDark },
  engineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  engineMeta: { ...typography.caption, fontSize: 12, color: colors.onDarkSoft, marginLeft: 8 },
  engineNote: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: colors.onDarkFaint,
    lineHeight: 18,
    marginTop: spacing.md,
  },

  settingLabel: { ...typography.bodyStrong, color: colors.text },
  settingDesc: { ...typography.caption, fontWeight: '500', color: colors.textMuted, marginTop: 2, lineHeight: 17 },

  stepper: {},
  stepperTop: { flexDirection: 'row', alignItems: 'center' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.md },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    ...typography.caption,
    color: colors.text,
    minWidth: 66,
    textAlign: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  trackFill: { height: '100%', borderRadius: 2, backgroundColor: colors.primary },

  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  sep: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.lg },

  warn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  warnText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: '#8A6122',
    marginLeft: 8,
    flex: 1,
    lineHeight: 17,
  },

  footer: {
    ...typography.micro,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    letterSpacing: 0.2,
  },
});
