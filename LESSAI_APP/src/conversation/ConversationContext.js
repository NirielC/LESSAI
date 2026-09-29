import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { createId } from '../utils/id';
import {
  MessageSource,
  createSignMessage,
  createVoiceMessage,
  createSystemMessage,
} from './messageFactory';

/**
 * ESTADO DE LA CONVERSACION.
 *
 * Es el punto de encuentro de los dos canales: lo que entra por LESSA y lo que
 * entra por voz terminan aqui, en la misma linea de tiempo. La pantalla de
 * Historial no es mas que una vista de este estado.
 *
 * Persistencia: hoy en memoria. `src/services/storage.js` define el adaptador
 * para enchufar AsyncStorage / SQLite sin tocar este reducer.
 */

const ConversationContext = createContext(null);

function newConversation(title = 'Conversacion') {
  return {
    id: createId('conv'),
    title,
    startedAt: Date.now(),
    messages: [],
  };
}

/** Conversacion de ejemplo para que la demo no arranque vacia. */
function seedConversation() {
  const base = Date.now() - 1000 * 60 * 14;
  const conv = newConversation('Recepcion - clinica');
  conv.startedAt = base;
  conv.messages = [
    { ...createSignMessage({ label: 'HOLA', confidence: 0.94, at: base }) },
    { ...createVoiceMessage('Hola, buenos dias. En que le puedo ayudar?'), createdAt: base + 9000 },
    { ...createSignMessage({ label: 'COMO ESTAS', confidence: 0.91, at: base + 21000 }) },
    { ...createVoiceMessage('Muy bien, gracias. Tiene cita para hoy?'), createdAt: base + 30000 },
    { ...createSignMessage({ label: 'BIEN', confidence: 0.88, at: base + 42000 }) },
    { ...createVoiceMessage('Perfecto, permitame revisar su expediente.'), createdAt: base + 51000 },
    { ...createSignMessage({ label: 'GRACIAS', confidence: 0.96, at: base + 63000 }) },
  ];
  return conv;
}

const initialState = (() => {
  const seeded = seedConversation();
  const active = newConversation('Conversacion actual');
  return { conversations: [active, seeded], activeId: active.id };
})();

function reducer(state, action) {
  switch (action.type) {
    case 'append': {
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === state.activeId ? { ...c, messages: [...c.messages, action.message] } : c
        ),
      };
    }
    case 'markSpoken': {
      return {
        ...state,
        conversations: state.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === action.id ? { ...m, spoken: true } : m)),
        })),
      };
    }
    case 'newConversation': {
      const conv = newConversation(action.title);
      return { ...state, conversations: [conv, ...state.conversations], activeId: conv.id };
    }
    case 'setActive':
      return { ...state, activeId: action.id };
    case 'clearActive':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === state.activeId ? { ...c, messages: [] } : c
        ),
      };
    case 'deleteConversation': {
      const remaining = state.conversations.filter((c) => c.id !== action.id);
      const list = remaining.length ? remaining : [newConversation('Conversacion actual')];
      return {
        ...state,
        conversations: list,
        activeId: state.activeId === action.id ? list[0].id : state.activeId,
      };
    }
    default:
      return state;
  }
}

export function ConversationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const active = useMemo(
    () => state.conversations.find((c) => c.id === state.activeId) ?? state.conversations[0],
    [state]
  );

  const addSign = useCallback((prediction) => {
    const message = createSignMessage(prediction);
    dispatch({ type: 'append', message });
    return message;
  }, []);

  const addVoice = useCallback((text, meta) => {
    const message = createVoiceMessage(text, meta);
    dispatch({ type: 'append', message });
    return message;
  }, []);

  const addSystem = useCallback((text) => {
    const message = createSystemMessage(text);
    dispatch({ type: 'append', message });
    return message;
  }, []);

  const value = useMemo(
    () => ({
      conversations: state.conversations,
      active,
      messages: active?.messages ?? [],
      addSign,
      addVoice,
      addSystem,
      markSpoken: (id) => dispatch({ type: 'markSpoken', id }),
      startNew: (title) => dispatch({ type: 'newConversation', title }),
      setActive: (id) => dispatch({ type: 'setActive', id }),
      clearActive: () => dispatch({ type: 'clearActive' }),
      remove: (id) => dispatch({ type: 'deleteConversation', id }),
      stats: {
        total: active?.messages.length ?? 0,
        signs: active?.messages.filter((m) => m.source === MessageSource.SIGN).length ?? 0,
        voice: active?.messages.filter((m) => m.source === MessageSource.VOICE).length ?? 0,
      },
    }),
    [state.conversations, active, addSign, addVoice, addSystem]
  );

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}

export function useConversation() {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error('useConversation debe usarse dentro de <ConversationProvider>');
  return ctx;
}

export { MessageSource };
export default ConversationContext;
