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
 * AJUSTES DEL RECONOCIMIENTO.
 *
 * Existe para demostrar que los parametros estan centralizados: todo lo que se
 * mueve aqui sale de recognition.config.js y afecta al pipeline en caliente.
 * Se usan botones +/- en vez de un slider para no anadir otra dependencia.
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
  const { config, setValue, toggle, reset, engine } = useSettings();

  return (
    <View style={styles.root}>
      <ScreenHeader
        eyebrow="Configuracion"
        title="Reconocimiento"
        subtitle="Parametros del pipeline"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- Motor ---------- */}
        <Card dark style={styles.engineCard}>
          <View style={styles.engineHeader}>
            <View>
              <Text style={styles.engineEyebrow}>MOTOR ACTIVO</Text>
              <Text style={styles.engineName}>{engine.engine === 'mock' ? 'Simulado' : 'TensorFlow Lite'}</Text>
            </View>
            <Pill tone={engine.engine === 'mock' ? 'warning' : 'success'}>
              {engine.engine === 'mock' ? 'DEMO' : 'MODELO REAL'}
            </Pill>
          </View>
          <View style={styles.engineRow}>
            <Ionicons name="cube-outline" size={14} color={colors.onDarkFaint} />
            <Text style={styles.engineMeta}>{engine.modelAsset}</Text>
          </View>
          <View style={styles.engineRow}>
            <Ionicons name="document-text-outline" size={14} color={colors.onDarkFaint} />
            <Text style={styles.engineMeta}>{engine.manifestAsset}</Text>
          </View>
          <Text style={styles.engineNote}>
            Las clases se leen del manifiesto que acompana al modelo. Cambiar de motor es cambiar una
            linea en recognition.config.js.
          </Text>
        </Card>

        {/* ---------- Validacion ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Validacion de la prediccion</SectionTitle>
        <Card>
          <Stepper
            label="Umbral de confianza"
            description="Por debajo de este valor la prediccion se descarta"
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

        {/* ---------- Captura ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Captura y secuencia</SectionTitle>
        <Card>
          <Stepper
            label="Frecuencia de muestreo"
            description="Cuadros por segundo de los que se extraen puntos clave"
            value={config.sampleRateFps}
            bounds={CONFIG_BOUNDS.sampleRateFps}
            onChange={(v) => setValue('sampleRateFps', v)}
          />
          <View style={styles.sep} />
          <Stepper
            label="Longitud de la secuencia"
            description="Ventana temporal que recibe el modelo"
            value={config.sequenceLength}
            bounds={CONFIG_BOUNDS.sequenceLength}
            onChange={(v) => setValue('sequenceLength', v)}
          />
          <View style={styles.warn}>
            <Ionicons name="information-circle-outline" size={15} color={colors.warning} />
            <Text style={styles.warnText}>
              La longitud debe coincidir con la que espera el modelo entrenado. Cambiarla sin
              reentrenar degrada la precision.
            </Text>
          </View>
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
          Todos estos valores viven en src/config/recognition.config.js
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
