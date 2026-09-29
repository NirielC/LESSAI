import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import { SectionTitle, Pill } from '../components/ui';
import { colors, shadow, spacing, typography } from '../config/theme';

/**
 * INFORMACION / AYUDA.
 *
 * Contenido deliberadamente conservador: explica como usar la app y como
 * funciona el reconocimiento. No afirma datos linguisticos o estadisticos
 * sobre LESSA que no se puedan respaldar.
 */

const TIPS = [
  {
    icon: 'sunny-outline',
    title: 'Buena iluminacion',
    text: 'Luz de frente, no a contraluz. Una ventana detras tuyo oscurece las manos y el modelo pierde puntos clave.',
  },
  {
    icon: 'scan-outline',
    title: 'Encuadre completo',
    text: 'Cabeza, hombros y manos deben caber en el recuadro. Si una mano sale del cuadro, la secuencia queda incompleta.',
  },
  {
    icon: 'shirt-outline',
    title: 'Fondo despejado',
    text: 'Un fondo liso y ropa que contraste con tus manos ayudan a que la deteccion sea mas estable.',
  },
  {
    icon: 'timer-outline',
    title: 'Ritmo constante',
    text: 'Realiza la sena completa y manten la posicion un instante. El reconocimiento analiza el movimiento, no una foto.',
  },
  {
    icon: 'hand-left-outline',
    title: 'Pausa entre senas',
    text: 'Baja las manos brevemente entre una sena y otra. Asi la app sabe donde termina una y empieza la siguiente.',
  },
];

const PIPELINE = [
  { step: '1', title: 'Camara', text: 'El video en vivo alimenta el sistema, cuadro por cuadro.' },
  { step: '2', title: 'Puntos clave', text: 'De cada cuadro se extraen las posiciones de manos, brazos y rostro.' },
  { step: '3', title: 'Secuencia', text: 'Los ultimos cuadros se agrupan en una ventana temporal de movimiento.' },
  { step: '4', title: 'Modelo', text: 'La secuencia entra al modelo entrenado, que devuelve una clase y su confianza.' },
  { step: '5', title: 'Validacion', text: 'Solo si la prediccion se sostiene y supera el umbral se convierte en texto.' },
  { step: '6', title: 'Mensaje', text: 'El texto entra a la conversacion y puede reproducirse por voz.' },
];

const FAQ = [
  {
    q: 'Por que a veces no reconoce nada?',
    a: 'Si el servidor no encuentra una prediccion con suficiente confianza, envia no_sign. La app muestra que esta esperando una sena y no agrega ningun mensaje. Revisa iluminacion y encuadre, y repite la sena con un ritmo parejo.',
  },
  {
    q: 'Por que no repite la misma sena varias veces seguidas?',
    a: 'Es intencional. Tras aceptar una sena la app entra en un breve tiempo de espera y exige un cambio real antes de volver a aceptarla, para que mantener la posicion no genere mensajes duplicados.',
  },
  {
    q: 'Que senas entiende?',
    a: 'Las que contenga el modelo cargado en el servidor. La lista de etiquetas se envia a la app cuando se establece la conexion.',
  },
  {
    q: 'Necesita internet?',
    a: 'No necesita internet para el reconocimiento local de la competencia. La ESP32-CAM, el servidor y el telefono se comunican dentro de la red Wi-Fi local LESSAI_NET.',
  },
];

