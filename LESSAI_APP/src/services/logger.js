/**
 * Logger minimo con namespaces. Evita console.log sueltos por el codigo
 * y permite silenciar el pipeline en produccion.
 */
const ENABLED = __DEV__;

function build(ns) {
  return {
    debug: (...args) => ENABLED && console.log(`[${ns}]`, ...args),
    warn: (...args) => ENABLED && console.warn(`[${ns}]`, ...args),
    error: (...args) => console.error(`[${ns}]`, ...args),
  };
}

export const logger = build('lessa');
export const createLogger = build;
export default createLogger;
