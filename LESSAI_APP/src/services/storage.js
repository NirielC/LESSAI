/**
 * ADAPTADOR DE PERSISTENCIA.
 *
 * La demo guarda todo en memoria. Cuando haga falta persistir el historial,
 * basta con cambiar `activeAdapter` por uno basado en AsyncStorage o SQLite:
 * el reducer de conversacion no cambia.
 */

const memory = new Map();

export const MemoryStorageAdapter = {
  id: 'memory',
  async get(key) {
    return memory.has(key) ? JSON.parse(memory.get(key)) : null;
  },
  async set(key, value) {
    memory.set(key, JSON.stringify(value));
  },
  async remove(key) {
    memory.delete(key);
  },
  async clear() {
    memory.clear();
  },
};

/**
 * Implementacion prevista cuando se agregue @react-native-async-storage/async-storage:
 *
 * export const AsyncStorageAdapter = {
 *   id: 'async-storage',
 *   get: async (k) => JSON.parse((await AsyncStorage.getItem(k)) ?? 'null'),
 *   set: (k, v) => AsyncStorage.setItem(k, JSON.stringify(v)),
 *   remove: (k) => AsyncStorage.removeItem(k),
 *   clear: () => AsyncStorage.clear(),
 * };
 */

export const storage = MemoryStorageAdapter;

export const StorageKeys = {
  CONVERSATIONS: 'lessa:conversations',
  SETTINGS: 'lessa:settings',
};

export default storage;
