import SignSource, { SourceState } from './SignSource';
import { SERVER_CONFIG, buildWsUrl } from '../config/server.config';

/**
 * Cliente WebSocket del servidor de reconocimiento.
 *
 * Responsabilidades:
 *  - mantener la conexion viva (reintentos con backoff)
 *  - detectar conexiones zombi (socket abierto pero servidor mudo)
 *  - traducir los mensajes del servidor a SourceEvent
 *
 * Lo que NO hace: decidir si una prediccion se convierte en mensaje. De eso
 * sigue encargandose PredictionStabilizer dentro de la app.
 */
export class WebSocketSignSource extends SignSource {
  constructor(config = SERVER_CONFIG) {
    super();
    this.config = config;
    this._ws = null;
    this._onEvent = null;
    this._labels = [];
    this._retry = 0;
    this._retryTimer = null;
    this._heartbeat = null;
    this._closedByUs = false;
  }

  get id() {
    return 'websocket';
  }

  getLabels() {
    return this._labels;
  }

  get url() {
    return buildWsUrl(this.config);
  }

  connect(onEvent) {
    this._onEvent = onEvent;
    this._closedByUs = false;
    this._open();
  }

  disconnect() {
    this._closedByUs = true;
    clearTimeout(this._retryTimer);
    clearTimeout(this._heartbeat);
    this._retryTimer = this._heartbeat = null;
    if (this._ws) {
      this._ws.onopen = this._ws.onmessage = this._ws.onerror = this._ws.onclose = null;
      try {
        this._ws.close();
      } catch {
        /* el socket ya estaba muerto */
      }
      this._ws = null;
    }
    this._emit({ type: 'status', state: SourceState.IDLE });
  }

  // ------------------------------------------------------------------

  _emit(event) {
    this._onEvent?.({ ts: Date.now(), ...event });
  }

  _open() {
    this._emit({
      type: 'status',
      state: this._retry === 0 ? SourceState.CONNECTING : SourceState.RECONNECTING,
    });

    let ws;
    try {
      ws = new WebSocket(this.url);
    } catch (err) {
      this._emit({ type: 'error', message: `URL invalida: ${this.url}` });
      this._scheduleRetry();
      return;
    }
    this._ws = ws;

    ws.onopen = () => {
      this._retry = 0;
      this._armHeartbeat();
      // Handshake: la app pide el vocabulario en vez de suponerlo.
      this._send({ type: 'hello', client: 'lessa-app', wants: ['predictions', 'frames'] });
    };

    ws.onmessage = (ev) => {
      this._armHeartbeat();
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        this._emit({ type: 'error', message: 'Mensaje no es JSON valido' });
        return;
      }
      this._handle(msg);
    };

    ws.onerror = () => {
      // onerror en RN no trae detalle util; el cierre viene detras.
      this._emit({ type: 'error', message: 'Error de conexion con el servidor' });
    };

    ws.onclose = () => {
      clearTimeout(this._heartbeat);
      if (this._closedByUs) return;
      this._emit({ type: 'status', state: SourceState.OFFLINE });
      this._scheduleRetry();
    };
  }

  _handle(msg) {
    switch (msg.type) {
      case 'ready':
        this._labels = Array.isArray(msg.labels) ? msg.labels : [];
        this._emit({ type: 'status', state: SourceState.READY, labels: this._labels });
        break;

      case 'prediction':
        this._emit({
          type: 'prediction',
          label: msg.label,
          confidence: msg.confidence ?? 0,
          margin: msg.margin ?? 1,
          ts: msg.ts,
        });
        break;

      case 'no_sign':
        this._emit({ type: 'no_sign' });
        break;

      case 'frame':
        this._emit({ type: 'frame', jpegBase64: msg.jpeg, landmarks: msg.landmarks ?? null });
        break;

      case 'landmarks':
        this._emit({ type: 'landmarks', landmarks: msg });
        break;

      case 'error':
        this._emit({ type: 'error', message: msg.message ?? 'Error en el servidor' });
        break;

      default:
        // Un mensaje desconocido no debe tumbar la app: el servidor puede
        // ganar tipos nuevos sin obligar a actualizar el telefono.
        break;
    }
  }

  _send(obj) {
    if (this._ws?.readyState === 1) {
      this._ws.send(JSON.stringify(obj));
    }
  }

  /** Socket abierto pero servidor mudo = conexion muerta. */
  _armHeartbeat() {
    clearTimeout(this._heartbeat);
    this._heartbeat = setTimeout(() => {
      this._emit({ type: 'error', message: 'El servidor dejo de responder' });
      try {
        this._ws?.close();
      } catch {
        /* ya estaba cerrado */
      }
    }, this.config.heartbeatTimeoutMs);
  }

  _scheduleRetry() {
    const r = this.config.reconnect;
    if (!r.enabled) return;
    const delay = Math.min(r.initialDelayMs * r.factor ** this._retry, r.maxDelayMs);
    this._retry += 1;
    clearTimeout(this._retryTimer);
    this._retryTimer = setTimeout(() => this._open(), delay);
  }
}

export default WebSocketSignSource;
