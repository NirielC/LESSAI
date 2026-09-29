/** Estados posibles de la pantalla de reconocimiento. Unica fuente de verdad. */
export const CameraState = {
  IDLE: 'idle',
  REQUESTING_PERMISSION: 'requesting',
  PERMISSION_DENIED: 'denied',
  INITIALIZING: 'initializing',
  READY: 'ready',
  CAPTURING: 'capturing',
  ANALYZING: 'analyzing',
  DETECTED: 'detected',
  NO_SIGN: 'no_sign',
  ERROR: 'error',
};

/** Copy y color asociados a cada estado. La UI no inventa textos sueltos. */
export const CAMERA_STATE_META = {
  [CameraState.IDLE]: { label: 'Listo para empezar', tone: 'neutral', icon: 'videocam-outline' },
  [CameraState.REQUESTING_PERMISSION]: { label: 'Solicitando permiso', tone: 'neutral', icon: 'lock-closed-outline' },
  [CameraState.PERMISSION_DENIED]: { label: 'Sin permiso de camara', tone: 'danger', icon: 'lock-closed' },
  [CameraState.INITIALIZING]: { label: 'Iniciando camara', tone: 'neutral', icon: 'sync-outline' },
  [CameraState.READY]: { label: 'Camara lista', tone: 'neutral', icon: 'checkmark-circle-outline' },
  [CameraState.CAPTURING]: { label: 'Capturando movimiento', tone: 'live', icon: 'radio-button-on' },
  [CameraState.ANALYZING]: { label: 'Analizando secuencia', tone: 'info', icon: 'pulse' },
  [CameraState.DETECTED]: { label: 'Sena reconocida', tone: 'success', icon: 'checkmark-circle' },
  [CameraState.NO_SIGN]: { label: 'Sin sena detectada', tone: 'muted', icon: 'hand-left-outline' },
  [CameraState.ERROR]: { label: 'Error de camara', tone: 'danger', icon: 'alert-circle' },
};

export default CameraState;
