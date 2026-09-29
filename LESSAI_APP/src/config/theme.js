/**
 * Identidad visual de LESSA.
 *
 * Azul profundo -> autoridad, superficies protagonistas, elementos importantes.
 * Celeste       -> accion, foco, estado "en vivo".
 * Fondos claros -> el video de la camara siempre es el elemento con mas peso visual.
 */

export const colors = {
  // --- Azul profundo ---
  ink: '#0C2240',
  ink80: '#1B3A63',
  ink60: '#2F5486',
  inkOverlay: 'rgba(12, 34, 64, 0.72)',

  // --- Azul / celeste de accion ---
  primary: '#1E6BE0',
  primaryDark: '#1553B3',
  primarySoft: '#E3EDFD',
  accent: '#4EC8F5',
  accentSoft: '#E1F5FD',

  // --- Fondos ---
  bg: '#F1F5FB',
  bgAlt: '#E8EFF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F7FAFE',

  // --- Texto ---
  text: '#0C2240',
  textSoft: '#4A6585',
  textMuted: '#8698AF',
  onDark: '#FFFFFF',
  onDarkSoft: 'rgba(255,255,255,0.72)',
  onDarkFaint: 'rgba(255,255,255,0.42)',

  // --- Semantica ---
  success: '#22A06B',
  successSoft: '#E4F5EE',
  warning: '#E8A33D',
  warningSoft: '#FDF1DF',
  danger: '#DD4B39',
  dangerSoft: '#FCEAE7',
  live: '#FF4D6D',

  // --- Lineas ---
  border: '#DCE6F2',
  borderStrong: '#C3D3E6',
  divider: '#EDF2F9',

  // --- Overlay de landmarks ---
  landmarkBone: 'rgba(255,255,255,0.92)',
  landmarkPose: '#8FE3FF',
  landmarkHand: '#4EC8F5',
  landmarkFace: 'rgba(255,255,255,0.55)',
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  section: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' },
  bodyStrong: { fontSize: 15, fontWeight: '700' },
  caption: { fontSize: 13, fontWeight: '600' },
  micro: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
};

export const shadow = {
  card: {
    shadowColor: '#0C2240',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  raised: {
    shadowColor: '#0C2240',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  tabbar: {
    shadowColor: '#0C2240',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
};

export const gradients = {
  brand: ['#123B73', '#0C2240'],
  action: ['#4EC8F5', '#1E6BE0'],
  cameraTop: ['rgba(12,34,64,0.85)', 'rgba(12,34,64,0)'],
  cameraBottom: ['rgba(12,34,64,0)', 'rgba(12,34,64,0.92)'],
};

export default { colors, radius, spacing, typography, shadow, gradients };
