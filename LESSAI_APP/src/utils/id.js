let counter = 0;

/** Id corto y estable para mensajes / frames. No necesita ser criptografico. */
export function createId(prefix = 'id') {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export default createId;