export default function InfoScreen({ navigation }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <View style={styles.root}>
      <ScreenHeader eyebrow="Ayuda" title="Como funciona" subtitle="Guia de uso y detalles del proyecto" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- Hero ---------- */}
        <Card padded={false} style={styles.hero}>
          <LinearGradient
            colors={['#1A4179', '#0C2240']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Pill tone="onDark" style={{ marginBottom: spacing.md }}>
              Lengua de Senas Salvadorena
            </Pill>
            <Text style={styles.heroTitle}>Que es LESSA</Text>
            <Text style={styles.heroText}>
              LESSA es la lengua de senas utilizada por la comunidad sorda de El Salvador. Como toda
              lengua de senas, tiene su propia gramatica y no es una traduccion literal del espanol:
              el significado se construye con las manos, el cuerpo y la expresion facial.
            </Text>
            <Text style={styles.heroText}>
              Esta aplicacion no pretende sustituir a un interprete humano. Su objetivo es facilitar
              intercambios cortos y cotidianos entre una persona senante y una persona oyente.
            </Text>
          </LinearGradient>
        </Card>

        {/* ---------- Pipeline ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Como se reconoce una sena</SectionTitle>
        <Card>
          {PIPELINE.map((item, i) => (
            <View key={item.step} style={styles.pipelineRow}>
              <View style={styles.pipelineLeft}>
                <View style={styles.pipelineDot}>
                  <Text style={styles.pipelineStep}>{item.step}</Text>
                </View>
                {i < PIPELINE.length - 1 ? <View style={styles.pipelineLine} /> : null}
              </View>
              <View style={styles.pipelineBody}>
                <Text style={styles.pipelineTitle}>{item.title}</Text>
                <Text style={styles.pipelineText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* ---------- Consejos ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Consejos frente a la camara</SectionTitle>
        {TIPS.map((tip) => (
          <Card key={tip.title} style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name={tip.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          </Card>
        ))}

        {/* ---------- Instrucciones ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Como usar la app</SectionTitle>
        <Card>
          {[
            'Abre la pestana LESSA y verifica que el pin aparezca conectado.',
            'Situate frente a la ESP32-CAM con las manos dentro del recuadro del preview.',
            'Realiza la sena completa y manten la posicion un momento.',
            'Cuando el servidor la reconozca y la app la estabilice, aparecera como mensaje en la conversacion.',
            'Pulsa el altavoz para que se escuche en voz alta.',
            'La otra persona responde desde la pestana Voz; todo queda en el historial.',
          ].map((line, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBullet}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{line}</Text>
            </View>
          ))}
        </Card>

        {/* ---------- Accesibilidad ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Accesibilidad</SectionTitle>
        <Card>
          <Text style={styles.bodyText}>
            La app distingue el origen de cada mensaje por posicion, icono y etiqueta, no solo por
            color, para que siga siendo legible con vision cromatica reducida. El texto reconocido
            puede reproducirse por voz, y la reproduccion automatica es opcional: se activa o
            desactiva desde el control de la pantalla principal.
          </Text>
          <Text style={[styles.bodyText, { marginTop: spacing.md }]}>
            Cuando el sistema no esta seguro, prefiere no mostrar nada antes que mostrar una
            traduccion incorrecta.
          </Text>
        </Card>

        {/* ---------- FAQ ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Preguntas frecuentes</SectionTitle>
        {FAQ.map((item, i) => {
          const open = openFaq === i;
          return (
            <Card key={i} style={styles.faqCard} onPress={() => setOpenFaq(open ? null : i)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </View>
              {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
            </Card>
          );
        })}

        {/* ---------- Proyecto ---------- */}
        <SectionTitle style={styles.sectionSpacing}>Sobre esta version</SectionTitle>
        <Card dark style={styles.projectCard}>
          <Text style={styles.projectTitle}>Demo visual</Text>
          <Text style={styles.projectText}>
            Esta build reproduce la experiencia completa con datos simulados: el reconocimiento y la
            transcripcion de voz no analizan la entrada real todavia. Toda la arquitectura ya esta en
            su lugar para conectar el modelo entrenado sin rehacer la aplicacion.
          </Text>
          <Pressable style={styles.projectLink} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="options-outline" size={16} color={colors.accent} />
            <Text style={styles.projectLinkText}>Ver parametros del reconocimiento</Text>
          </Pressable>
        </Card>

        <Text style={styles.footer}>LESSA · Demo visual 0.1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  sectionSpacing: { marginTop: spacing.xl, paddingHorizontal: 2 },

  hero: { overflow: 'hidden', ...shadow.raised },
  heroGradient: { padding: spacing.xl },
  heroTitle: { ...typography.title, color: colors.onDark, marginBottom: spacing.md },
  heroText: {
    ...typography.body,
    color: colors.onDarkSoft,
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  pipelineRow: { flexDirection: 'row' },
  pipelineLeft: { alignItems: 'center', width: 34 },
  pipelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineStep: { ...typography.micro, color: colors.primary, letterSpacing: 0 },
  pipelineLine: { width: 2, flex: 1, backgroundColor: colors.divider, marginVertical: 4 },
  pipelineBody: { flex: 1, paddingBottom: spacing.lg, paddingLeft: spacing.md },
  pipelineTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: 2 },
  pipelineText: { ...typography.caption, fontWeight: '500', color: colors.textMuted, lineHeight: 19 },

  tipCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tipTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: 3 },
  tipText: { ...typography.caption, fontWeight: '500', color: colors.textMuted, lineHeight: 19 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  stepBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 1,
  },
  stepNumber: { ...typography.micro, color: colors.onDark, letterSpacing: 0 },
  stepText: { ...typography.body, color: colors.textSoft, flex: 1, lineHeight: 21 },

  bodyText: { ...typography.body, color: colors.textSoft, lineHeight: 22 },

  faqCard: { marginBottom: spacing.sm },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { ...typography.bodyStrong, color: colors.text, flex: 1, marginRight: spacing.md },
  faqA: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  projectCard: { backgroundColor: colors.ink },
  projectTitle: { ...typography.section, color: colors.onDark, marginBottom: spacing.sm },
  projectText: { ...typography.body, color: colors.onDarkSoft, lineHeight: 22 },
  projectLink: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  projectLinkText: { ...typography.caption, color: colors.accent, marginLeft: 7 },

  footer: {
    ...typography.micro,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
