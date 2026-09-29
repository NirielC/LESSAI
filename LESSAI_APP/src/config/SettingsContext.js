import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { RECOGNITION_CONFIG, ENGINE_CONFIG } from './recognition.config';

const SettingsContext = createContext(null);

/**
 * Expone la configuracion de reconocimiento como estado vivo.
 * Las pantallas leen de aqui; nadie importa RECOGNITION_CONFIG directamente
 * salvo para conocer los valores por defecto.
 */
export function SettingsProvider({ children }) {
  const [config, setConfig] = useState(RECOGNITION_CONFIG);

  const setValue = useCallback((key, value) => {
    setConfig((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const toggle = useCallback((key) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const reset = useCallback(() => setConfig(RECOGNITION_CONFIG), []);

  const value = useMemo(
    () => ({ config, setValue, toggle, reset, engine: ENGINE_CONFIG }),
    [config, setValue, toggle, reset]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de <SettingsProvider>');
  return ctx;
}

export default SettingsContext;
